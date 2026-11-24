# AcornOps website

The static marketing site for AcornOps, built with Astro, TypeScript, GSAP, and Lenis.

## Conference presentations

The Pages build serves the [conference archive](https://acornops.dev/presentation/) from this repository’s `presentation-assets` branch. That branch contains built slides and a record of their source revision. Conference URLs follow `/presentation/<conference-and-year>/`. The presentation project’s `npm run deploy` command publishes the archive and requests a new website deployment. Normal website deployments also include the latest published archive.

## Development

```sh
npm install
npm run dev
```

Run `npm run validate` before opening a pull request. Production analytics is enabled only when `PUBLIC_PLAUSIBLE_DOMAIN` is configured at build time. `PUBLIC_PLAUSIBLE_SRC` optionally overrides the default Plausible script endpoint.

## Console proof assets

The product screenshots in `public/images/proof` are deterministic fixture captures from the management console. Capture provenance is recorded in `public/images/proof/README.md`. The website has no runtime dependency on the management console repository.
