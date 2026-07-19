# Privacy disclosure launch review

The `/privacy/` disclosure is an implementation draft and requires AcornOps owner review before launch.

Confirm before deployment:

- the production Plausible hosting and processing arrangement;
- whether the default no-cookie, no-persistent-identifier configuration remains unchanged;
- the final public contact route;
- whether any deployment platform adds logs, cookies, headers, or processing not covered by the page;
- that configured analytics events and properties still match `src/scripts/analytics.ts`.
