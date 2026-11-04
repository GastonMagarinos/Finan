import pg from "pg";
import { config } from "./config.js";

pg.types.setTypeParser(1700, Number); // numeric(12,2) llega como número (cabe de sobra en un double)

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: /supabase/.test(config.databaseUrl) ? { rejectUnauthorized: false } : undefined, // Supabase exige SSL
  max: config.prod ? 3 : 10, // serverless: pocas conexiones por instancia; el pooler de Supabase hace el resto
});
export const query = (texto, params) => pool.query(texto, params);

/** Ejecuta `fn(client)` dentro de una transacción SQL: todo o nada. */
export async function transaccion(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally { client.release(); }
}
