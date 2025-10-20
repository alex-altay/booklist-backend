import { BookDto } from './dto/book.dto'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { Book, User } from '@prisma/client'

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  async createBook(
    userId: User['id'],
    bookDto: BookDto,
  ): Promise<{ allBooks: Book[]; newBook: Book }> {
    const newBook = await this.prisma.book.create({
      data: { ...bookDto, userId },
    })
    const allBooks = await this.getBooks(userId)
    return { allBooks, newBook }
  }

  async getBooks(userId: User['id']): Promise<Book[]> {
    return await this.prisma.book.findMany({
      where: { userId },
    })
  }

  async getBookById(id: Book['id'], userId: User['id']): Promise<Book> {
    return await this.prisma.book.findUniqueOrThrow({
      where: { id, userId },
    })
  }

  async updateBook(id: Book['id'], userId: User['id'], bookDto: BookDto): Promise<Book> {
    const updatedBook = await this.prisma.book.update({
      where: { id, userId },
      data: { ...bookDto },
    })
    return updatedBook
  }

  async deleteBook(id: Book['id'], userId: User['id']): Promise<Book[]> {
    await this.prisma.book.delete({ where: { id, userId } })
    return await this.getBooks(userId)
  }
}
