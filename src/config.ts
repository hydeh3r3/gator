import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), '.gatorconfig.json');
}

function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== 'object' || rawConfig === null) {
    throw new Error('Config must be an object');
  }
  if (typeof rawConfig.db_url !== 'string') {
    throw new Error('Config must contain db_url string');
  }
  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name
  };
}

function writeConfig(cfg: Config): void {
  const configPath = getConfigFilePath();
  const fileConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName
  };
  fs.writeFileSync(configPath, JSON.stringify(fileConfig, null, 2));
}

export function readConfig(): Config {
  const configPath = getConfigFilePath();
  
  if (!fs.existsSync(configPath)) {
    const defaultConfig: Config = {
      dbUrl: 'postgres://example'
    };
    writeConfig(defaultConfig);
    return defaultConfig;
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  const rawConfig = JSON.parse(configContent);
  return validateConfig(rawConfig);
}

export function setUser(userName: string): void {
  const config = readConfig();
  config.currentUserName = userName;
  writeConfig(config);
}
