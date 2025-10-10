import * as request from 'supertest'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { Server } from 'http'
import type { Response } from 'supertest'

const DUMMY_RAW_ID = 'ZHVtbXktaWQ' // 'dummy-id' in base64

type RegistrationOptionsBody = {
  requestId: `${string}-${string}-${string}-${string}-${string}`
  options: PublicKeyCredentialCreationOptionsJSON
  email: string
}

type AuthOptionsBody = {
  requestId: `${string}-${string}-${string}-${string}-${string}`
  options: PublicKeyCredentialRequestOptionsJSON
}

jest.mock('@simplewebauthn/server', () => {
  return {
    generateRegistrationOptions: jest.fn(() => ({
      challenge: Buffer.from('reg-challenge'),
      rpName: 'rp',
      rpID: 'rp.local',
      userName: 'test@example.com',
    })),
    verifyRegistrationResponse: jest.fn(() => ({
      verified: true,
      registrationInfo: {
        credential: {
          id: DUMMY_RAW_ID,
          publicKey: Buffer.from('pubkey'),
          counter: 0,
          transports: [],
        },
        fmt: 'none',
        aaguid: 'aaguid',
      },
    })),
    generateAuthenticationOptions: jest.fn(() => ({
      challenge: Buffer.from('auth-challenge'),
      userVerification: 'preferred',
    })),
    verifyAuthenticationResponse: jest.fn(() => ({
      verified: true,
      authenticationInfo: { newCounter: 1 },
    })),
  }
})

describe('WebAuthn (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let _jwtService: JwtService
  let server: Server

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    })

    moduleBuilder.overrideProvider(JwtService).useValue({
      signAsync: jest.fn().mockResolvedValue('test-token'),
    })

    const moduleFixture: TestingModule = await moduleBuilder.compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    prisma = moduleFixture.get(PrismaService)
    _jwtService = moduleFixture.get(JwtService)

    server = app.getHttpServer() as Server
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ')

    if (tables.length) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
    }
  })

  it('should generate registration options and register a new user + passKey', async () => {
    const email = 'test@example.com'

    const regOptionsResponse = (await request(server)
      .get(`/webauthn/register/option/${encodeURIComponent(email)}`)
      .expect(200)) as Response

    const registrationOptionsBody = regOptionsResponse.body as RegistrationOptionsBody
    expect(registrationOptionsBody).toHaveProperty('requestId')
    expect(registrationOptionsBody).toHaveProperty('options')
    expect(registrationOptionsBody.email).toBe(email)
    const { requestId } = registrationOptionsBody

    const registrationDto = {
      requestId,
      email,
      response: {
        id: 'ignored',
      },
    }

    const registrationResponse = await request(server)
      .post('/webauthn/register')
      .send(registrationDto)
      .expect(200)
    expect(registrationResponse.body).toEqual({ verified: true })

    const storedUser = await prisma.user.findUnique({ where: { email } })
    expect(storedUser).toBeTruthy()

    const storedPassKey = await prisma.passKey.findFirst({ where: { userId: storedUser!.id } })
    expect(storedPassKey).toBeTruthy()
    expect(storedPassKey!.credentialId).toBeTruthy()
  })

  it('should generate authentication options and authenticate using stored passKey', async () => {
    const email = 'auth@example.com'

    const createdUser = await prisma.user.create({ data: { email } })
    const credentialId = Buffer.from('dummy-id')
    await prisma.passKey.create({
      data: {
        credentialId,
        publicKey: Buffer.from('pubkey'),
        counter: BigInt(0),
        transports: [],
        fmt: 'none',
        aaguid: 'aaguid',
        userId: createdUser.id,
      },
    })

    const authOptionsResponse = await request(server)
      .get('/webauthn/authenticate/option')
      .expect(200)

    const authOptionsBody = authOptionsResponse.body as AuthOptionsBody
    expect(authOptionsBody).toHaveProperty('requestId')
    expect(authOptionsBody).toHaveProperty('options')
    const { requestId } = authOptionsBody

    const authDto = {
      requestId,
      response: {
        rawId: DUMMY_RAW_ID,
      },
    }

    const authenticationResponse = await request(server)
      .post('/webauthn/authenticate')
      .send(authDto)
      .expect(200)

    const authResponseBody = authenticationResponse.body as { access_token: string }
    expect(authResponseBody).toHaveProperty('access_token')
    expect(authResponseBody.access_token).toBe('test-token')
  })
})
