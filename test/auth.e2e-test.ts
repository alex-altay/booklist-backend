import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { AuthDto, RecoverDto, ResetDto } from '../src/auth/dto'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../src/prisma/prisma.service'
import type { Server } from 'net'

const SIGN_UP_URL = '/auth/signup'
const SIGN_IN_URL = '/auth/signin'
const RECOVER_PASSWORD_URL = '/auth/recover-password'
const RESET_PASSWORD_URL = '/auth/reset-password'

jest.mock('../src/mail/mail.service', () => {
  return {
    MailService: jest.fn().mockImplementation(() => ({
      sendPasswordResetEmail: jest.fn(),
    })),
  }
})

describe('AuthController (e2e)', () => {
  let app: INestApplication<Server>
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    )
    await app.init()

    prisma = moduleFixture.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    const tablenames = await prisma.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ')

    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
    } catch (error: unknown) {
      console.warn({ error })
    }
  })

  describe(`POST ${SIGN_UP_URL}`, () => {
    it('should return access token', async () => {
      const authDto: AuthDto = { email: 'test@example.com', password: 'password' }

      const response = await request(app.getHttpServer())
        .post(SIGN_UP_URL)
        .send(authDto)
        .expect(201)

      expect(response.body).toHaveProperty('access_token')
      expect(typeof (response.body as { access_token: unknown }).access_token).toBe('string')
    })

    it('should throw an error if an email is already taken', async () => {
      const authDto: AuthDto = { email: 'test@example.com', password: 'password' }

      await request(app.getHttpServer()).post(SIGN_UP_URL).send(authDto).expect(201)

      const secondResponse = await request(app.getHttpServer())
        .post(SIGN_UP_URL)
        .send(authDto)
        .expect(403)

      expect(secondResponse.body).toEqual({
        error: 'Forbidden',
        message: 'The email has already been used',
        statusCode: 403,
      })
    })

    it('should throw an error if an email is not valid', async () => {
      const authDto: AuthDto = { email: 'incorrect_email', password: 'password' }

      const response = await request(app.getHttpServer())
        .post(SIGN_UP_URL)
        .send(authDto)
        .expect(400)

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: ['email must be an email'],
        statusCode: 400,
      })
    })

    it('should throw an error if password is empty', async () => {
      const authDto: AuthDto = { email: 'test@example.com', password: '' }

      const response = await request(app.getHttpServer())
        .post(SIGN_UP_URL)
        .send(authDto)
        .expect(400)

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: ['password should not be empty'],
        statusCode: 400,
      })
    })
  })

  describe(`POST ${SIGN_IN_URL}`, () => {
    it('should return access token', async () => {
      const authDto: AuthDto = { email: 'test@example.com', password: 'password' }

      await request(app.getHttpServer()).post(SIGN_UP_URL).send(authDto).expect(201)

      const response = await request(app.getHttpServer())
        .post(SIGN_IN_URL)
        .send(authDto)
        .expect(200)

      expect(response.body).toHaveProperty('access_token')
      expect(typeof (response.body as { access_token: unknown }).access_token).toBe('string')
    })

    it('should throw an error if an email is not valid', async () => {
      const authDto: AuthDto = { email: 'incorrect_email', password: 'password' }

      const response = await request(app.getHttpServer())
        .post(SIGN_IN_URL)
        .send(authDto)
        .expect(400)

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: ['email must be an email'],
        statusCode: 400,
      })
    })

    it('should throw an error if an email is not existed', async () => {
      const authDto: AuthDto = { email: 'notexisted@email.com', password: 'password' }

      const response = await request(app.getHttpServer())
        .post(SIGN_IN_URL)
        .send(authDto)
        .expect(403)

      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'Credentials are incorrect',
        statusCode: 403,
      })
    })

    it('should throw an error if password is wrong', async () => {
      const signUpDto: AuthDto = { email: 'email@email.com', password: '123' }
      const signInDto: AuthDto = { email: 'email@email.com', password: 'wrong_password' }

      await request(app.getHttpServer()).post(SIGN_UP_URL).send(signUpDto).expect(201)

      const response = await request(app.getHttpServer())
        .post(SIGN_IN_URL)
        .send(signInDto)
        .expect(403)

      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'Credentials are incorrect',
        statusCode: 403,
      })
    })
  })

  describe(`POST ${RECOVER_PASSWORD_URL}`, () => {
    it('should return message', async () => {
      const recoverDto: RecoverDto = { email: 'test@example.com' }

      const response = await request(app.getHttpServer())
        .post(RECOVER_PASSWORD_URL)
        .send(recoverDto)
        .expect(200)

      expect(response.body).toEqual({
        message: 'Check your email',
      })
    })

    it('should throw an error if an email is not valid', async () => {
      const recoverDto: RecoverDto = { email: 'incorrect_email' }

      const response = await request(app.getHttpServer())
        .post(RECOVER_PASSWORD_URL)
        .send(recoverDto)
        .expect(400)

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: ['email must be an email'],
        statusCode: 400,
      })
    })
  })

  describe(`POST ${RESET_PASSWORD_URL}`, () => {
    it('whole resetting password flow should work as expected', async () => {
      const EMAIL = 'test@example.com'
      const FIRST_PASS = 'first-password'
      const SECOND_PASS = 'second-password'

      // 1. Create user
      const authDto: AuthDto = { email: EMAIL, password: FIRST_PASS }
      await request(app.getHttpServer()).post(SIGN_UP_URL).send(authDto).expect(201)

      // 2. There should be no reset token in DB for new user
      const createdUser = await prisma.user.findUnique({ where: { email: EMAIL } })
      const initialResetToken = createdUser?.resetToken
      const initialPassHash = createdUser?.passwordHash
      expect(initialResetToken).toBeNull()

      // 3. Recover password - ask for sending token via email
      const recoverDto: RecoverDto = { email: EMAIL }
      await request(app.getHttpServer()).post(RECOVER_PASSWORD_URL).send(recoverDto).expect(200)
      const updatedUser = await prisma.user.findUnique({ where: { email: EMAIL } })
      const resetToken = updatedUser?.resetToken
      expect(resetToken).toBeTruthy()

      // 3. Reset password with token
      const resetDto: ResetDto = {
        email: EMAIL,
        resetToken: resetToken!,
        password: SECOND_PASS,
      }
      await request(app.getHttpServer()).post(RESET_PASSWORD_URL).send(resetDto).expect(200)

      // 4. Check if password is changed
      const finalUser = await prisma.user.findUnique({ where: { email: EMAIL } })
      const finalPassHash = finalUser?.passwordHash
      expect(finalPassHash).not.toEqual(initialPassHash)
    })

    it('should throw an error if reset Token is not valid', async () => {
      const resetDto: ResetDto = {
        email: 'test@example.com',
        resetToken: 'invalid-token',
        password: 'new-password',
      }

      const response = await request(app.getHttpServer())
        .post(RESET_PASSWORD_URL)
        .send(resetDto)
        .expect(403)

      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'The link has expired. Try again from the start',
        statusCode: 403,
      })
    })

    it('should throw an error if an email is not valid', async () => {
      const resetDto: ResetDto = {
        email: 'incorrect_email',
        resetToken: 'invalid-token',
        password: 'new-password',
      }

      const response = await request(app.getHttpServer())
        .post(RESET_PASSWORD_URL)
        .send(resetDto)
        .expect(400)

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: ['email must be an email'],
        statusCode: 400,
      })
    })

    it('should throw an error if password is empty', async () => {
      const resetDto: ResetDto = {
        email: 'test@example.com',
        resetToken: 'invalid-token',
        password: '',
      }

      const response = await request(app.getHttpServer())
        .post(RESET_PASSWORD_URL)
        .send(resetDto)
        .expect(400)

      expect(response.body).toEqual({
        error: 'Bad Request',
        message: ['password should not be empty'],
        statusCode: 400,
      })
    })
  })
})
