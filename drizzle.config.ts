import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
    throw new Error('database URL is not provided in the environment variables');
}


export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: ["!spatial_ref_sys", "!geography_columns", "!geometry_columns"],
});