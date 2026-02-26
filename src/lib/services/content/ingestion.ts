import RSSParser from "rss-parser";
import * as cheerio from "cheerio";
import { db } from "@/lib/db";

const parser = new RSSParser();

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
  const feed = await parser.parseURL(feedUrl);
  const items: IngestedItem[] = [];

  for (const entry of feed.items) {
    const rawContent = entry["content:encoded"] ?? entry.content ?? entry.summary ?? "";
    const { text } = normalizeHtml(rawContent);
    const title = entry.title ?? text.slice(0, 60);

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
