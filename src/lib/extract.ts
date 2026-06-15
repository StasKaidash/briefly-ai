import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const MAX_CONTENT_CHARS = 12_000;
const FETCH_TIMEOUT_MS = 30_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; briefly-ai/0.1; +https://github.com/StasKaidash/briefly-ai)";

export type ExtractedArticle = {
  title: string;
  content: string;
  byline: string | null;
};

export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

/**
 * Fetches an article URL, runs Mozilla Readability over the HTML, and returns
 * a trimmed plain-text payload suitable for the summarizer prompt.
 *
 * Throws ExtractError on:
 * - non-2xx HTTP response
 * - empty body / Readability could not extract main content
 * - request timeout (30s)
 */
export async function extractArticle(url: string): Promise<ExtractedArticle> {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExtractError(`Failed to fetch article: ${message}`);
  });

  if (!response.ok) {
    throw new ExtractError(
      `Article fetch returned HTTP ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  if (!html.trim()) throw new ExtractError("Article body was empty");

  // `linkedom` is a serverless-friendly DOM that works as a drop-in for
  // Readability — `jsdom` pulled native deps that broke on Vercel (see
  // `serverExternalPackages` history). `documentURI` is set for relative
  // link resolution inside Readability.
  const { document } = parseHTML(html);
  Object.defineProperty(document, "documentURI", { value: url });
  const article = new Readability(document).parse();

  if (!article || !article.textContent?.trim()) {
    throw new ExtractError(
      "Could not extract article body (paywall or non-article page?)",
    );
  }

  const content = article.textContent.replace(/\s+/g, " ").trim();

  return {
    title: article.title?.trim() || "Untitled",
    content: content.slice(0, MAX_CONTENT_CHARS),
    byline: article.byline?.trim() || null,
  };
}
