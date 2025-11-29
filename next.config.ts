// pages/api/scrape.ts
import type { NextApiRequest, NextApiResponse } from "next";

interface ScrapeResult {
  url: string;
  redirectLinks: string[];
  copyableTexts: string[];
}

async function scrapeURL(targetUrl: string): Promise<ScrapeResult> {
  const redirectLinks: string[] = [];
  const copyableTexts: string[] = [];

  try {
    const res = await fetch(targetUrl);
    const html = await res.text();

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
  } catch (err) {
    console.error(err);
  }

  return { url: targetUrl, redirectLinks, copyableTexts };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScrapeResult | { error: string }>
) {
  const target = req.query.url as string;
  if (!target) return res.status(400).json({ error: "Missing url" });

  const result = await scrapeURL(target);
  res.status(200).json(result);
}
