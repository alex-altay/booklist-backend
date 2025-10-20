import * as request from 'supertest'
import type { Server } from 'http'
import { AppModule } from '../src/app.module'
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common'
import { JwtGuard } from '../src/webauthn/guard'
import { PrismaService } from '../src/prisma/prisma.service'
import { Test, TestingModule } from '@nestjs/testing'
import { Book } from '@prisma/client'

describe('BookModule (e2e)', () => {
  let app: INestApplication
  let server: Server
  let prisma: PrismaService
  let currentUserId = 0

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtGuard)
      .useValue({
        canActivate: (context: ExecutionContext): boolean => {
          const req = context.switchToHttp().getRequest<{ user?: { userId: number } }>()
          req.user = { userId: currentUserId }
          return true
        },
      })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    prisma = moduleFixture.get(PrismaService)
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

    const created = await prisma.user.create({ data: { email: `test+${Date.now()}@example.test` } })
    currentUserId = created.id
  })

  it('POST /books/create - valid payload -> creates book in DB', async () => {
    const payload = {
      title: 'Test Book',
      author: 'Author',
      startDate: '2025-10-20T00:00:00.000Z',
      endDate: null,
      hasFinished: false,
      description: 'desc',
    }

    const response = await request(server).post('/books/create').send(payload).expect(201)
    expect(response.body).toHaveProperty('newBook')
    const newBook = (response.body as { newBook: Book; allBooks: Book[] }).newBook
    const createdId: number = newBook.id

    const stored = await prisma.book.findUnique({ where: { id: createdId } })
    expect(stored).toBeTruthy()
    expect(stored!.title).toBe(payload.title)
    expect(stored!.author).toBe(payload.author)
    expect(stored!.userId).toBe(currentUserId)
  })

  it('POST /books/create - missing required field -> returns 400 and no record created', async () => {
    const badRequest = { author: 'Author only' }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('POST /books/create - invalid enum (language) -> 400 and no record', async () => {
    const badRequest = {
      title: 'T',
      author: 'A',
      language: 'NOT_A_LANGUAGE',
    }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('POST /books/create - invalid boolean (hasFinished as number) -> 400 and no record', async () => {
    const badRequest = {
      title: 'T',
      author: 'A',
      hasFinished: 123,
    }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('PATCH /books/update/:id - partial update changes only provided fields', async () => {
    const created = await prisma.book.create({
      data: {
        title: 'Original Title',
        author: 'Original Author',
        userId: currentUserId,
      },
    })

    const payload = { author: 'Original Author', title: 'Updated Title' }
    const response = await request(server)
      .patch(`/books/update/${created.id}`)
      .send(payload)
      .expect(200)
    expect(response.body).toHaveProperty('id', created.id)

    const updated = await prisma.book.findUnique({ where: { id: created.id } })
    expect(updated!.title).toBe('Updated Title')
    expect(updated!.author).toBe('Original Author')
  })

  it('PATCH /books/update/:id - clear nullable field with null -> sets field to null', async () => {
    const data = {
      title: 'HasFlag',
      author: 'Auth',
      hasFinished: false,
      userId: currentUserId,
    }
    const created = await prisma.book.create({ data })

    const payload = { title: 'HasFlag', author: 'Auth', hasFinished: null }
    await request(server).patch(`/books/update/${created.id}`).send(payload).expect(200)
    const updated = await prisma.book.findUnique({ where: { id: created.id } })
    expect(updated!.hasFinished).toBeNull()
  })

  it('PATCH /books/update/:id - date as string timestamp "12345" should not broke anything', async () => {
    const data = {
      title: 'Title',
      author: 'Author',
      userId: currentUserId,
    }
    const created = await prisma.book.create({ data })

    const payload = { title: 'Title', author: 'Author', startDate: '123456' }
    await request(server).patch(`/books/update/${created.id}`).send(payload).expect(200)
    const updated = await prisma.book.findUnique({ where: { id: created.id } })
    expect(updated!.startDate).not.toBeNull()
  })

  it('PATCH /books/update/:id - date as NUMBER.MIN_SAFE_INTEGER should not broke anything', async () => {
    const data = {
      title: 'Title',
      author: 'Author',
      userId: currentUserId,
    }
    const created = await prisma.book.create({ data })

    const payload = { title: 'Title', author: 'Author', startDate: Number.MIN_SAFE_INTEGER }
    await request(server).patch(`/books/update/${created.id}`).send(payload).expect(400)
    const updated = await prisma.book.findUnique({ where: { id: created.id } })
    expect(updated!.startDate).toBeNull()
  })

  it('DELETE /books/delete/:id - deletes book', async () => {
    const created = await prisma.book.create({
      data: {
        title: 'ToDelete',
        author: 'X',
        userId: currentUserId,
      },
    })

    await request(server).delete(`/books/delete/${created.id}`).expect(200)
    const found = await prisma.book.findUnique({ where: { id: created.id } })
    expect(found).toBeNull()
  })

  it('PATCH /books/update/:id - date as a really big timestamp should throw an error', async () => {
    const data = {
      title: 'Title',
      author: 'Author',
      userId: currentUserId,
    }
    const created = await prisma.book.create({ data })

    const payload = { title: 'Title', author: 'Author', startDate: '539539579374592' }
    await request(server).patch(`/books/update/${created.id}`).send(payload).expect(400)
    const updated = await prisma.book.findUnique({ where: { id: created.id } })
    expect(updated!.startDate).toBeNull()
  })

  it('POST /books/create - invalid startDate format -> 400 and no record', async () => {
    const badRequest = {
      title: 'T',
      author: 'A',
      startDate: 'not-a-date',
    }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('POST /books/create - valid endDate type (number - timestamp is ok) -> 201', async () => {
    const createRequest = {
      title: 'T',
      author: 'A',
      endDate: 12345,
    }
    await request(server).post('/books/create').send(createRequest).expect(201)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(1)
  })

  it('POST /books/create - invalid hasFinished type (string) -> 400 and no record', async () => {
    const badRequest = {
      title: 'T',
      author: 'A',
      hasFinished: 'not-a-bool',
    }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('POST /books/create - invalid description type (number) -> 400 and no record', async () => {
    const badRequest = {
      title: 'T',
      author: 'A',
      description: 123,
    }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('POST /books/create - invalid rating enum -> 400 and no record', async () => {
    const badRequest = {
      title: 'T',
      author: 'A',
      rating: 'NOT_A_RATING',
    }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('POST /books/create - invalid category enum -> 400 and no record', async () => {
    const badRequest = {
      title: 'T',
      author: 'A',
      category: 'NOT_A_CATEGORY',
    }
    await request(server).post('/books/create').send(badRequest).expect(400)
    const books = await prisma.book.findMany()
    expect(books.length).toBe(0)
  })

  it('POST /books/create - valid payload with explicit nulls for nullable fields -> creates book with nulls', async () => {
    const payload = {
      title: 'Nullables Test',
      author: 'Author',
      startDate: null,
      endDate: null,
      hasFinished: null,
      description: null,
      rating: null,
      category: null,
    }
    const response = await request(server).post('/books/create').send(payload).expect(201)
    expect(response.body).toHaveProperty('newBook')
    const newBook = (response.body as { newBook: Book }).newBook

    const stored = await prisma.book.findUnique({ where: { id: newBook.id } })
    expect(stored).toBeTruthy()
    expect(stored!.startDate).toBeNull()
    expect(stored!.endDate).toBeNull()
    expect(stored!.hasFinished).toBeNull()
    expect(stored!.description).toBeNull()
    expect(stored!.rating).toBeNull()
    expect(stored!.category).toBeNull()
  })
})
