# Security policy

## Supported versions

Security fixes target the latest code on `main`. Older commits, forks, and
separate deployments are not maintained as security release branches. If you
operate a deployment, update to the latest applicable fix and keep your
dependencies and service credentials current.

## Reporting a vulnerability

Email the maintainer, Aalam Patil, at
[aalam.workacc@gmail.com](mailto:aalam.workacc@gmail.com) with a subject starting
with `Link security report`.

If GitHub offers a **Report a vulnerability** button on the repository's
[Security tab](https://github.com/aalampatil/link/security), you may use that
private reporting flow instead. Email remains the fallback if that option is
unavailable.

Do not open a public issue or pull request with vulnerability details, exploit
code, credentials, or private data before a fix and disclosure are coordinated.

Include, where possible:

- The affected commit or deployment and the relevant endpoint or component.
- Steps to reproduce using accounts and data you control.
- Expected and actual behavior, impact, and a minimal proof of concept.
- Redacted logs or screenshots and any suggested mitigation.
- A way to contact you and whether you would like public credit.

Potential concerns include authentication bypass, access to another user's link
management data, unsafe uploads, credential exposure, or unauthorized changes
to link destinations. Ordinary bugs and feature requests belong in the public
issue templates.

## Response and disclosure

The maintainer will review the report, investigate its impact, and coordinate
any fix and disclosure with the reporter. This is a volunteer-maintained project;
response and resolution times are not guaranteed. If you have not received a
reply within seven days, follow up in the same email thread.

Keep sensitive details private while the report is investigated. A confirmed
issue may be disclosed after a fix or mitigation is available, with reporter
credit when requested. This policy does not offer a bug bounty.

## Safe investigation

Use a local environment or accounts and resources you control. Avoid accessing
other users' data, disrupting availability, or uploading harmful content. If you
encounter private data or exposed credentials, stop, report it privately, and
share only the minimum redacted evidence needed to explain the issue.
