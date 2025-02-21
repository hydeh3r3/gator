import { db } from '..';
import { feeds, users, feedFollows } from '../../../src/schema';
import type { Feed } from '../../../src/schema';
import { eq, and } from 'drizzle-orm';

export async function createFeed(name: string, url: string, userId: number): Promise<Feed> {
  const [result] = await db.insert(feeds)
    .values({ name, url, userId })
    .returning();
  return result;
}

export async function getFeedByUrl(url: string): Promise<Feed | undefined> {
  const [result] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.url, url))
    .limit(1);
  return result;
}

export async function createFeedFollow(userId: number, feedId: number): Promise<{
  feedName: string;
  userName: string;
}> {
  await db.insert(feedFollows)
    .values({ userId, feedId });
  
  const [result] = await db
    .select({
      feedName: feeds.name,
      userName: users.name
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .innerJoin(users, eq(users.id, feedFollows.userId))
    .where(and(
      eq(feedFollows.userId, userId),
      eq(feedFollows.feedId, feedId)
    ));
  
  return result;
}

export async function getFeedFollowsForUser(userId: number): Promise<{
  feedName: string;
  userName: string;
}[]> {
  return await db
    .select({
      feedName: feeds.name,
      userName: users.name
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feeds.id, feedFollows.feedId))
    .innerJoin(users, eq(users.id, feedFollows.userId))
    .where(eq(feedFollows.userId, userId));
}

export async function getAllFeeds(): Promise<(Feed & { userName: string })[]> {
  return await db
    .select({
      id: feeds.id,
      name: feeds.name,
      url: feeds.url,
      createdAt: feeds.createdAt,
      userName: users.name
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
} 