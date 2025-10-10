import { Body, Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { WebauthnService } from './webauthn.service'
import { AuthentificationDto, EmailDTO, RegistrationDto } from './dto'

@Controller('webauthn')
export class WebauthnController {
  constructor(private readonly webauthnService: WebauthnService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/register/option/:email')
  generateRegistrationOptions(@Param() dto: EmailDTO) {
    return this.webauthnService.generateRegistration(dto.email)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/register')
  verifyRegistration(@Body() dto: RegistrationDto) {
    return this.webauthnService.verifyRegistration(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('/authenticate/option')
  generateAuthenticationOptions() {
    return this.webauthnService.generateAuthenticationOptions()
  }

  @HttpCode(HttpStatus.OK)
  @Post('/authenticate')
  verifyAuthentications(@Body() dto: AuthentificationDto) {
    return this.webauthnService.verifyAuthentication(dto)
  }
}
