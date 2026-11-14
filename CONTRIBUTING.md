# Contributing to Link

Thank you for helping improve Link. Code, documentation, accessibility fixes,
bug reports, and feature suggestions are welcome. All participation follows the
[code of conduct](CODE_OF_CONDUCT.md).

## Before you start

- Search [existing issues](https://github.com/aalampatil/link/issues) and
  [pull requests](https://github.com/aalampatil/link/pulls) for related work.
- Use the [bug or feature template](https://github.com/aalampatil/link/issues/new/choose)
  for public reports. Include a small reproduction and the result you expected.
- Discuss large changes in an issue before implementing them so maintainers can
  give feedback on scope. Small fixes and documentation changes can go straight
  to a pull request.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
  Do not include credentials, session tokens, or private user data in reports.

## Local development

1. Fork the repository and clone your fork.
2. Create a branch from the latest `main`, for example `fix/link-expiry`.
3. Follow the [README setup instructions](README.md#getting-started) to install
   both packages with `npm ci`, configure the two environment files, start
   PostgreSQL, and apply migrations to your local database.
4. Start the API and frontend in separate terminals:

   ```bash
   npm --prefix server run dev
   npm --prefix client run dev
   ```

Use development service credentials and a local database. Do not run migrations
or experiments against production resources. Environment files, dependencies,
and generated build output must stay out of commits.

## Making changes

- Keep a pull request focused on one problem and follow the surrounding code's
  TypeScript and formatting conventions.
- Keep UI changes usable with a keyboard, include accessible names for controls,
  and check both light and dark themes.
- For API changes, preserve authentication, ownership checks, input validation,
  and safe error responses. Public link access must not expose owner-only data.
- Update documentation and environment examples when behavior or configuration
  changes. Put browser-safe configuration in the client; keep secrets on the server.
- Commit `package-lock.json` alongside intentional dependency changes. Avoid
  unrelated dependency upgrades or formatting changes.

## Database changes

The schema is in `server/src/db/schema.ts`; migrations and their metadata are
in `server/drizzle/`. After a schema change, run:

```bash
npm --prefix server run db:generate
npm --prefix server run db:migrate
```

Inspect generated SQL, apply it to a local database, and include the migration
and metadata in your pull request. Do not rewrite migrations already shared
with others. Explain any data loss, backfill, or deployment ordering requirements.

## Validation

From the repository root, run:

```bash
npm --prefix client run build
npm --prefix client run lint
npm --prefix server run build
git diff --check
```

Backend integration and HTTP-probe tests run with `npm --prefix server test`
against an isolated local PostgreSQL test database. Browser flows run with
`npm --prefix client run test:browser`. See [the feature and verification guide](docs/FEATURES.md#local-integration-tests)
for database/browser setup, coverage, and limits. The frontend uses the checked-in
`client/eslint.config.js` configuration for linting. Do not report tests, lint,
or builds as passing unless you actually ran them successfully.

Manually check the flows affected by your change. For link behavior, use your
own development account to create a link, open its public holding page without
signing in, connect a URL or file, revisit the public link, and delete it. For
permission changes, verify that another account cannot manage the link. Include
reproduction steps and results in the pull request. Documentation-only changes
need a review of commands, paths, and links; application builds are unnecessary.

## Pull requests and review

Open a pull request against `main` and complete the provided template. Explain
the problem, the resulting behavior, and how you validated it. Link related
issues, add screenshots for visible changes, and call out database or environment
changes. Use a draft if work is still in progress.

Respond to review feedback and keep follow-up commits focused. Maintainers may
request changes, ask for a smaller scope, or decline a proposal. Review timing
depends on maintainer availability.

## License

By contributing, you agree that your contributions are provided under the
project's existing [MIT License](License). Only submit material you have the
right to contribute, and preserve required third-party notices.
