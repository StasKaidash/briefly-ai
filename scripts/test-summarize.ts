/**
 * Probe script for the extract + summarize pipeline.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/test-summarize.ts <URL>
 *
 * Prints the extracted title/byline/word-count, then the Claude tool-call
 * output as JSON. Non-zero exit on extract or summarize failure.
 */
import { extractArticle, ExtractError } from "../src/lib/extract";
import { summarize, SummarizeError } from "../src/lib/anthropic";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("usage: test-summarize.ts <URL>");
    process.exit(2);
  }

  console.log(`→ extracting ${url}`);
  const article = await extractArticle(url);
  const words = article.content.split(/\s+/).filter(Boolean).length;
  console.log(`  title:   ${article.title}`);
  console.log(`  byline:  ${article.byline ?? "(none)"}`);
  console.log(`  content: ${words} words / ${article.content.length} chars`);

  console.log(`→ summarizing with Claude`);
  const t0 = Date.now();
  const brief = await summarize({
    title: article.title,
    content: article.content,
  });
  const dt = Date.now() - t0;

  console.log(`  done in ${dt}ms`);
  console.log(JSON.stringify(brief, null, 2));
}

main().catch((err: unknown) => {
  if (err instanceof ExtractError || err instanceof SummarizeError) {
    console.error(`[${err.name}] ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
