import { defineConfig } from "drizzle-kit";
import os from "os";

const username = os.userInfo().username;

export default defineConfig({
    schema: "src/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: `postgres://${username}:@localhost:5432/gator`,
    },
});
