import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Body, Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { WebauthnService } from './webauthn.service'
import { AuthentificationDto, EmailDTO, RegistrationDto } from './dto'

@ApiTags('WebAuthN')
@Controller('webauthn')
export class WebauthnController {
  constructor(private readonly webauthnService: WebauthnService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/register/option/:email')
  @ApiOperation({
    summary: 'First step: create registration options. Expand for the details',
    description:
      'Backend generates a challenge (a random string) for the frontend, where an authenticator (for example, Touch ID) creates a key pair — a private and a public key — and the challenge is signed with the private key',
  })
  @ApiParam({
    name: 'email',
    required: true,
    description: 'User email',
    example: 'new-user@gmail.com',
    type: String,
  })
  generateRegistrationOptions(@Param() dto: EmailDTO) {
    return this.webauthnService.generateRegistration(dto.email)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/register')
  @ApiOperation({
    summary:
      'Frontend sends the signed challenge and the public key. Backend compares the challenge, and if everything is correct, saves the key and creates the user',
  })
  verifyRegistration(@Body() dto: RegistrationDto) {
    return this.webauthnService.verifyRegistration(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('/authenticate/option')
  @ApiOperation({
    summary:
      'Backend generates a challenge for the frontend, just like during registration. On the frontend, this challenge is signed with the existing key',
  })
  generateAuthenticationOptions() {
    return this.webauthnService.generateAuthenticationOptions()
  }

  @HttpCode(HttpStatus.OK)
  @Post('/authenticate')
  @ApiOperation({
    summary:
      'Backend verifies the authentication challenge, and if everything is correct, authorizes the user (in this case, returning a JWT token)',
  })
  verifyAuthentications(@Body() dto: AuthentificationDto) {
    return this.webauthnService.verifyAuthentication(dto)
  }
}
