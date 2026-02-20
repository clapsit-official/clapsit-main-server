FROM node:22
WORKDIR /clapsit/clapsit-main-server-refactor

# Activate pnpm using
RUN corepack enable && corepack prepare pnpm@10.3.0 --activate

# Copy pnpm-lock.yaml & package.json
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --force

COPY . .

# Generate Prisma client
RUN pnpm run prisma:generate

# Build dist folder
RUN pnpm run build
