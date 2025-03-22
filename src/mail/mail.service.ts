import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import { Logger } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import { type User } from '@prisma/client'

const MAILER_ERROR = 'Mail Provider or NestJS NodeMailer settings should be updated'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async sendPasswordResetEmail(email: User['email'], url: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your password',
        template: './reset',
        context: {
          url,
          siteName: this.config.get<string>('SITE_NAME'),
        },
      })
    } catch {
      this.logger.error(MAILER_ERROR)
    }
  }
}
