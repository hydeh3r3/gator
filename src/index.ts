import { readConfig, setUser, getCurrentUser } from "./config.js";
import { createUser, getUserByName, resetDatabase, getUsers } from "../lib/db/queries/users.js";
import { fetchFeed } from "./feed.js";
import { createFeed, getAllFeeds, getFeedByUrl, createFeedFollow, getFeedFollowsForUser } from "../lib/db/queries/feeds.js";
import type { Feed, User } from "./schema.js";  

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;
type UserCommandHandler = (cmdName: string, user: User, ...args: string[]) => Promise<void>;

const middlewareLoggedIn = (handler: UserCommandHandler): CommandHandler => {
  return async (cmdName: string, ...args: string[]): Promise<void> => {
    const currentUserName = getCurrentUser();
    if (!currentUserName) {
      throw new Error('You must be logged in');
    }
    
    const user = await getUserByName(currentUserName);
    if (!user) {
      throw new Error('Current user not found in database');
    }
    
    await handler(cmdName, user, ...args);
  };
};

async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length !== 0) {
    throw new Error('Usage: reset');
  }
  
  await resetDatabase();
  console.log('Database reset successful');
}

async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length !== 1) {
    throw new Error('Usage: login <username>');
  }
  const username = args[0];
  
  const user = await getUserByName(username);
  if (!user) {
    throw new Error(`User ${username} does not exist. Use 'register' command to create a new account.`);
  }

  setUser(username);
  console.log(`Logged in as ${username}`);
}

async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length !== 1) {
    throw new Error('Usage: register <username>');
  }
  const username = args[0];
  
  const existingUser = await getUserByName(username);
  if (existingUser) {
    throw new Error(`User ${username} already exists`);
  }

  await createUser(username);
  setUser(username);
  console.log(`Registered and logged in as ${username}`);
}

async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length !== 0) {
    throw new Error('Usage: users');
  }
  
  const users = await getUsers();
  const currentUser = getCurrentUser();
  
  for (const user of users) {
    const isCurrent = user.name === currentUser;
    console.log(`* ${user.name}${isCurrent ? ' (current)' : ''}`);
  }
}

async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length !== 0) {
    throw new Error('Usage: agg');
  }
  
  const feed = await fetchFeed('https://www.wagslane.dev/index.xml');
  console.log(JSON.stringify(feed, null, 2));
}

async function handlerAddFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length !== 2) {
    throw new Error('Usage: addfeed <name> <url>');
  }

  const [name, url] = args;
  const feed = await createFeed(name, url, user.id);
  const follow = await createFeedFollow(user.id, feed.id);
  console.log(`User ${follow.userName} is now following ${follow.feedName}`);
}

async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length !== 0) {
    throw new Error('Usage: feeds');
  }
  
  const feeds = await getAllFeeds();
  if (feeds.length === 0) {
    console.log('No feeds found');
    return;
  }

  console.log('Feeds:');
  for (const feed of feeds) {
    console.log(`* ${feed.name}`);
    console.log(`  URL: ${feed.url}`);
    console.log(`  Added by: ${feed.userName}\n`);
  }
}

async function handlerFollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length !== 1) {
    throw new Error('Usage: follow <url>');
  }

  const url = args[0];
  const feed = await getFeedByUrl(url);
  if (!feed) {
    throw new Error(`No feed found with URL: ${url}`);
  }

  const result = await createFeedFollow(user.id, feed.id);
  console.log(`User ${result.userName} is now following ${result.feedName}`);
}

async function handlerFollowing(cmdName: string, user: User, ...args: string[]): Promise<void> {
  if (args.length !== 0) {
    throw new Error('Usage: following');
  }

  const follows = await getFeedFollowsForUser(user.id);
  if (follows.length === 0) {
    console.log('Not following any feeds');
    return;
  }

  console.log('Following:');
  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
}

function printFeed(feed: Feed, user: User): void {
  console.log('Feed Details:');
  console.log(`  Name: ${feed.name}`);
  console.log(`  URL: ${feed.url}`);
  console.log(`  Added by: ${user.name}`);
  console.log(`  Created at: ${feed.createdAt}`);
}

function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler): void {
  registry[cmdName] = handler;
}

async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }
  await handler(cmdName, ...args);
}

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, 'login', handlerLogin);
  registerCommand(registry, 'register', handlerRegister);
  registerCommand(registry, 'reset', handlerReset);
  registerCommand(registry, 'users', handlerUsers);
  registerCommand(registry, 'agg', handlerAgg);
  registerCommand(registry, 'addfeed', middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, 'feeds', handlerFeeds);
  registerCommand(registry, 'follow', middlewareLoggedIn(handlerFollow));
  registerCommand(registry, 'following', middlewareLoggedIn(handlerFollowing));

  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Error: Please provide a command');
    process.exit(1);
  }

  const [cmdName, ...cmdArgs] = args;
  
  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
