import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true }); // backend/.env (en Vercel no existe: se usan sus variables)

const exigir = (clave) => {
  const v = process.env[clave];
  if (!v) throw new Error(`Falta la variable de entorno ${clave} (ver .env.example)`);
  return v;
};
const prod = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
const jwtSecret = exigir("JWT_SECRET");
if (jwtSecret.length < 32) throw new Error("JWT_SECRET debe tener al menos 32 caracteres");

export const config = {
  prod,
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: exigir("DATABASE_URL"),
  jwtSecret,
  frontendUrls: (process.env.FRONTEND_URL ?? "http://localhost:5500").split(",").map((s) => s.trim()),
  cookie: { name: "finan_token", httpOnly: true, secure: prod || process.env.COOKIE_SAMESITE === "none", sameSite: process.env.COOKIE_SAMESITE ?? "lax", maxAge: 7 * 24 * 3600 * 1000 },
};
