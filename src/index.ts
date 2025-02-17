import { readConfig, setUser } from "./config.js";

function main() {
  // Set user and update config
  setUser("Ali");
  
  // Read and display updated config
  const config = readConfig();
  console.log("Current config:", JSON.stringify(config, null, 2));
}

main();
