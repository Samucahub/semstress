# ========================
# Backend Dockerfile
# Multi-stage build for NestJS
# ========================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar ficheiros de dependências
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src/

# Gerar Prisma Client e compilar
RUN npx prisma generate
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

# Criar user não-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copiar apenas o necessário para produção
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar apenas dependências de produção
RUN npm ci --omit=dev && \
    npx prisma generate && \
    npm cache clean --force

# Copiar build
COPY --from=builder /app/dist ./dist/

# Segurança: user não-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

EXPOSE 3001

CMD ["node", "dist/main"]
