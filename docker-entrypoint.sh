#!/bin/sh
# Arranque del contenedor de la app:
# 1) aplica las migraciones pendientes contra la base (idempotente),
# 2) levanta el servidor NestJS.
set -e

echo "==> Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "==> Iniciando la aplicacion..."
exec node dist/main.js
