// main.ts (Deno Deploy 用)
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

    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href.startsWith("javascript:")) {
        try {
          redirectLinks.push(new URL(href, targetUrl).href);
        } catch {}
      }
    }

    const textRegex = />([^<]{5,})</gi;
    while ((match = textRegex.exec(html)) !== null) {
      const text = match[1].trim();
      if (text) copyableTexts.push(text);
    }

    return { url: targetUrl, redirectLinks, copyableTexts };
  } catch (err) {
    console.error("scrapeURL error:", err);
    return { url: targetUrl, redirectLinks: [], copyableTexts: [] };
  }
}

serve(async (req) => {
  try {
    const urlObj = new URL(req.url);

    if (urlObj.pathname === "/scrape") {
      const target = urlObj.searchParams.get("url");
      if (!target) {
        return new Response("Missing 'url' query parameter", { status: 400 });
      }

      const result = await scrapeURL(target);
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response("Server running", { status: 200 });
  } catch (err) {
    console.error("Server error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
