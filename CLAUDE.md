# CLAUDE.md

## Development

```bash
# Start local dev server (available at netdev.samdriver.xyz — add to /etc/hosts if needed)
docker-compose up -d

# Run tests
docker-compose run --rm phpunit tests/

# Test coverage report
docker-compose run --rm phpunit --coverage-html tests/coverage tests/

# Deploy to production
./scripts/deploy.sh
```

For articles with a JS build step, run the build from within the article's directory:

```bash
# Rollup-based articles
docker-compose run --rm npm run build
docker-compose run --rm npm run watch

# Vite-based articles (e.g. scroll-anim-model)
vite build
```

## Architecture

### Backend (PHP, no framework)

`public/index.php` is the sole entry point. `app/autoloader.php` provides a custom PSR-4-style loader — there is no Composer autoloader in production. Routes are handled in `app/routes/Handler.php`, which maps `/articles/{slug}` to the corresponding article HTML file.

Articles are discovered at runtime by scanning `public/article-data/` for directories containing an `index.html`. Metadata is extracted from `<meta>` tags in the HTML `<head>`:

- `<title>` — article name
- `<meta name="description">` — description
- `<meta name="sort" content="YYYY-MM-DD">` — used for ordering
- `<meta name="public" content="false">` — marks a draft (hidden from listings)

### Article system

Each article lives in `public/article-data/{slug}/` and is entirely self-contained. The site never imposes a shared build pipeline on articles. The range of article types includes:

- **Static HTML** — no build step; the `index.html` is the final artifact
- **Rollup + Three.js** — `src/` compiled to `built.js` via a per-article `docker-compose.yml` and `rollup.config.js`
- **Vite + Three.js** — `src/` compiled to `index.js` IIFE bundle
- **Pre-built external** — `index.js` deployed from a separate repository (e.g. `lbm-fluid`)

The key design constraint is that articles should remain functional indefinitely without maintenance. Each article carries its own `node_modules`, lock files, and build config so it is never affected by changes to other articles or the main site.

### Infrastructure

- Nginx + PHP-FPM, both running in Docker for local dev
- Deployment: `rsync` via `scripts/deploy.sh`; see `.rsync-filter` for excluded paths
- No database — the filesystem is the data store
