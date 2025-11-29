import type { NextApiRequest, NextApiResponse } from "next";

interface ScrapeResult {
  url: string;
  redirectLinks: string[];
  copyableTexts: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScrapeResult | { error: string }>
) {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: "Missing 'url' parameter" });
    return;
  }

  try {
    const response = await fetch(targetUrl);
    const html = await response.text();

    const redirectLinks: string[] = [];
    const copyableTexts: string[] = [];

    // <a href=""> リンク抽出
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href.startsWith("javascript:")) {
        try {
          redirectLinks.push(new URL(href, targetUrl).href);
        } catch {
          // 無効なURLは無視
        }
      }
    }

    // コピー可能テキスト抽出（5文字以上）
    const textRegex = />([^<]{5,})</gi;
    while ((match = textRegex.exec(html)) !== null) {
      const text = match[1].trim();
      if (text) copyableTexts.push(text);
    }

    // 結果を返す
    res.status(200).json({ url: targetUrl, redirectLinks, copyableTexts });
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).json({ error: "Failed to fetch or parse URL" });
  }
}
