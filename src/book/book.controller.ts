import { BookService } from './book.service'
import { BookDto } from './dto'
import { GetUser } from '../auth/decorator'
import { JwtGuard } from '../auth/guard'
import {
  Controller,
  Body,
  Get,
  Post,
  UseGuards,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common'
import type { Book, User } from '@prisma/client'

@UseGuards(JwtGuard)
@Controller('books')
export class BookController {
  constructor(private bookService: BookService) {}

  @Post('create')
  createBook(@GetUser('userId') userId: User['id'], @Body() bookDto: BookDto) {
    return this.bookService.createBook(userId, bookDto)
  }

  @Get()
  getBooks(@GetUser('userId') userId: User['id']) {
    return this.bookService.getBooks(userId)
  }

  @Get(':id')
  getBookById(@Param('id', ParseIntPipe) id: Book['id'], @GetUser('userId') userId: User['id']) {
    return this.bookService.getBookById(id, userId)
  }

  @Patch('update/:id')
  updateBook(
    @Param('id', ParseIntPipe) id: Book['id'],
    @GetUser('userId') userId: User['id'],
    @Body() bookDto: BookDto,
  ) {
    return this.bookService.updateBook(id, userId, bookDto)
  }

  @Delete('delete/:id')
  deleteBook(@Param('id', ParseIntPipe) id: Book['id'], @GetUser('userId') userId: User['id']) {
    return this.bookService.deleteBook(id, userId)
  }
}
