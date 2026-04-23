# NearMe

Monorepo containing:

- `server/` – Node.js/TypeScript API (Express) + tests
- `web/` – Vite + React frontend
- `mobile/` – Expo / React Native app

## Quick start

Prereq: Node.js 18+ (LTS recommended).

### Server

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### Web

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

### Mobile (Expo)

```bash
cd mobile
npm install
npm run start
```

## Scripts

- `server/`: `npm run dev`, `npm test`, `npm run build`, `npm start`
- `web/`: `npm run dev`, `npm run lint`, `npm run build`

## Environment variables

- Never commit `.env` files. Use `.env.example` as the template.
- See `server/docs/guide.md` for additional setup notes.

## Notes

- `mobile/` currently contains a nested Git repo at `mobile/.git/`. Remove it (or convert it to a submodule) before publishing this monorepo.
