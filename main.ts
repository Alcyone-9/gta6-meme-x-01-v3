// main.ts — builds POST.json for the gta6-meme-x-01 v3 entry ("DCTY IS FICTION.").
//
// Reads the post text from post-text.txt (in MAKEFUN_BOT_DIR) and writes
// POST.json into MAKEFUN_OUTPUT_DIR (default "out"). The post URL comes from
// the POST_URL env var; until the real X post exists it stays a placeholder
// that the parent agent replaces after posting.
//
// After writing, the file is read back and verified byte-for-byte: the text
// stored in POST.json must be byte-identical to the (trimmed) source text in
// post-text.txt, and must fit the 280-character X limit. Any mismatch throws,
// so a corrupted or drifted POST.json can never slip through silently.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PLACEHOLDER_URL = "https://x.com/0xRaphael__/status/0000000000000000000";
const MAX_POST_CHARS = 280;

// Byte-for-byte check: re-read the written POST.json, parse it, and compare
// its "text" field against the source text as raw UTF-8 buffers. Throws on
// any difference (content, encoding, or stray whitespace).
function verifyPostJson(outPath: string, sourceText: string): void {
  const parsed = JSON.parse(readFileSync(outPath, "utf8")) as { text?: unknown };
  if (typeof parsed.text !== "string") {
    throw new Error(`verification failed: ${outPath} has no string "text" field`);
  }
  const written = Buffer.from(parsed.text, "utf8");
  const expected = Buffer.from(sourceText, "utf8");
  if (!written.equals(expected)) {
    throw new Error(
      `verification failed: POST.json text is not byte-identical to post-text.txt ` +
        `(written ${written.length} bytes, expected ${expected.length} bytes)`,
    );
  }
  if (parsed.text.length > MAX_POST_CHARS) {
    throw new Error(
      `verification failed: post text is ${parsed.text.length} chars, over the ${MAX_POST_CHARS}-char limit`,
    );
  }
}

function main(): void {
  const botDir: string = process.env.MAKEFUN_BOT_DIR ?? ".";
  const outDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
  const url: string = process.env.POST_URL ?? PLACEHOLDER_URL;

  const text: string = readFileSync(join(botDir, "post-text.txt"), "utf8").trim();

  const post = { text, image: "meme.png", url };

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "POST.json");
  writeFileSync(outPath, JSON.stringify(post, null, 2) + "\n", "utf8");

  verifyPostJson(outPath, text);

  console.log(`wrote ${outPath} (${text.length} chars, verified byte-for-byte)`);
}

main();
