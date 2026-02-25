import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI operations (migrations) use the direct connection, not the pooler
    url: env("DIRECT_URL"),
  },
});
