import { Pool } from "pg";

declare global {
  var __bestBooksPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function getDb() {
  if (!global.__bestBooksPool) {
    global.__bestBooksPool = createPool();
  }
  return global.__bestBooksPool;
}
