# eseyasa_prod — Deployment guide

This repository contains a static site and a simple admin dashboard in `dashboard/`.

Quick deploy (recommended):

1. Create a Vercel project and link it to this GitHub repo.
2. Add the following Repository Secrets in GitHub (Settings → Secrets → Actions):
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   - `DATABASE_URL` (Supabase connection string)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `ADMIN_PASSWORD`
3. Push to `main` and the GitHub Action will build and deploy to Vercel.

Local quick test:

cd dashboard
npm install
npm run dev:sqlite
# Eseyasa Productions — Sitio Estático

Sitio estático creado con HTML/CSS/JS. Este repositorio contiene las páginas estáticas y recursos necesarios para ejecutar la web localmente o desplegar en GitHub Pages.

## Ver localmente (Windows)

Opción 1 — Live Server (VS Code):
1. Instala la extensión *Live Server* en VS Code.
2. Click derecho en `index.html` → "Open with Live Server".

Opción 2 — Python (recomendado si no usas VS Code):

```powershell
cd "C:\Users\User\Desktop\eseyasa_prod"
python -m http.server 8000
# Abrir http://localhost:8000
```

Opción 3 — Node.js `http-server`:

```powershell
cd "C:\Users\User\Desktop\eseyasa_prod"
npx http-server -p 8000
# Abrir http://localhost:8000
```

Opción 4 — Abrir el archivo directamente

```powershell
start "index.html"
```

> Nota: servir mediante HTTP evita problemas con rutas relativas y algunas políticas de seguridad del navegador.

## Desplegar en GitHub Pages

1. Inicializa git y haz el primer commit (si aún no lo hiciste):

```bash
git init
git add .
git commit -m "Initial commit: static site"
```

2a. Crear repo y push con `gh` (recomendado si tienes GitHub CLI y estás autenticado):

```bash
gh repo create eseyasa_prod --public --source=. --push
```

2b. Crear repo manualmente en github.com y luego:

```bash
git remote add origin https://github.com/<tu_usuario>/eseyasa_prod.git
git branch -M main
git push -u origin main
```

3. Habilitar Pages: en `Settings → Pages` selecciona la rama `main` y la carpeta `/ (root)`.

4. Tu sitio quedará disponible en `https://<tu_usuario>.github.io/eseyasa_prod/`.

## Archivos principales

- `index.html` — página principal
- `animations.css`, `animations.js` — estilos y scripts de animación
- `artists.html`, `artist-detail.html`, `contact.html` — páginas internas

## Problemas comunes
- Si las fuentes o CDNs no cargan, revisa la conexión a Internet.
- Si hay rutas con `/` absolutas, ajusta para que funcionen en Pages (usa rutas relativas o `_config`).

Si quieres, puedo inicializar git y probar crear el repo con `gh` si me autorizas a ejecutar comandos o prefieres que te guíe paso a paso.
