# Link

A deadline submission management service. Users get a placeholder link they can share immediately — before their actual submission is ready. When the submission is ready, they map it to the placeholder and anyone with the link gets the real content.

[Contributing](CONTRIBUTING.md) · [Code of conduct](CODE_OF_CONDUCT.md) ·
[Security policy](SECURITY.md) · [MIT license](License)

---

## How It Works

```
1. User creates a placeholder link  →  <frontend-origin>/l/abc123
2. User shares that link publicly (in emails, docs, portfolios etc.)
3. User finishes their submission
4. User maps the real submission URL to their placeholder
5. Anyone visiting that link now gets redirected to the real content
```

Until a destination is connected, visitors see a holding page. Expired or
deleted links show an unavailable message.

---

## Project lifecycle features

- **Expiry controls:** Remaining days, expiration dates, extensions, and renewal.
- **Custom holding pages:** Project messages, expected availability, and progress.
- **Pause/resume:** Temporarily return a public link to its holding page.
- **Destination history:** Retain and restore previous URLs, files, and bundles.
- **Activity timeline:** Timestamped owner-only records of project changes.
- **Deadlines and reminders:** Submission deadlines and opt-in email alerts.
- **Scheduled publishing:** Prepare a private destination and publish it later.
- **Visitor notifications:** Confirmed opt-in, one ready email, and unsubscribe.
- **Insights:** Visit phases, last opened time, subscriber and email queue counts.
- **Submission bundles:** Publish up to 12 labeled links or uploaded resources.
- **Sharing previews:** Custom titles, descriptions, and thumbnails in public HTML.
- **Destination monitoring:** Manual/daily checks and optional incident alerts.

Read [the feature, deployment, and verification guide](docs/FEATURES.md) for
behavior, configuration, retention, and test coverage.

Email features require server-only `SMTP_URL` and `MAIL_FROM`. Scheduled
publishing and monitoring require an active job loop (enabled on the API by
default) or a separate `npm run worker` process. Apply database migrations
before starting the updated API. `JOBS_ENABLED=false` disables the API's job
loop when using a separate worker. No external services are provisioned by
installing this update.

### Still planned

Custom slugs, tags/archives, password protection, QR downloads, and custom
domains remain future work.

---

## Tech Stack

### Server

| Package              | Purpose                           |
| -------------------- | --------------------------------- |
| `express`            | HTTP server                       |
| `drizzle-orm` + `pg` | Primary database ORM + PostgreSQL |
| `@clerk/express`     | Authentication                    |
| `cloudinary`         | Uploaded file storage             |
| `nanoid`             | Short unique link ID generation   |
| `zod`                | Request validation                |
| `express-rate-limit` | Rate limiting                     |
| `nodemailer`         | Configurable SMTP email delivery  |
| `typescript`         | Type safety                       |

### Client

| Package            | Purpose                                  |
| ------------------ | ---------------------------------------- |
| React + TypeScript | Frontend components and logic            |
| Vite               | Development server and production builds |
| Tailwind CSS       | Styling                                  |
| React Router       | Client-side routing                      |
| Zustand            | Client state                             |
| Clerk              | Sign-in and sessions                     |

---

## Project Structure

```
link/
├── client/          # Frontend
└── server/          # Backend API
    ├── src/
    │   └── index.ts # Entry point
    ├── drizzle/     # DB migrations
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 22.12+ and npm (the frontend dependencies require this minimum on Node 22)
- Docker with Compose for the local PostgreSQL database, or your own PostgreSQL database
- A [Clerk](https://clerk.com) account for auth
- A Cloudinary account for file uploads

### Installation

```bash
git clone https://github.com/aalampatil/link.git
cd link
npm --prefix server ci
npm --prefix client ci
```

### Environment Variables

Copy `server/.env.sample` to `server/.env` and `client/.env.example` to
`client/.env`. On PowerShell:

```powershell
Copy-Item server/.env.sample server/.env
Copy-Item client/.env.example client/.env
```

Set the server values in `server/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT=http://localhost:5173

# PostgreSQL
DATABASE_URL=postgresql://ADMIN:ADMIN@localhost:5434/link

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Set the client values in `client/.env`:

