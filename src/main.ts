import { AppModule } from './app.module'
import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { PrismaClientExceptionFilter } from './prisma-client-exception/prisma-client-exception.filter'
import { ValidationPipe } from '@nestjs/common'
import { enableSwaggerApi } from './utils/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  )
  app.enableCors({
    origin: [process.env.DOMAIN_NAME],
    credentials: true,
  })

  const { httpAdapter } = app.get(HttpAdapterHost)
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter))
  enableSwaggerApi(app)
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
