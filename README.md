## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository


## Start development from the scratch

```bash
$ npm install
// Start from clean DB
$ npm run dev:db:clean-restart
// Apply all migrations
$ npm run dev:migrate:postgres
// Run Prisma Studio (if needed)
$ npm run prisma:studio:dev
// Run NestJs App
$ npm run dev
```

To check - use Insomnia for running http requests

## Installation

```bash
$ npm install
```

## Prepare POSTGRES container

Install Docker or Podman and run docker-compose or podman-compose with required settings file


## Run Prisma Studio (ORM for Database)

Prisma Docs [located here](https://www.prisma.io/docs)

```bash
$ npm run prisma:studio:dev
```

You may need to apply migrations first


## Running the app

```bash
# development (start in watching for changes mode)
$ npm run dev

# production mode
$ npm run start:prod
```

## e2e tests

```bash
$ npm run test:e2e
```

## NestJS Docs

[Located here](https://docs.nestjs.com/)
