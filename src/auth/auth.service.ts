import * as argon from 'argon2'
import { AuthDto, RecoverDto } from './dto'
import { ConfigService } from '@nestjs/config'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { MailService } from '../mail/mail.service'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaService } from '../prisma/prisma.service'
import { ResetDto } from './dto/reset.dto'
import { randomBytes } from 'crypto'
import { type User } from '@prisma/client'

const PRISMA_ERRORS_CODES = {
  EMAIL_ALREADY_REGISTERED: 'P2002',
} as const

const USER_MESSAGES = {
  CHECK_EMAIL: 'Check your email',
  EMAIL_IS_USED: 'The email has already been used',
  EXPIRED_LINK: 'The link has expired. Try again from the start',
  WRONG_CREDENTIALS: 'Credentials are incorrect',
} as const

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) {
      throw new ForbiddenException(USER_MESSAGES.WRONG_CREDENTIALS)
    }

    const isPasswordMatches = await argon.verify(user.passwordHash, dto.password)
    if (!isPasswordMatches) {
      throw new ForbiddenException(USER_MESSAGES.WRONG_CREDENTIALS)
    }

    return this.signToken(user.id, user.email)
  }

  async signup(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password)
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hash,
        },
      })
      return this.signToken(user.id, user.email)
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code == PRISMA_ERRORS_CODES.EMAIL_ALREADY_REGISTERED
      ) {
        throw new ForbiddenException(USER_MESSAGES.EMAIL_IS_USED)
      }
      throw error
    }
  }

  async recoverPassword(dto: RecoverDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) {
      return { message: USER_MESSAGES.CHECK_EMAIL }
    }
    const resetToken = randomBytes(64).toString('hex')
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { resetToken },
    })
    const domain = this.config.get<string>('DOMAIN_NAME')
    const url = new URL(
      `${domain}/auth/recover-password?resetToken=${resetToken}&email=${dto.email}`,
    )
    void this.mailService.sendPasswordResetEmail(dto.email, url.href)
    return { message: USER_MESSAGES.CHECK_EMAIL }
  }

  async resetPassword(dto: ResetDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (user && user.resetToken == dto.resetToken) {
      const hash = await argon.hash(dto.password)
      await this.prisma.user.update({
        where: { email: dto.email },
        data: { passwordHash: hash, resetToken: null },
      })
      return this.signToken(user.id, user.email)
    } else {
      throw new ForbiddenException(USER_MESSAGES.EXPIRED_LINK)
    }
  }

  async signToken(id: User['id'], email: User['email']) {
    const payload = { sub: id, email }
    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_EXPIRE_TIME'),
      secret: this.config.get('JWT_SECRET'),
    })
    return { access_token }
  }
}
