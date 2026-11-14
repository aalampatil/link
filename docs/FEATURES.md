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
