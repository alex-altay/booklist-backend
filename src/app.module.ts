import { BookModule } from './book/book.module'
import { ChallengeModule } from './challenge/challenge.module'
import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { ScheduleModule } from '@nestjs/schedule'
import { WebauthnModule } from './webauthn/webauthn.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    WebauthnModule,
    ChallengeModule,
    BookModule,
    PrismaModule,
  ],
})
export class AppModule {}
