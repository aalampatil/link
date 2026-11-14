# Project lifecycle features

Changes are delivered as separate feature commits on `feat/project-lifecycle`.
Apply the checked-in database migrations before starting the updated API.
Existing links and destinations are preserved.

## Expiry controls

Links start with 30 days of validity. The dashboard and management page show
the remaining days and expiration date. Owners can extend by 7, 30, 90, or 365
days, including after expiration. An extension starts at the later of now or
the current expiration time. Expired links remain private to their owner in
management; public access returns HTTP 410 until renewed.

Migration `0009` treats existing expiration timestamps as UTC and stores future
values with a time zone. Public destination responses use `Cache-Control:
no-store` so an old cached holding page cannot delay a destination update.

## Custom holding pages

Project settings include an editable name, message, expected availability date,
and progress percentage. Visitors see these while no destination is available.
Dates are entered in the owner's local time and stored as UTC instants.
Only the owner can edit settings; public responses never expose ownership data.

## Pause and resume

Owners can pause a link from Project settings. Public responses withhold the
destination while paused and show the holding page. Resuming restores access
to the existing destination; it does not extend the expiration date.

## Destination history

Destination history retains previous URLs and uploaded files, with the original
publish time and replacement time. Restoring creates another history entry;
it never destroys the current version. Versions are private to the owner.
Deleting a link also deletes its retained Cloudinary files and database history.

## Activity

History & activity includes an owner-only timeline of holding-page edits,
destination changes and restores, expiry extensions, and pause/resume actions.
Each activity record is committed in the same transaction as its change.
The original placeholder creation timestamp is shown separately for older links.

## Deadlines, reminders, and background jobs

Project settings separate a submission deadline from link expiry. Opt-in alerts
go to the owner's verified primary Clerk email: a missing-destination reminder
1 hour to 1 week before the deadline, and an expiry warning within 3 days.

Set server-only `SMTP_URL` (an SMTP/SMTPS connection URL) and `MAIL_FROM` to enable
delivery. Without these, deadline saving works and the UI explains that email
delivery is unavailable. The API polls jobs every 60 seconds by default.
`JOBS_INTERVAL_MS` changes that interval; `JOBS_ENABLED=false` disables polling
on the API process. A separate always-on worker can run `npm run worker` after
building, or `npm run worker:dev` locally, using the same database and env.

Jobs persist in PostgreSQL, deduplicate by link and deadline/expiry instant,
retry SMTP failures up to five times with backoff, and cancel when settings
become stale. Workers lock jobs with `SKIP LOCKED` so multiple instances do not
process the same row concurrently. SMTP delivery is at least once: a crash
after SMTP accepts a message but before its database commit may cause a retry.
SIGTERM/SIGINT stop polling, finish in-flight work, then close connections.
Scheduling and background alerts require a running API job loop or worker.

## Scheduled publishing

The destination form accepts an optional local publishing time for a URL or
uploaded file. The current destination stays public; drafts remain owner-only.
Publication runs in the job loop, retains the previous destination in history,
and keeps a paused link paused. Owners can cancel a schedule. Publishing or
restoring a destination immediately clears an older schedule. Extend expiry
before scheduling beyond it. Retained draft uploads are removed on link deletion.

## Visitor notifications

Holding pages offer opt-in notifications when SMTP is configured. Visitors must
confirm their email through a 24-hour token before receiving one ready email.
Repeat requests are throttled and deduplicated; confirmation tokens are hashed
in the database. Each email includes an unsubscribe link. Email link visits are
read-only; confirmation and unsubscribe require an explicit button click.
Subscriber details never appear in public responses. Publication notifications
wait while a link is paused or expired, and resume when it becomes available.

## Local integration tests

Use a separate local PostgreSQL database whose name ends in `_test`. Tests
refuse remote database hosts and never use the application's `DATABASE_URL`.
The default test URL uses port 55434 and database/user/password `link_test`.

```powershell
docker run --detach --name link-lifecycle-test --publish 127.0.0.1:55434:5432 --env POSTGRES_USER=link_test --env POSTGRES_PASSWORD=link_test --env POSTGRES_DB=link_test postgres:17
npm --prefix server test
```

Set `TEST_DATABASE_URL` to override the local test connection. Tests apply all
checked-in migrations and delete their own fixtures. The synthetic identity
header exists only in the test harness; production authentication uses Clerk.
