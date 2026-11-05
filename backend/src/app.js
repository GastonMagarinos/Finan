import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { manejarErrores, noEncontrado } from "./errors.js";
import { router as auth } from "./routes/auth.js";
import { router as resumen } from "./routes/resumen.js";
import { router as catalogos } from "./routes/catalogos.js";
import { router as presupuestos } from "./routes/presupuestos.js";
import { router as transacciones } from "./routes/transacciones.js";
import { router as perfil } from "./routes/perfil.js";

export const app = express();
if (config.prod) app.set("trust proxy", 1); // detrás de un proxy (Render, Railway, Fly...) para que el rate limit vea la IP real
app.use(helmet());
app.use(cors({ origin: config.frontendUrls, credentials: true })); // credentials: el front manda la cookie de sesión
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

app.get("/api/salud", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", auth);
app.use("/api", resumen, catalogos, presupuestos, transacciones, perfil);

app.use(noEncontrado);
app.use(manejarErrores);
