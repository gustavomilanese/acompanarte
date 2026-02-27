# Acompanarte
Aplicacion de gestion operativa para servicios de acompanamiento, con modulo Admin, calendario y finanzas.

## Flujo corto (el que usas todos los dias)
### 1) Levantar local (front + api con Node 20)
```bash
npm run dev:local20
```

### 2) Guardar codigo en GitHub
Si, se puede en una sola linea:
```bash
git add . && git commit -m "mensaje" && git push origin main
```

### 3) Deploy
- Frontend (`app.acompanarte.online`): automatico por GitHub Actions al hacer push a `main`.
- Backend (`api.acompanarte.online`): manual por ZIP (Hostinger Node Deployments).

Generar ZIP de backend:
```bash
npm run backend:package
```

Te crea:
- `backend-deploy.zip` (en la raiz del repo)

Luego subir ese ZIP en Hostinger:
- `api.acompanarte.online` -> `Deployments` -> `Settings and redeploy` -> `Upload` -> `Save and redeploy`

## Stack actual
- Frontend: React + Vite
- Backend: Node.js + Express
- ORM: Prisma
- DB: MySQL (local para desarrollo, Hostinger en produccion)

## 1) Requisitos
- Node.js 20.x o 22.x
- npm 10+
- MySQL 8 (local, opcional pero recomendado)

## 2) Estructura de entornos (clave)
- `backend/.env` -> solo desarrollo local (NO subir a git)
- Variables de Hostinger -> produccion
- `.env.production` y `.env.development` -> frontend (Vite)

## 3) Configuracion local (paso a paso)
### 3.1 Instalar dependencias
```bash
npm install
npm --prefix backend install
```

### 3.2 Configurar backend local
Crear `backend/.env` (si no existe) con:
```env
DATABASE_URL=mysql://USER_LOCAL:PASS_LOCAL@127.0.0.1:3306/acompanarte_dev
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

### 3.3 Aplicar esquema en DB local
```bash
npm --prefix backend run db:push
```

### 3.4 Ejecutar local
Terminal 1 (backend):
```bash
npm --prefix backend run dev
```

Terminal 2 (frontend):
```bash
npm run dev
```

### 3.5 Verificacion local
- `http://localhost:4000/api/health` -> `{"ok":true}`
- `http://localhost:4000/api/admin/acompanantes` -> lista JSON o `[]`

## 4) Configuracion de frontend por entorno
### Desarrollo
Archivo `.env.development`
```env
VITE_API_URL=http://localhost:4000
```

### Produccion
Archivo `.env.production`
```env
VITE_API_URL=https://api.acompanarte.online
```

## 5) Deploy a Hostinger (produccion)
### 5.1 Backend (`api.acompanarte.online`)
En Hostinger Deployments:
- Framework: Express
- Node: 22.x
- Entry file: `src/server.js`
- Package manager: npm

Variables de entorno:
```env
DATABASE_URL=mysql://...@127.0.0.1:3306/uXXXXXXXX_acompanarte2
PORT=4000
CORS_ORIGIN=https://app.acompanarte.online,https://www.app.acompanarte.online
```

Empaquetar backend para subir:
```bash
npm run backend:package
```

### 5.2 Frontend (`app.acompanarte.online`)
- No hace falta subir manualmente.
- Se despliega solo desde GitHub Actions cuando haces push a `main`.

### 5.3 Checks post deploy
- `https://api.acompanarte.online/api/health` -> `{"ok":true}`
- `https://api.acompanarte.online/api/admin/acompanantes` -> lista JSON o `[]`
- Hard refresh frontend (`Cmd+Shift+R`) si hay cache viejo.

## 6) Regla para no romper produccion
- Nunca usar DB de produccion para pruebas diarias.
- Trabajar con DB local (`acompanarte_dev`).
- Deploy solo cuando local este validado.
- Antes de deploy importante: backup manual.

## 7) Backups
- Hostinger backups automaticos diarios: habilitados en `api.acompanarte.online`.
- Recomendado extra: export SQL manual antes de cambios criticos.

## 8) Flujo Git recomendado
1. Crear rama de trabajo:
```bash
git checkout -b codex/nombre-cambio
```
2. Commit:
```bash
git add .
git commit -m "feat: descripcion corta"
git push -u origin codex/nombre-cambio
```
3. Merge a `main` cuando este validado.

## 9) Troubleshooting rapido
### Error `Can't reach database server at 127.0.0.1:3306`
MySQL local no esta levantado o DB no existe.

### Error `Environment variable not found: DATABASE_URL`
Falta variable en Hostinger o no se aplico redeploy.

### `health` OK pero endpoints admin fallan
Backend corre, pero Prisma no conecta a DB.

### Frontend sigue fallando despues de arreglar API
Cache viejo del service worker. Hacer:
- DevTools -> Application -> Service Workers -> Unregister
- Clear site data
- Hard reload

## 10) Seguridad
- No commitear secretos.
- Rotar API keys si se exponen.
- Mantener `backend/.env` fuera de git.
