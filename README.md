## Description

Simple CRUD backend for Booklist project made with [Nest](https://docs.nestjs.com/)

## Start development from the scratch

```bash
$ npm install
// Create and run an instance of new clean database
$ npm run dev:db:clean-restart
// Apply all migrations
$ npm run dev:migrate:postgres
// Run Prisma Studio (if needed)
$ npm run prisma:studio:dev
// Run NestJs App
$ npm run dev
```

To check - use [Insomnia](https://insomnia.rest/) for running http requests


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
