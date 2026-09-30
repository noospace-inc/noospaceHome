# Noo Space website

## Local development

Use Node.js 22 and npm:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site. The app and its npm lockfile are in `website/` at the repository root. Set Cloudflare Workers Builds **Root directory** to `website`.

## Cloudflare Workers

The app uses OpenNext for Cloudflare Workers. In Workers Builds set:

- Build command: `npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`
- Root directory: `website`
- Build variable: `NODE_VERSION=22`

The Worker runtime needs `nodejs_compat`, configured in `wrangler.jsonc`. The app currently reads no environment variables, so no runtime secrets or application build variables are required.

Run `npm run preview` for a local Workers preview, `npm run deploy` to build and deploy, and `npm run verify` to perform a clean install, lint, type-check, case/path audit, and OpenNext build.

## Case-sensitive filesystems

Set `git config core.ignorecase false` in this checkout so Git records case-only renames correctly. Imports and public asset paths must match their tracked filename casing exactly; `npm run check:case` checks relative module imports and referenced public assets.
