# Security policy

## Supported version

Security fixes are applied to the latest commit on `main` and the currently deployed GitHub Pages site.

## Reporting a vulnerability

Do not open a public issue for credentials, private league data, dependency exploits, or deployment vulnerabilities. Use [GitHub's private vulnerability reporting](https://github.com/rdsciv/AFFL_Wrapped/security/advisories/new) with:

- the affected route or file;
- reproduction steps;
- expected impact;
- any safe mitigation you have tested.

The project aims to acknowledge reports within seven days. Please do not access data that does not belong to you or disrupt the public deployment while researching a report.

## Data boundary

The public repository must never contain ESPN cookies, platform credentials, raw private API responses, or the full private league warehouse. The deployed application is a static export and has no runtime database or write API.
