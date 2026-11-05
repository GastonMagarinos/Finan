import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { query } from "../db.js";
import { HttpError, traducirUnico } from "../errors.js";
import { validar } from "../validate.js";
import { iniciarSesion, cerrarSesion, requiereSesion } from "../auth.js";

export const passwordSchema = z.string().min(8, "Mínimo 8 caracteres.").max(72, "Máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "Incluí al menos una letra.").regex(/\d/, "Incluí al menos un número.");
export const datosUsuario = z.object({
  nombre: z.string().trim().min(1, "Obligatorio.").max(50, "Máximo 50 caracteres."),
  apellido: z.string().trim().min(1, "Obligatorio.").max(50, "Máximo 50 caracteres."),
  username: z.string().trim().regex(/^[A-Za-z0-9_.]{3,10}$/, "De 3 a 10 caracteres: letras, números, _ o ."),
  email: z.string().trim().toLowerCase().email("Correo inválido.").max(50, "Máximo 50 caracteres."),
});

const limitarLogin = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true,standardHeaders: true, legacyHeaders: false, message: { mensaje: "Demasiados intentos. Probá de nuevo en unos minutos." } });
const HASH_FALSO = bcrypt.hashSync("usuario-inexistente", 12); // para que tardar igual exista o no el usuario

export const router = Router();

router.post("/registro", validar(datosUsuario.extend({ password: passwordSchema })), async (_req, res) => {
  const d = res.locals.body;
  try {
    const hash = await bcrypt.hash(d.password, 12);
    const { rows: [u] } = await query(
      "INSERT INTO users (username, password, email, name, lastname) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [d.username, hash, d.email, d.nombre, d.apellido]);
    iniciarSesion(res, u.id);
    res.status(201).json({ id: u.id });
  } catch (e) { throw traducirUnico(e); }
});

router.post("/login", limitarLogin, validar(z.object({ identificador: z.string().trim().min(1), password: z.string().min(1) })), async (_req, res) => {
  const { identificador, password } = res.locals.body;
  const { rows: [u] } = await query("SELECT id, password FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1)", [identificador]);
  const coincide = await bcrypt.compare(password, u?.password ?? HASH_FALSO);
  if (!u || !coincide) throw new HttpError(401, "Usuario o contraseña incorrectos.");
  iniciarSesion(res, u.id);
  res.json({ id: u.id });
});

router.post("/logout", (_req, res) => { cerrarSesion(res); res.status(204).end(); });

router.get("/yo", requiereSesion, async (req, res) => {
  const { rows: [u] } = await query("SELECT id, name AS nombre, lastname AS apellido, username, email FROM users WHERE id = $1", [req.userId]);
  if (!u) throw new HttpError(401, "La sesión venció.");
  res.json(u);
});
