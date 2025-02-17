import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import os from 'os';

import { users } from '../../src/schema.js';
import { readConfig } from '../../src/config.js';

const username = os.userInfo().username;
const config = readConfig();
const conn = postgres(config.dbUrl.replace('postgres://', `postgres://${username}:`));
export const db = drizzle(conn, { schema: { users } });
