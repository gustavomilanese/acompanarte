# Acompanarte
Aplicacion de gestion operativa para servicios de acompanamiento, con modulo Admin, calendario, finanzas y base de datos PostgreSQL.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- ORM: Prisma
- DB: PostgreSQL

## Requisitos
- Node.js 20.x
- npm 10+
- PostgreSQL 16 (local o remoto)

## Configuracion local
1. Instalar dependencias:
```bash
npm install
npm --prefix backend install
```

2. Configurar entorno backend:
```bash
cp backend/.env.example backend/.env
```
Editar `backend/.env` con:
- `DATABASE_URL`
- `PORT`
- `CORS_ORIGIN`
- (opcional) `OPENAI_API_KEY`, `OPENAI_MODEL`

3. Sincronizar esquema DB:
```bash
npm --prefix backend run db:push
```

4. (Opcional) Seed demo:
```bash
npm --prefix backend run db:seed
```
Nota: el seed actual puede reemplazar datos de prueba existentes.

## Ejecutar en desarrollo
En dos terminales:

Terminal 1 (backend):
```bash
npm --prefix backend run dev
```

Terminal 2 (frontend):
```bash
npm run dev
```

## Scripts utiles
- `npm run dev` -> frontend
- `npm run build` -> build frontend
- `npm --prefix backend run dev` -> backend
- `npm --prefix backend run db:push` -> aplicar schema Prisma
- `npm --prefix backend run db:seed` -> datos demo

## Git y seguridad
- No subir `.env` ni llaves/API keys.
- Si una key se expone, rotarla inmediatamente.
