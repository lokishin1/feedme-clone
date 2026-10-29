import { parseHTML } from "linkedom";
import { Defuddle } from "defuddle/node";

export type ConvertResult =
  | {
      ok: true;
      title: string;
      author: string;
      domain: string;
      markdown: string;
    }
  | { ok: false; reason: "invalid-url" | "unreachable" | "no-content" };

const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; UrlToMarkdown/1.0; +https://github.com/lokishin1/feedme-clone)";

type Fetcher =(url: string, init?: RequestInit) => Promise<Response>;

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export async function convertUrl(
  value: string,
  fetcher: Fetcher = fetch
): Promise<ConvertResult> {
  const url = parseHttpUrl(value.trim());
  if (!url) return { ok: false, reason: "invalid-url" };

  let html: string;
  try {
    const response = await fetcher(url.href, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const isHtml = /html/i.test(response.headers.get("content-type") ?? "");
    if (!response.ok || !isHtml) return { ok: false, reason: "unreachable" };
    html = await response.text();
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  const { document } = parseHTML(html);
  const page = await Defuddle(document, url.href, { markdown: true });
  if (!page.content.trim()) return { ok: false, reason: "no-content" };

  return {
    ok: true,
    title: page.title,
    author: page.author,
    domain: url.hostname,
    markdown: page.content,
  };
}
