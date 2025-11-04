// src/services/scraper.ts
import fs from "fs";
import path from "path";
import { chromium, BrowserContext } from "playwright";

const COOKIE_PATH = path.resolve(__dirname, "../../tmp/cookies.json");
const ARTIFACTS_DIR = path.resolve(__dirname, "../../tmp/artifacts");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureArtifactsDir() {
  try {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  } catch (e) {
    /* ignore */
  }
}

async function loadCookies(context: BrowserContext) {
  try {
    if (fs.existsSync(COOKIE_PATH)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIE_PATH, "utf-8"));
      await context.addCookies(cookies);
      console.log("Loaded cookies for context");
    }
  } catch (e) {
    console.warn("Failed to load cookies", e);
  }
}

async function saveCookies(context: BrowserContext) {
  try {
    const cookies = await context.cookies();
    fs.mkdirSync(path.dirname(COOKIE_PATH), { recursive: true });
    fs.writeFileSync(COOKIE_PATH, JSON.stringify(cookies, null, 2));
    console.log("Saved cookies");
  } catch (e) {
    console.warn("Failed to save cookies", e);
  }
}

function safeText(s: any) {
  if (!s) return "";
  return String(s).trim();
}

async function dumpDebug(page: any, prefix = "debug") {
  try {
    await ensureArtifactsDir();
    const ts = Date.now();
    const png = path.join(ARTIFACTS_DIR, `${prefix}-${ts}.png`);
    const html = path.join(ARTIFACTS_DIR, `${prefix}-${ts}.html`);
    await page.screenshot({ path: png, fullPage: true });
    const content = await page.content();
    fs.writeFileSync(html, content, "utf-8");
    console.log("Saved debug artifacts:", png, html);
  } catch (e) {
    console.warn("Failed to save artifacts", e);
  }
}

async function extractFromSearchContainer(page: any, limit: number) {
  // Strategy: prefer structured selectors, then fallback to scanning links with H3.
  const tries: Array<
    () => Promise<Array<{ title: string; url: string; snippet: string }>>
  > = [
    async () => {
      // Common older Google SERP blocks
      return page.$$eval("div.g", (nodes: any[]) =>
        nodes.map((node) => {
          const titleEl = node.querySelector("h3");
          const a = node.querySelector("a") as HTMLAnchorElement | null;
          const snippetEl =
            node.querySelector("div[data-snippet]") ||
            node.querySelector(".VwiC3b") ||
            node.querySelector(".IsZvec");
          const title = titleEl ? titleEl.textContent : null;
          const url = a ? a.href : null;
          const snippet = snippetEl ? snippetEl.textContent : "";
          return { title, url, snippet };
        })
      );
    },

    async () => {
      // Newer SERP structures use a data-testid or result selectors
      return page.$$eval('[data-testid="result"]', (nodes: any[]) =>
        nodes.map((node) => {
          const titleEl = node.querySelector("h2, h3, .result__title");
          const a = node.querySelector("a") as HTMLAnchorElement | null;
          const snippetEl = node.querySelector(
            ".result__snippet, .IsZvec, .VwiC3b"
          );
          const title = titleEl ? titleEl.textContent : null;
          const url = a ? a.href : null;
          const snippet = snippetEl ? snippetEl.textContent : "";
          return { title, url, snippet };
        })
      );
    },

    async () => {
      // Fallback: find links under #search that have an h3 child
      return page.$$eval("#search a > h3", (nodes: any[]) =>
        nodes.map((h3) => {
          const a = h3.closest("a") as HTMLAnchorElement | null;
          const title = h3.textContent || "";
          const url = a ? a.href : "";
          // snippet: try to find nearest paragraph sibling
          let snippet = "";
          try {
            const container = h3.closest("div");
            const sn =
              container?.querySelector(".VwiC3b, .IsZvec, .aCOpRe")
                ?.textContent || "";
            snippet = sn;
          } catch (e) {
            snippet = "";
          }
          return { title, url, snippet };
        })
      );
    },

    async () => {
      // Last resort: collect all links inside #search and return first N
      return page.$$eval("#search a[href]", (nodes: any[]) =>
        nodes
          .map((a) => {
            const title = (
              a.querySelector("h3")?.textContent ||
              a.textContent ||
              ""
            ).trim();
            const url = (a as HTMLAnchorElement).href || "";
            return { title, url, snippet: "" };
          })
          .filter((r) => r.title && r.url)
      );
    },
  ];

  for (const fn of tries) {
    try {
      const res = await fn();
      if (Array.isArray(res) && res.length > 0) {
        // normalize and return up to limit
        return res
          .map((r: any) => ({
            title: safeText(r.title),
            url: safeText(r.url),
            snippet: safeText(r.snippet),
          }))
          .filter((r: any) => r.title && r.url)
          .slice(0, limit);
      }
    } catch (e) {
      // continue to next strategy
      console.warn("Extraction strategy failed:", (e) || e);
    }
  }

  // nothing found
  return [];
}

