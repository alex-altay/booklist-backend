import { AuthService } from './auth.service'
import { AuthDto, RecoverDto, ResetDto } from './dto'
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signin(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('recover-password')
  recover(@Body() dto: RecoverDto) {
    return this.authService.recoverPassword(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  change(@Body() dto: ResetDto) {
    return this.authService.resetPassword(dto)
  }
}
