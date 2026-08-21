import { $Enums, type Book } from '@prisma/client'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsEnum, Validate } from 'class-validator'
import { IsValidDateConstraint, swaggerDateDescription, transformDate } from '../../utils/dates'
import { Transform } from 'class-transformer'

export class BookDto implements Partial<Book> {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  author: string

  @ApiPropertyOptional({ enum: Object.values($Enums.Language), required: false, nullable: true })
  @IsOptional()
  @IsEnum($Enums.Language)
  language?: $Enums.Language | null

  @ApiPropertyOptional(swaggerDateDescription)
  @IsOptional()
  @Transform(transformDate)
  @Validate(IsValidDateConstraint)
  startDate?: Date | null

  @ApiPropertyOptional(swaggerDateDescription)
  @IsOptional()
  @Transform(transformDate)
  @Validate(IsValidDateConstraint)
  endDate?: Date | null

  @ApiPropertyOptional({ enum: Object.values($Enums.Status), required: false, nullable: true })
  @IsOptional()
  @IsEnum($Enums.Status)
  status?: $Enums.Status | null

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
