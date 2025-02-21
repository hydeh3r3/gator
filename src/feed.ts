import { RSSFeed, RSSItem } from "./types.js";
import { XMLParser } from "fast-xml-parser";

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      'User-Agent': 'gator'
    }
  });

  const xmlText = await response.text();
  const parser = new XMLParser();
  const parsed = parser.parse(xmlText);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error('Invalid RSS feed: missing channel element');
  }

  if (!channel.title || !channel.description || !channel.link) {
    throw new Error('Invalid RSS feed: missing required channel fields');
  }

  const items: RSSItem[] = [];
  if (channel.item && Array.isArray(channel.item)) {
    for (const item of channel.item) {
      if (item.title && item.description && item.link && item.pubDate) {
        items.push({
          title: item.title,
          description: item.description,
          link: item.link,
          pubDate: item.pubDate
        });
      }
    }
  }

  return {
    title: channel.title,
    description: channel.description,
    link: channel.link,
    items
  };
} 