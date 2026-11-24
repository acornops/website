# AcornOps website

The static marketing site for AcornOps, built with Astro, TypeScript, GSAP, and Lenis.

## Development

```sh
npm install
npm run dev
```

Run `npm run validate` before opening a pull request. Production analytics is enabled only when `PUBLIC_PLAUSIBLE_DOMAIN` is configured at build time. `PUBLIC_PLAUSIBLE_SRC` optionally overrides the default Plausible script endpoint.

## Console proof assets

The product screenshots in `public/images/proof` are deterministic fixture captures from the management console. Capture provenance is recorded in `public/images/proof/README.md`. The website has no runtime dependency on the management console repository.
