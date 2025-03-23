## Description

Simple CRUD backend for Booklist project made with [Nest](https://docs.nestjs.com/)

## Start local development from the scratch

```bash
$ npm install
# Create and run an instance of new clean database
$ npm run dev:db:clean-restart
# Apply all migrations
$ npm run dev:migrate:postgres
# Run Prisma Studio (if needed)
$ npm run prisma:studio:dev
# Run NestJs App
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


## Deploy on Railway

By default Railway uses `npm run build` and `npm run prebuild` for building and `npm run start` for starting the project. These scripts are defined in packages.json of the project

Script for predeploy should be set in Railway service settings this way:
`npx prisma migrate dev --schema=prisma/schema.prisma`

The correct general steps for the whole deployment process:
1. Prebuild: Generate prisma sources without accessing the database
2. Build: Use `nest build` common to compile the project's code from source
3. Predeploy: Create database migrations
4. Deploy: Generate prisma sources with access to the database and start
