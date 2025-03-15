import { $Enums, type Book } from '@prisma/client'
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum, IsISO8601 } from 'class-validator'

export class BookDto implements Partial<Book> {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  author: string

  @IsOptional()
  @IsEnum($Enums.Language)
  language: $Enums.Language

  @IsOptional()
  @IsISO8601()
  startDate: Date | null

  @IsOptional()
  @IsISO8601()
  endDate: Date | null

  @IsOptional()
  @IsBoolean()
  hasFinished: boolean | null

  @IsOptional()
  @IsString()
  description: string | null

  @IsOptional()
  @IsEnum($Enums.Rating)
  rating: $Enums.Rating | null

  @IsOptional()
  @IsEnum($Enums.Category)
  category: $Enums.Category | null
}
