import { AuthModule } from './auth/auth.module'
import { BookModule } from './book/book.module'
import { ConfigModule } from '@nestjs/config'
import { MailModule } from './mail/mail.module'
import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BookModule,
    PrismaModule,
    MailModule,
  ],
})
export class AppModule {}
