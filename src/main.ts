import { AppModule } from './app.module'
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter'
import { ValidationPipe } from '@nestjs/common'
import { HttpAdapterHost, NestFactory } from '@nestjs/core'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  )

  const { httpAdapter } = app.get(HttpAdapterHost)
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter))
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
