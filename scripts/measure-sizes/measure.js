/**
 * Measures the download weight of every article and records it in the
 * article's own <head> as <meta name="size">.
 *
 * The measurement has to be done by a real browser. Several articles ship a
 * tiny index.html whose Three.js bundle then fetches megabytes of models,
 * cubemaps and HDR environment maps; nothing static can see those. Driving the
 * rendered /article/{slug} URL also picks up the shared chrome (desk.css,
 * style.css, article.js, fonts) and naturally excludes the sourcemaps, which a
 * normal browser never asks for.
 *
 * Requires the dev server: docker-compose up -d
 *
 *   node measure.js            measure everything
 *   node measure.js robo-shoot only these slugs
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://netdev.samdriver.xyz';
const DATA_PATH = path.join(__dirname, '../../public/article-data');

// The heavy articles pull their assets in slowly and, in one case, only once
// the page has been scrolled. Give the network room to go quiet.
const IDLE_TIMEOUT_MS = 90000;
const SETTLE_MS = 2500;

/**
 * Article directories, by the same rule the site itself uses: a directory
 * containing an index.html.
 */
function findSlugs() {
    return fs
        .readdirSync(DATA_PATH, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((slug) => fs.existsSync(path.join(DATA_PATH, slug, 'index.html')))
        .sort();
}

/**
 * Total bytes the browser pulls down for one article.
 *
 * Counted once per URL. decal-render-intro embeds three Unity players that all
 * start together and each request the same ~4.4MB build; with no Cache-Control
 * on the responses, nothing is in the cache yet and all three really do go to
 * the network. Counting that build three times describes a race, not the
 * article, so the weight here is the distinct bytes the article is made of.
 */
async function measure(browser, slug) {
    // A fresh context each time, so nothing is served from a warm cache.
    const context = await browser.newContext({ bypassCSP: true });
    const page = await context.newPage();

    const byUrl = new Map();

    page.on('response', async (response) => {
        try {
            const body = await response.body();
            byUrl.set(response.url(), body.length);
        } catch {
            // Redirects and aborted requests have no retrievable body.
        }
    });

    await page.goto(`${BASE_URL}/article/${slug}`, {
        waitUntil: 'load',
        timeout: IDLE_TIMEOUT_MS,
    });

    // Scroll-triggered loads (scroll-anim-model) only fire once the reader
    // moves down the page.
    await page.evaluate(async () => {
        const step = window.innerHeight / 2;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 150));
        }
        window.scrollTo(0, document.body.scrollHeight);
    });

    try {
        await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT_MS });
    } catch {
        console.warn(`  ! ${slug}: network never went idle, using the total so far`);
    }

    // Late arrivals after idle (decoded textures kicking off another fetch).
    await page.waitForTimeout(SETTLE_MS);

    await context.close();

    const total = [...byUrl.values()].reduce((sum, bytes) => sum + bytes, 0);

    return { total, requestCount: byUrl.size };
}

/**
 * Write <meta name="size"> into the article's head, replacing any existing one.
 *
 * Deliberately a targeted string edit: these files are hand-written and
 * round-tripping them through a DOM parser would reformat them wholesale.
 */
function recordSize(slug, bytes) {
    const file = path.join(DATA_PATH, slug, 'index.html');
    const original = fs.readFileSync(file, 'utf8');

    // Some articles are CRLF. Match the file rather than imposing \n on it:
    // a multiline $ sits before the \r, so inserting a bare \n would shunt the
    // carriage return onto the wrong line and touch lines we never measured.
    const eol = original.includes('\r\n') ? '\r\n' : '\n';

    const existing = /^([ \t]*)<meta\s+name="size"\s+content="\d+"\s*\/?>[ \t]*$/m;
    if (existing.test(original)) {
        const updated = original.replace(
            existing,
            (match, indent) => `${indent}<meta name="size" content="${bytes}">`
        );
        fs.writeFileSync(file, updated);
        return updated !== original ? 'updated' : 'unchanged';
    }

    // Sit alongside the other ordering metadata where possible, otherwise just
    // after the title.
    const anchor =
        /^([ \t]*)<meta\s+name="sort"\s+content="[^"]*"\s*\/?>[ \t]*$/m.test(original)
            ? /^([ \t]*)<meta\s+name="sort"\s+content="[^"]*"\s*\/?>[ \t]*$/m
            : /^([ \t]*)<title>.*<\/title>[ \t]*$/m;

    if (!anchor.test(original)) {
        throw new Error(`no <meta name="sort"> or <title> to anchor to in ${slug}/index.html`);
    }

    const updated = original.replace(
        anchor,
        (match, indent) => `${match}${eol}${indent}<meta name="size" content="${bytes}">`
    );
    fs.writeFileSync(file, updated);

    return 'added';
}

function humanise(bytes) {
    if (bytes < 1000) return `${bytes} B`;
    if (bytes < 1000000) return `${Math.round(bytes / 1000)} kB`;
    return `${(bytes / 1000000).toFixed(1)} MB`;
}

async function main() {
    const requested = process.argv.slice(2);
    const slugs = requested.length > 0 ? requested : findSlugs();

    const browser = await chromium.launch();
    const results = [];

    for (const slug of slugs) {
        process.stdout.write(`Measuring ${slug} ... `);
        const { total, requestCount } = await measure(browser, slug);
        const action = recordSize(slug, total);
        console.log(`${humanise(total)} (${requestCount} files, ${action})`);
        results.push({ slug, total });
    }

    await browser.close();

    console.log('\n--- Article download weight ---');
    results
        .sort((a, b) => b.total - a.total)
        .forEach(({ slug, total }) => {
            console.log(`${humanise(total).padStart(9)}  ${slug}`);
        });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
