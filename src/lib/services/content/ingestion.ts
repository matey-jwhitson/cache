import RSSParser from "rss-parser";
import * as cheerio from "cheerio";
import { db } from "@/lib/db";

const RSS_FETCH_TIMEOUT_MS = 30_000;

const parser = new RSSParser({
  timeout: RSS_FETCH_TIMEOUT_MS,
});

function normalizeHtml(html: string): { text: string; title?: string } {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, aside").remove();

  const title = $("title").text().trim() || undefined;
  const text = $.text()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

  return { text, title };
}

export interface IngestedItem {
  id: string;
  title: string;
  sourceType: string;
  content: string;
}

export async function ingestRss(feedUrl: string): Promise<IngestedItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT_MS);

  let feed;
  try {
    const res = await fetch(feedUrl, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${feedUrl}`);
    const xml = await res.text();
    feed = await parser.parseString(xml);
  } finally {
    clearTimeout(timeoutId);
  }
  const items: IngestedItem[] = [];
  const feedEntries = feed.items.slice(0, 50);

  for (const entry of feedEntries) {
    const rawContent = entry["content:encoded"] ?? entry.content ?? entry.summary ?? "";
    const { text } = normalizeHtml(rawContent);
    const title = entry.title ?? text.slice(0, 60);

    const existing = await db.contentItem.findFirst({
      where: { title, sourceType: "rss" },
      select: { id: true },
    });
    if (existing) continue;

    const record = await db.contentItem.create({
      data: {
        title,
        author: entry.creator ?? entry.author ?? null,
        sourceType: "rss",
        content: text,
        status: "new",
      },
    });

    items.push({
      id: record.id,
      title: record.title,
      sourceType: record.sourceType,
      content: record.content,
    });
  }

  return items;
}

export async function ingestManual(
  text: string,
  title?: string,
  author?: string,
): Promise<IngestedItem> {
  const finalTitle = title ?? text.split("\n")[0]?.slice(0, 100) ?? "Untitled";

  const record = await db.contentItem.create({
    data: {
      title: finalTitle,
      author: author ?? null,
      sourceType: "manual",
      content: text,
      status: "new",
    },
  });

  return {
    id: record.id,
    title: record.title,
    sourceType: record.sourceType,
    content: record.content,
  };
}
