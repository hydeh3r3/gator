import { db } from '..';
import { users } from '../../../src/schema';
import { eq } from 'drizzle-orm';

export async function getUsers() {
  return await db.select().from(users).orderBy(users.name);
}

export async function resetDatabase() {
  await db.delete(users);
}

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name }).returning();
  return result;
}

export async function getUserByName(name: string) {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.name, name))
    .limit(1);
  return result;
}