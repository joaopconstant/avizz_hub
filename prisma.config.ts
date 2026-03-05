import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Carrega .env.local primeiro (Next.js convention), depois .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL para migrations (sem pooler), DATABASE_URL como fallback
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
