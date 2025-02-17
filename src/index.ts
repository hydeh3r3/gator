import { readConfig, setUser, getCurrentUser } from "./config.js";
import { createUser, getUserByName, resetDatabase, getUsers } from "../lib/db/queries/users.js";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type CommandsRegistry = Record<string, CommandHandler>;

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
