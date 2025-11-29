import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

interface ScrapeResult {
  url: string;
  redirectLinks: string[];
  copyableTexts: string[];
}

async function scrapeURL(targetUrl: string): Promise<ScrapeResult> {
  try {
    const res = await fetch(targetUrl);
    const html = await res.text();

    const redirectLinks: string[] = [];
    const copyableTexts: string[] = [];

    // リンク抽出
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href.startsWith("javascript:")) {
        redirectLinks.push(new URL(href, targetUrl).href);
      }
    }

    // コピー可能テキスト抽出
    const textRegex = />([^<]{5,})</gi;
    while ((match = textRegex.exec(html)) !== null) {
      const text = match[1].trim();
      if (text) copyableTexts.push(text);
    }

    // 簡易広告除外: position:fixed / position:absolute のiframeやdivを除外
    const adRegex = /<iframe[^>]+style=["'][^"']*(position\s*:\s*fixed|position\s*:\s*absolute).*?["']/gi;
    if (adRegex.test(html)) {
      // 広告除外ロジックを追加可能
    }

    return { url: targetUrl, redirectLinks, copyableTexts };
  } catch (err) {
    console.error(err);
    return { url: targetUrl, redirectLinks: [], copyableTexts: [] };
  }
}

serve(async (req) => {
  const urlParam = new URL(req.url).searchParams.get("url");
  if (!urlParam) return new Response("Missing 'url' query parameter", { status: 400 });

  const result = await scrapeURL(urlParam);
  return new Response(JSON.stringify(result), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" // Neocities からのアクセスを許可
    },
  });
}, { port: 8000 });

console.log("Server running on http://localhost:8000");
