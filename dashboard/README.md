# Dashboard — instrucciones

Minimal dashboard para administrar contenidos (artistas) y formulario de contacto.

Requisitos:
- Node.js 18+
- Postgres disponible (Supabase o Hostinger)

Instalación y ejecución local:

```bash
cd dashboard
npm install
# configurar .env con DATABASE_URL y SMTP_* variables
npx prisma generate
npx prisma db push # o `prisma migrate deploy` si usas migraciones
npm run dev
```

Rutas útiles:
- Dashboard UI: http://localhost:3001
- API artistas: `POST/GET /api/artists`, `PUT/DELETE /api/artists/:id`
- API contacto: `POST /api/contact`

Variables de entorno (ver `.env.example`):
- `DATABASE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_PASSWORD`
