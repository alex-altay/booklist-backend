import { IsEmail, IsString, IsNotEmpty } from 'class-validator'

export class ResetDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @IsNotEmpty()
  resetToken: string

  @IsString()
  @IsNotEmpty()
  password: string
}
