import { WebAuthnChallenge } from '@prisma/client'
import { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server'
import { IsString, IsNotEmpty, IsEmail } from 'class-validator'

export class EmailDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class RegistrationDto {
  @IsNotEmpty()
  response: RegistrationResponseJSON

  @IsString()
  @IsNotEmpty()
  requestId: WebAuthnChallenge['requestId']

  @IsEmail()
  @IsNotEmpty()
  email: string
}

export class AuthentificationDto {
  @IsNotEmpty()
  response: AuthenticationResponseJSON

  @IsString()
  @IsNotEmpty()
  requestId: WebAuthnChallenge['requestId']
}
