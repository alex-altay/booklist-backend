import { Module } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { JwtStrategy } from './strategy'
import { WebauthnController } from './webauthn.controller'
import { WebauthnService } from './webauthn.service'
import { ChallengeModule } from '../challenge/challenge.module'
import { ChallengeService } from '../challenge/challenge.service'

@Module({
  imports: [JwtModule.register({}), ChallengeModule],
  controllers: [WebauthnController],
  providers: [WebauthnService, JwtService, JwtStrategy, ChallengeService],
})
export class WebauthnModule {}
