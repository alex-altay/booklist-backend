import { AuthentificationDto, RegistrationDto } from './dto'
import { BadRequestException, Injectable, RequestTimeoutException } from '@nestjs/common'
import { ChallengeService } from '../challenge/challenge.service'
import { ConfigService } from '@nestjs/config'
import { ERRORS } from '../utils/errors'
import { JwtService } from '@nestjs/jwt'
import { PrismaClient, type User } from '@prisma/client'
import { base64urlToBuffer, bufferToBase64url, assertToBase64Url } from '../utils/base64'
import { randomUUID } from 'crypto'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'

const EXPIRATION_TIME = 5 * 60 * 1000
const REQUEST_TIMEOUT = 60 * 1000

@Injectable()
export class WebauthnService {
  private domainName: string
  private rpName: string
  private rpID: string
  private prisma = new PrismaClient()

  constructor(
    private readonly configService: ConfigService,
    private readonly challengeService: ChallengeService,
    private readonly jwtService: JwtService,
  ) {
    this.domainName = this.configService.get<string>('DOMAIN_NAME')!
    this.rpName = this.configService.get<string>('RP_NAME')!
    this.rpID = this.configService.get<string>('RP_ID')!
  }

  async generateRegistration(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (user) {
      throw new BadRequestException(ERRORS.EMAIL_HAS_BEEN_USED)
    }
    try {
      const options = await generateRegistrationOptions({
        rpName: this.rpName,
        rpID: this.rpID,
        userName: email,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
        timeout: REQUEST_TIMEOUT,
      })
      const requestId = randomUUID()
      const expiresAt = new Date(Date.now() + EXPIRATION_TIME)
      const challenge = assertToBase64Url(options.challenge)
      await this.challengeService.create(requestId, 'REGISTRATION', challenge, expiresAt)
      return { requestId, options, email }
    } catch {
      throw new RequestTimeoutException(ERRORS.REQUEST_TIMEOUT)
    }
  }

  async verifyRegistration(registration: RegistrationDto) {
    const { response, requestId, email } = registration
    const registrationChallenge = await this.challengeService.get(requestId, 'REGISTRATION')
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: registrationChallenge.challenge,
      expectedOrigin: this.domainName,
      expectedRPID: this.rpID,
      requireUserVerification: true,
    })
    if (!verification.verified) {
      await this.challengeService.update(requestId, { isConsumed: true })
      throw new BadRequestException(ERRORS.VERIFICATION_FAILED)
    }

    const { credential, fmt, aaguid } = verification.registrationInfo
    const user = await this.prisma.user.create({ data: { email } })
    const credentialId = base64urlToBuffer(credential.id)
    await this.prisma.passKey.create({
      data: {
        credentialId,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports || [],
        fmt,
        aaguid,
        userId: user.id,
      },
    })
    await this.challengeService.update(requestId, { isConsumed: true, userId: user.id })
    return { verified: true }
  }

  async generateAuthenticationOptions() {
    try {
      const options = await generateAuthenticationOptions({
        userVerification: 'preferred',
        timeout: REQUEST_TIMEOUT,
        rpID: this.rpID,
      })
      const requestId = randomUUID()
      const expiresAt = new Date(Date.now() + EXPIRATION_TIME)
      const challenge = assertToBase64Url(options.challenge)
      await this.challengeService.create(requestId, 'AUTHENTICATION', challenge, expiresAt)
      return { requestId, options }
    } catch {
      throw new RequestTimeoutException(ERRORS.REQUEST_TIMEOUT)
    }
  }

  async verifyAuthentication(authentication: AuthentificationDto) {
    const { requestId, response } = authentication
    const authChallenge = await this.challengeService.get(requestId, 'AUTHENTICATION')
    const credentialId = base64urlToBuffer(response.rawId)
    const passkey = await this.prisma.passKey.findUniqueOrThrow({ where: { credentialId } })
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: authChallenge.challenge,
      expectedOrigin: this.domainName,
      expectedRPID: this.rpID,
      credential: {
        id: bufferToBase64url(passkey.credentialId),
        publicKey: passkey.publicKey as Uint8Array<ArrayBuffer>,
        counter: Number(passkey.counter),
      },
    })

    if (!verification.verified) {
      await this.challengeService.update(requestId, { isConsumed: true })
      throw new BadRequestException(ERRORS.VERIFICATION_FAILED)
    }

    await this.prisma.passKey.update({
      where: { id: passkey.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter ?? 0) },
    })
    await this.challengeService.update(requestId, { isConsumed: true, userId: passkey.userId })
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: passkey.userId } })
    return this.signToken(user.id, user.email)
  }

  async signToken(id: User['id'], email: User['email']) {
    const payload = { sub: id, email }
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_EXPIRE_TIME')!,
      secret: this.configService.get('JWT_SECRET')!,
    })
    return { access_token }
  }
}
