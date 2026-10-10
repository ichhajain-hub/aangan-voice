import postgres from "postgres";

// Tagged-template SQL over a normal Postgres connection (Supabase, Neon or any Postgres).
// Use Supabase's "Transaction pooler" connection string (port 6543) on Vercel.
// prepare:false is required by the transaction pooler. Created lazily so `next build` doesn't need DATABASE_URL.
let client: postgres.Sql<any> | null = null;
export function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]> {
  client ??= postgres(process.env.DATABASE_URL!, {
    prepare: false, max: 1, ssl: process.env.DB_SSL === "disable" ? false : "require",
    // The app already passes JSON.stringify(...) for json/jsonb columns; send those strings as-is
    // instead of letting the driver encode them a second time.
    types: { jsonText: { to: 3802, from: [114, 3802], serialize: (x: unknown) => (typeof x === "string" ? x : JSON.stringify(x)), parse: (x: string) => JSON.parse(x) } },
  });
  return client(strings, ...(values as any[])) as unknown as Promise<any[]>;
}
