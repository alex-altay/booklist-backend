import { $Enums, type Book } from '@prisma/client'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'

export class BookDto implements Partial<Book> {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  author: string

  @ApiPropertyOptional({ enum: Object.values($Enums.Language), required: false })
  @IsOptional()
  @IsEnum($Enums.Language)
  language?: $Enums.Language

  @ApiPropertyOptional({ type: String, format: 'date-time', required: false, nullable: true })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date | null

  @ApiPropertyOptional({ type: String, format: 'date-time', required: false, nullable: true })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date | null

  @ApiPropertyOptional({ type: Boolean, required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  hasFinished?: boolean | null

  @ApiPropertyOptional({ type: String, required: false, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null

  @ApiPropertyOptional({ enum: Object.values($Enums.Rating), required: false, nullable: true })
  @IsOptional()
  @IsEnum($Enums.Rating)
  rating?: $Enums.Rating | null

  @ApiPropertyOptional({ enum: Object.values($Enums.Category), required: false, nullable: true })
  @IsOptional()
  @IsEnum($Enums.Category)
  category?: $Enums.Category | null
}
