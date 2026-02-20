# clapsit-main-server-refactor (NestJS)

Welcome to the **Clapsit Main Server (Refactored)** developed by **Vugar Safarzada**. This application has been entirely rewritten from an original Express.js application into a modern, robust, structurally strict **NestJS** application. 

It provides the primary backend logic, data management via Prisma, and handles third-party integrations (such as SMTP and OpenAI).

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Database Management](#database-management)
- [Docker Setup](#docker-setup)
- [API Documentation Overview](#api-documentation-overview)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

---

## Features

- **NestJS Framework:** Utilizing decorators, Dependency Injection, Guards, and Pipes.
- **Prisma ORM:** Database management with strictly typed schema models.
- **Dockerized Environments:** Production, Development, and Build level Compose setups.
- **Global Error Handling & Validation:** Pre-configured `ValidationPipe` and `ExceptionFilter`.
- **Integrated Core Modules:** SMTP, CDN (Multer), Auth (JWT), User, and AI integrations perfectly decoupled.

---

## Installation

To get started with the project locally (without Docker), ensure you have Node.js and `pnpm` installed.

```bash
git clone <repository_url>
cd clapsit-main-server-refactor
pnpm install
```

---

## Project Structure

The NestJS project is highly modular. Core logical domains are split into standalone folders containing their respective Controllers, Services, and DTOs:

```
.
├── prisma
│   └── schema.prisma         # Database schema
├── src
│   ├── ai                    # AI Management Module (OpenAI Integration)
│   ├── assets                # Core Helpers, Configs, Constants
│   ├── auth                  # Access Token / Auth Validation Logic
│   ├── cdn                   # Static File Management / Uploads
│   ├── common                # Global Exceptions and Interceptors
│   ├── health                # API Status and Database Checks
│   ├── smtp                  # Nodemailer integrations
│   ├── users                 # User Login, Signup, Profile logic
│   ├── app.module.ts         # Root module configuration
│   └── main.ts               # Bootstrapping (Morgan, CORS, Class-Validator)
├── docker-compose.yml        # Base DB docker setup
├── docker-compose.dev.yml    # Development Docker Setup
├── docker-compose.build.yml  # Production Build Docker Setup
└── Dockerfile                # Image building configuration
```

---

## Database Management

This project uses [Prisma](https://www.prisma.io/). To sync your models and schema to a running MySQL instance:

- `pnpm run prisma:generate` - Generates the Prisma client.
- `pnpm run prisma:push` - Pushes schema directly to DB without saving a migration file.
- `pnpm run prisma:db:pull` - Fetches the schema from your active MySQL database.

Remember to execute `pnpm run prisma:generate` every time `schema.prisma` is manually modified.

---

## Docker Setup

Docker is configured to match the previous generation's layout smoothly.

**1. Start Development Mode via Docker:**
This will spin up the MySQL Database alongside the NestJS development server, watching for live changes.
```bash
pnpm run dev:docker
```
*(Equivalent to: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build`)*

**2. Production Build Check:**
Used to verify if the server bundles successfully inside an isolated docker environment.
```bash
pnpm run build:docker
```
*(Equivalent to: `docker-compose -f docker-compose.yml -f docker-compose.build.yml up --build`)*

---

## API Documentation Overview

All primary routes are mapped cleanly inside their respective module controllers and prepended by the `api/` global prefix. 

### Health (`/api/health`)
- `GET /` - Checks DB connectivity and backend uptime.

### Auth & Users (`/api/users`)
- `POST /signup` - Registers a new user.
- `POST /login` - Returns JWT Session tokens.
- `POST /forgot_password` - Sends reset password email.
- `POST /reset_password` - Confirms and sets a new password.

### CDN (`/api/cdn`)
- `POST /upload` - Simulates a file upload entry.
- `GET /:id` - Fetches and returns an asset stream.
- `DELETE /delete/:id` - Deletes file entry from DB.

### SMTP (`/api/smtp_server_app`)
- `GET /test/:userId` - Sends test confirmation/reset mails internally for debugging.

### AI Management (`/api/ai_management`) - *Requires Bearer Token*
- `GET /start` - Initiates a new conversation instance with specific Persona keys.
- `POST /ask` - Prompting logic via DeepSeek, ChatGPT, or Grok.

*(Detailed parameter queries and response typings are globally restricted via Class Validator inside DTOs)*

---

## Environment Variables

An `.env` is required for the application to function. A base template:

```env
PORT=3333
DATABASE_URL="mysql://root:password@database:3306/clapsit_development?schema=public"

# Token Variables
ACCESS_TOKEN_SECRET="your_secret_string"
REFRESH_TOKEN_SECRET="your_secret_string"
HASH_LIMIT=10

# AI Configuration
GROK_API_KEY=""
GROK_BASE_URL=""
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL=""
CHATGPT_API_KEY=""

# SMTP Setup
SERVICE_EMAIL_SERVICE="gmail"
SERVICE_EMAIL_USER="your-email@gmail.com"
SERVICE_EMAIL_PASSWORD="app-password"
APP_BRAND_DOMAIN="CLAPSIT"
APP_BRAND_NAME="Clapsit Server"
ACCEPTABLE_CORS_ORIGIN="*"
```

---

## Scripts

Key generic `package.json` configurations:

- `pnpm run build`: Compile TypeScript into `./dist`.
- `pnpm run start`: Boot production build from `./dist/main`.
- `pnpm run start:dev`: Boot in watch mode using TS-Node.
- `pnpm run lint`: Formats via internal ESLint configs.
