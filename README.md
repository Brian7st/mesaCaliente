# Sistema de Restaurante — Backend

Backend de gestión de restaurante construido con **NestJS**, aplicando **Domain-Driven Design (DDD)**, **Arquitectura Hexagonal (Puertos y Adaptadores)** y **principios SOLID**. Monolito modular con 6 Bounded Contexts que se comunican exclusivamente vía Domain Events.

> La fuente de verdad de arquitectura y convenciones es [`CLAUDE.md`](./CLAUDE.md). El orden de construcción y el modelo de datos completo están en [`PLAN-FASES-DESARROLLO.md`](./PLAN-FASES-DESARROLLO.md).

## Stack

- NestJS 10 · TypeScript 5.4
- `@nestjs/cqrs` (CommandBus / EventBus) para CQRS y Domain Events
- Prisma 5 + PostgreSQL 16
- `@nestjs/swagger` para documentación de API
- `class-validator` / `class-transformer` para validación de DTOs

## Bounded Contexts

| Context | Tipo | Responsabilidad |
|---|---|---|
| Pedidos | Core Domain | Ciclo de vida del pedido y sus ítems |
| Mesas | Supporting | Ocupación de mesas |
| Cocina | Supporting | Preparación de pedidos confirmados |
| Inventario | Supporting | Stock y reserva de productos |
| Caja | Supporting | Facturación y pagos |
| Domicilios | Supporting | Entregas a domicilio |

## Cómo levantar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar PostgreSQL
docker-compose up -d

# 3. Configurar entorno (copiar y ajustar si hace falta)
cp .env.example .env

# 4. Ejecutar migraciones (a partir de la Fase 1, cuando existan modelos)
npx prisma migrate dev

# 5. Arrancar en modo desarrollo
npm run start:dev
```

- App: http://localhost:3000
- Swagger UI: http://localhost:3000/api/docs

## Estado

Fase 0 completada (setup base: `shared/`, filtro global de excepciones, Swagger, Prisma, Docker Compose). Los Bounded Contexts se implementan en las fases siguientes según el plan.
