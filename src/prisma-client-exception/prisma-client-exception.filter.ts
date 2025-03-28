import { Response } from 'express'
import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'
import { Prisma } from '@prisma/client'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    switch (exception.code) {
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND
        response.status(status).json({
          statusCode: status,
          message: 'The resource is not existed',
        })
        break
      }
      default:
        super.catch(exception, host)
        break
    }
  }
}
