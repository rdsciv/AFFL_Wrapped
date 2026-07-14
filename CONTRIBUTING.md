# Contributing to AFFL Wrapped

Thanks for helping make long-running fantasy leagues more memorable. Contributions are welcome across design, accessibility, metrics, data adapters, documentation, and tests.

## Before opening code

1. Search existing issues and discussions.
2. Use the feature issue form for new story modules or metric changes.
3. Keep pull requests focused on one outcome.
4. Never commit fantasy platform cookies, tokens, raw private payloads, or personally sensitive data.

## Local workflow

```bash
npm install
npm run dev
npm run lint
npm test
```

`npm test` produces the full GitHub Pages export and verifies every season route. Pull requests should leave both lint and test commands passing.

## Metric changes

A new or changed metric must include:

- a plain-language definition;
- a reproducible formula;
- source and coverage requirements;
- behavior when the source is missing;
- at least one contract assertion or fixture check;
- corresponding documentation in `docs/metrics.mdx`.

## Visual changes

Preserve the project's editorial sports-almanac direction. Test narrow mobile, tablet, and wide desktop layouts; respect reduced-motion settings; and avoid sacrificing readability for decoration.

## Pull requests

Use the pull request template. Explain the user-facing story, include before/after visuals for design work, and call out any historical seasons whose output changes.

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).
