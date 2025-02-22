import { db } from '..';
import { posts, feeds, users } from '../../../src/schema';
import type { Post } from '../../../src/schema';
import { eq, desc } from 'drizzle-orm';

export async function createPost(
  title: string,
  url: string,
  description: string,
  publishedAt: Date,
  feedId: number
): Promise<Post | null> {
  try {
    const [result] = await db.insert(posts)
      .values({ title, url, description, publishedAt, feedId })
      .returning();
    return result;
  } catch (error) {
    if ((error as Error).message.includes('duplicate key')) {
      return null;
    }
    throw error;
  }
}

export async function getPostsForUser(userId: number, limit: number = 2): Promise<Post[]> {
  return await db
    .select({
      id: posts.id,
      title: posts.title,
      url: posts.url,
      description: posts.description,
      publishedAt: posts.publishedAt,
      feedName: feeds.name
    })
    .from(posts)
    .innerJoin(feeds, eq(feeds.id, posts.feedId))
    .innerJoin(feedFollows, eq(feedFollows.feedId, feeds.id))
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
} 