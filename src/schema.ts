import { pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const feeds = pgTable('feeds', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  userId: serial('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    urlIdx: uniqueIndex('url_idx').on(table.url)
  };
});

export const feedFollows = pgTable('feed_follows', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  feedId: serial('feed_id').references(() => feeds.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    userFeedIdx: uniqueIndex('user_feed_idx').on(table.userId, table.feedId)
  };
});

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;
export type FeedFollow = typeof feedFollows.$inferSelect;
