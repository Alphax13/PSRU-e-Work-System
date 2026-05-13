import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

// WebSocket transport uses port 443 — works through firewalls that block 5432.
neonConfig.webSocketConstructor = ws;
// Disable pipelining on connect — more stable for serverless/dev environments.
neonConfig.pipelineConnect = false;

// ── Global singleton — survives Next.js hot reloads in dev ──────────────────
declare global {
  // eslint-disable-next-line no-var
  var __neonPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__neonPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    global.__neonPool = new Pool({ connectionString: url });
  }
  return global.__neonPool;
}

/**
 * Tagged template SQL helper:
 *   const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  // Build parameterised query string
  let query = "";
  let idx = 1;
  const params: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      query += `$${idx++}`;
    }
  }

  // Wrap connect() AND query() — both can throw NeonDbError plain objects.
  let client: import("@neondatabase/serverless").PoolClient | undefined;
  try {
    client = await getPool().connect();
    const result = await client.query(query, params);
    return result.rows;
  } catch (err) {
    // NeonDbError is a plain object, not an Error instance — normalise it.
    if (err instanceof Error) throw err;
    throw new Error(
      err !== null && typeof err === "object"
        ? JSON.stringify(err, Object.getOwnPropertyNames(err as object))
        : String(err)
    );
  } finally {
    client?.release();
  }
}

