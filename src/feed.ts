import { RSSFeed, RSSItem } from "./types.js";
import { XMLParser } from "fast-xml-parser";
import { getNextFeedToFetch, markFeedFetched } from "../lib/db/queries/feeds.js";
import { createPost } from "../lib/db/queries/posts.js";

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

export function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);
  if (!match) {
    throw new Error('Invalid duration format. Use: 100ms, 1s, 1m, 1h');
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    'ms': 1,
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000
  };
  
  return value * multipliers[unit];
}

export async function scrapeFeeds(): Promise<void> {
  const feed = await getNextFeedToFetch();
  if (!feed) {
    console.log('No feeds to fetch');
    return;
  }

  console.log(`Fetching feed: ${feed.name} (${feed.url})`);
  await markFeedFetched(feed.id);

  try {
    const rssFeed = await fetchFeed(feed.url);
    for (const item of rssFeed.items) {
      try {
        const publishedAt = new Date(item.pubDate);
        await createPost(
          item.title,
          item.link,
          item.description,
          publishedAt,
          feed.id
        );
      } catch (error) {
        console.error(`Error saving post "${item.title}":`, error);
      }
    }
  } catch (error) {
    console.error(`Error fetching feed ${feed.name}:`, error);
  }
}

export function handleError(error: unknown): void {
  console.error('Error in feed aggregator:', error);
} 