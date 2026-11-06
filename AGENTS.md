# AGENTS.md

Personal portfolio site built with Astro (with MDX, Vue, GSAP, and Reveal.js for slideshows).

## Setup commands

- Install: `bun install`
- Dev server: `bun run dev`
- Build: `bun run build`
- Preview build: `bun run preview`

## Testing

There is no test script. Do not test in a browser unless explicitly asked. The user will test.

## Code style

- TypeScript extends `astro/tsconfigs/strict`.
- Use the path aliases in `tsconfig.json`: `@assets/*`, `@components/*`, `@layouts/*`, `@lib/*`.
- Prefer `.mdx` files in `src/pages/` unless there is a reason to use another file type.
- There is no Prettier or ESLint config. Match the style of the file you are editing.

## Security

- Do not commit `.env` or other secrets. `.env` is gitignored.

## Docs

- Astro: https://docs.astro.build
- Astro MDX integration: https://docs.astro.build/en/guides/integrations-guide/mdx/
- Astro Vue integration: https://docs.astro.build/en/guides/integrations-guide/vue/
- GSAP: https://gsap.com/docs/v3/
- Reveal.js: https://revealjs.com/
- Bun: https://bun.com/docs

## Notes

- Use Bun, since `bun.lock` is the lockfile.
- Do not edit `dist/` or `.astro/`; they are generated.