```env
VITE_SERVER=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Use publishable and secret keys from the same Clerk development instance.
`VITE_SERVER` includes `/api`; `CLIENT` is the frontend origin without `/api`.
Keep secret keys and database credentials in the server environment. Vite
variables are included in the browser bundle and must never contain secrets.

For production, configure these values through your hosting environment.
The `db:migrate:prod` script reads `server/.env.production` when run locally.

### Run Databases with Docker

Use the existing Compose file from the repository root:

```bash
docker compose -f server/docker-compose.yml up -d
```

This runs PostgreSQL 17 on port `5434`, with database `link` and the local
development credentials shown above. Use separate credentials for production.

### Database Migrations

Migration `0008_remove_profile_cards` removes the retired profile card table and
its data. Back up any card data you want to keep before applying it. Link data is
unaffected.

```bash
# Apply existing migrations to your local database
npm --prefix server run db:migrate
```

Generate new migrations only when changing the schema; see
[the contributing guide](CONTRIBUTING.md#database-changes).

### Run the App

Run these in separate terminals from the repository root:

```bash
# Terminal 1: API at http://localhost:5000
npm --prefix server run dev

# Terminal 2: frontend at http://localhost:5173
npm --prefix client run dev
```

The API restarts on TypeScript changes through `tsc-watch`; Vite reloads the
frontend. Use the frontend URL to sign in and create links.

### Build for Production

```bash
npm --prefix server run build
npm --prefix client run build
npm --prefix server start
```

The API build is written to `server/dist/`, and the frontend build to
`client/dist/`. Host the frontend separately from the API.

### Deploy the Server on Render

Configure the Node web service with:

- Root directory: `server`
- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Environment: `NODE_ENV=production`, plus the required service credentials and
  `CLIENT` set to the frontend origin.

The TypeScript compiler and `@types/*` declarations are development dependencies
needed at build time. `server/.npmrc` includes them even when
`NODE_ENV=production`; omitting them causes missing declaration errors for
Express, CORS, and Multer. Keep production mode enabled at runtime.

After pushing changes, redeploy the latest commit on Render.

---

### Deploy the Client on Vercel

Set the project root directory to `client`, use the Vite framework preset,
build with `npm run build`, and publish `dist`.

Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_SERVER` in the Vercel environment.
`VITE_SERVER` must point to the Render backend including `/api`, for example
`https://your-service.onrender.com/api`. Redeploy after changing these values.

`client/vercel.json` serves `index.html` for frontend routes so direct visits
and refreshes on `/get-all`, `/manage/:slug`, `/l/:slug`, and authentication
pages reach React Router.

## Scripts

The following scripts run from `server/`, or use `npm --prefix server run <script>`
from the repository root:

| Script                    | Description                          |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Start dev server with hot reload     |
| `npm run build`           | Compile TypeScript to `dist/`        |
| `npm run start`           | Run compiled production server       |
| `npm run db:generate`     | Generate SQL migrations from schema  |
| `npm run db:migrate`      | Run migrations (dev)                 |
| `npm run db:migrate:prod` | Run migrations against production DB |
| `npm run db:studio`       | Open Drizzle Studio to inspect DB    |

From `client/`, use `npm run dev` for Vite, `npm run build` for the production
build, and `npm run preview` to preview that build locally.

---

## Authentication

Auth is handled by [Clerk](https://clerk.com). Users sign in via Clerk and all protected routes require a valid Clerk session token — no password management needed.

---

## Storage

PostgreSQL (via Drizzle) stores link metadata, ownership, mappings, and status.

Cloudinary stores uploaded files. The database keeps each uploaded file's secure URL and public ID so it can be served and deleted later.

## Community

Contributions, bug reports, and feature ideas are welcome. Read the
[contributing guide](CONTRIBUTING.md) for local setup, validation, and the pull
request process. Participation follows our [code of conduct](CODE_OF_CONDUCT.md).

Use the [issue templates](https://github.com/aalampatil/link/issues/new/choose)
for bugs and feature requests. Report vulnerabilities privately using the
[security policy](SECURITY.md).

## License

Link is licensed under the [MIT License](License), copyright 2026 Aalam Patil.
