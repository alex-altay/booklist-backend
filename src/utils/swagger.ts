import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import type { INestApplication } from '@nestjs/common'

export function enableSwaggerApi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('WebAuthN Example')
    .setDescription(
      `A sample project demonstrating biometric user registration and authentication. After completing WebAuthN registration and authentication, 
      you can use any other method of user management that suits you best — cookies, sessions, JWT tokens, etc. In this example, a simple CRUD 
      (access with jwt-token) for a list of books is used to demonstrate access after authentication. You can try out the GET requests in this Swagger UI.
      Working webapp is available on [the main page](${process.env.DOMAIN_NAME}).
      `,
    )
    .addTag('WebAuthN', 'Passwordless website authentication via biometrics in 4 steps')
    .addTag('Books', 'Simple CRUD for making a list of books, that available after authorisation')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      supportedSubmitMethods: ['get'],
      defaultModelsExpandDepth: -1,
    },
    customCss: `
    .topbar { display: none !important; }
  `,
  })
}
