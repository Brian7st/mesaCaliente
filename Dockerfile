# ---------- Etapa 1: build ----------
# Compila TypeScript -> dist y genera el cliente de Prisma.
FROM node:20-slim AS builder

WORKDIR /app

# Prisma necesita openssl para su motor de consultas.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Instalar dependencias con el lockfile (capa cacheable).
COPY package*.json ./
RUN npm ci

# Generar el cliente de Prisma a partir del schema.
COPY prisma ./prisma
RUN npx prisma generate

# Compilar la aplicación.
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ---------- Etapa 2: runtime ----------
# Imagen final liviana: solo lo necesario para correr la app.
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Dependencias (incluye el CLI de Prisma para `migrate deploy` al arrancar).
COPY package*.json ./
RUN npm ci

# Cliente de Prisma generado + schema/migraciones + build.
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist

# Entrypoint: aplica migraciones y levanta la app.
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
