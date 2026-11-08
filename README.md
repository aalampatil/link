# link

A deadline submission management service. Users get a placeholder link they can share immediately — before their actual submission is ready. When the submission is ready, they map it to the placeholder and anyone with the link gets the real content.

---

## How It Works

```
1. User creates a placeholder link  →  link.app/s/abc123
2. User shares that link publicly (in emails, docs, portfolios etc.)
3. User finishes their submission
4. User maps the real submission URL to their placeholder
5. Anyone visiting link.app/s/abc123 now gets redirected to the real content
```

No broken links. No "coming soon" pages. The placeholder link always works.

---

## Upcoming Rollouts

These features are planned and are not available yet. The rollout order may
change; release dates have not been set.

### First Rollout: Deadlines and Link Availability

- [ ] **Expiry controls:** Show days remaining, warn before expiry, and allow
      users to extend a link beyond the current 30-day validity period.
- [ ] **Deadline reminders:** Let users set a project deadline and receive a
      reminder if the destination is still missing.
- [ ] **Custom holding pages:** Add a short project message and an expected
      availability date while work is in progress.

### Next Rollout: Visibility and Destination Management

- [ ] **Basic analytics:** Show visit counts, the last opened time, and visits
      received before the destination was connected.
- [ ] **Destination history:** Record destination changes and allow users to
      restore a previous URL.
- [ ] **Custom link names:** Let users choose a readable slug with availability
      checks.
- [ ] **Scheduled publishing:** Prepare a destination privately and activate it
      at a chosen date and time.
- [ ] **Tags and archives:** Organize links by project or purpose and archive
      older work without deleting it.

### Later Rollout: Professional Sharing

- [ ] **Password protection:** Require a password before visitors can access a
      shared destination.
- [ ] **QR code downloads:** Generate a downloadable QR code for a public link.
- [ ] **Custom domains:** Share links using a domain owned by the user.

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
| `typescript`         | Type safety                       |

### Client

|            |                |
| ---------- | -------------- |
| TypeScript | Frontend logic |
| CSS        | Styling        |

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

- Node.js 18+
- PostgreSQL database
- A [Clerk](https://clerk.com) account for auth
- A Cloudinary account for file uploads

### Installation

```bash
git clone https://github.com/aalampatil/link.git
cd link/server
npm install
```

### Environment Variables

Create a `.env` file in `server/`:

```env
PORT=3000

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/link

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

For production, create `.env.production` with the same keys pointing to your production databases.

### Run Databases with Docker

```bash
# PostgreSQL
docker run -d \
  --name link-pg \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=link \
  -p 5432:5432 \
  postgres:16-alpine

```

Or with Docker Compose:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: link
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
volumes:
  pg_data:
```

```bash
docker compose up -d
```

### Database Migrations

Migration `0008_remove_profile_cards` removes the retired profile card table and
its data. Back up any card data you want to keep before applying it. Link data is
unaffected.

```bash
# Generate migrations from schema
npm run db:generate

# Run migrations (dev)
npm run db:migrate

# Run migrations (production)
npm run db:migrate:prod
```

### Run Dev Server

```bash
npm run dev
```

Server starts with hot reload via `tsc-watch` — any TypeScript change recompiles and restarts automatically.

### Build for Production

```bash
npm run build
npm run start
```

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

## Scripts

| Script                    | Description                          |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Start dev server with hot reload     |
| `npm run build`           | Compile TypeScript to `dist/`        |
| `npm run start`           | Run compiled production server       |
| `npm run db:generate`     | Generate SQL migrations from schema  |
| `npm run db:migrate`      | Run migrations (dev)                 |
| `npm run db:migrate:prod` | Run migrations against production DB |
| `npm run db:studio`       | Open Drizzle Studio to inspect DB    |

---

## Authentication

Auth is handled by [Clerk](https://clerk.com). Users sign in via Clerk and all protected routes require a valid Clerk session token — no password management needed.

---

## Storage

PostgreSQL (via Drizzle) stores link metadata, ownership, mappings, and status.

Cloudinary stores uploaded files. The database keeps each uploaded file's secure URL and public ID so it can be served and deleted later.