export default {
  scrapeGoogle: async (query: string, limit = 8) => {
    const browser = await chromium.launch({
      headless: false, // run headful while debugging; set true later
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
    });

    await loadCookies(context);

    // small anti-detect tweaks
    await context.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // @ts-ignore
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
      // @ts-ignore
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    const page = await context.newPage();
    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9",
      "upgrade-insecure-requests": "1",
    });

    const url = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}&num=${limit}&hl=en&pws=0`;
    console.log("Navigating to", url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // wait for search container to appear or short timeout
    try {
      await page.waitForSelector("#search, body", { timeout: 7000 });
    } catch (e) {
      console.warn("Search container did not appear quickly");
    }

    const pageHtml = await page.content();

    // quick block detection: /sorry page or "unusual traffic"
    const currentUrl = page.url();
    const lc = pageHtml.toLowerCase();
    if (
      currentUrl.includes("/sorry") ||
      lc.includes("unusual traffic") ||
      lc.includes("our systems have detected")
    ) {
      console.warn(
        "Google likely blocked this request (CAPTCHA) ->",
        currentUrl
      );
      // save debug artifacts for inspection
      await dumpDebug(page, "google-blocked");
      await saveCookies(context);
      await browser.close();
      throw new Error(
        "Google blocked the request with CAPTCHA (unusual traffic)."
      );
    }

    // extraction: try multiple strategies
    const extracted = await extractFromSearchContainer(page, limit);
    console.log(
      `Extracted ${extracted.length} items (raw) from page for query: ${query}`
    );

    if (extracted.length === 0) {
      // save debug artifacts so you can open the HTML and screenshot
      await dumpDebug(page, "google-non-results");
    }

    await saveCookies(context);
    await browser.close();

    return extracted;
  },

  // fallback Scraper: DuckDuckGo (simpler, less likely blocked)
  scrapeDuck: async (query: string, limit = 8) => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      viewport: { width: 1200, height: 800 },
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
    });
    const page = await context.newPage();
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    console.log("DuckDuckGo navigating to", url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(400);

    const results = await page.$$eval(".result", (nodes: any[]) =>
      nodes.map((n) => {
        const a = n.querySelector("a.result__a") as HTMLAnchorElement | null;
        const title = a ? a.innerText : n.querySelector("a")?.textContent || "";
        const href = a ? a.href : "";
        const snippet =
          (
            n.querySelector(".result__snippet") ||
            n.querySelector(".result__excerpt")
          )?.textContent || "";
        return { title, url: href, snippet };
      })
    );

    await browser.close();
    const filtered = (results || [])
      .filter((r) => r.title && r.url)
      .slice(0, limit)
      .map((r) => ({
        title: safeText(r.title),
        url: safeText(r.url),
        snippet: safeText(r.snippet),
      }));

    console.log(
      "DuckDuckGo scraped",
      filtered.length,
      "results for query:",
      query
    );
    return filtered;
  },
};
