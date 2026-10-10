// Runs db/schema.sql then db/seed.sql against DATABASE_URL (Supabase or any Postgres).
// DATABASE_URL comes from the environment, or from .env.local (`vercel env pull`).
// Alternative: paste db/schema.sql then db/seed.sql into Supabase's SQL Editor and click Run.
import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";

if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
  if (line) process.env.DATABASE_URL = line.slice("DATABASE_URL=".length).replace(/^"|"$/g, "");
}
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgres")) {
  console.error("DATABASE_URL is not set. Copy it from Supabase → Connect, or paste db/schema.sql and db/seed.sql into the Supabase SQL Editor.");
  process.exit(1);
}

const ssl = process.env.DB_SSL === "disable" ? false : "require";
const db = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, ssl });
try {
  for (const file of ["db/schema.sql", "db/seed.sql"]) {
    await db.unsafe(readFileSync(file, "utf8"));
    console.log(`✓ ${file}`);
  }
  const [r] = await db`SELECT (SELECT count(*) FROM designers) AS designers, (SELECT count(*) FROM designer_slots) AS slots`;
  console.log(`Designers: ${r.designers}, open calendar slots: ${r.slots}`);
} finally {
  await db.end();
}
