import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db.js";
import { HttpError, traducirUnico } from "../errors.js";
import { validar } from "../validate.js";
import { cerrarSesion, requiereSesion } from "../auth.js";
import { datosUsuario, passwordSchema } from "./auth.js";

export const router = Router();
router.use("/perfil", requiereSesion);

router.put("/perfil", validar(datosUsuario), async (req, res) => {
  const d = res.locals.body;
  try {
    await query("UPDATE users SET username=$1, email=$2, name=$3, lastname=$4 WHERE id=$5", [d.username, d.email, d.nombre, d.apellido, req.userId]);
  } catch (e) { throw traducirUnico(e); }
  res.json({ id: req.userId, nombre: d.nombre, apellido: d.apellido, username: d.username, email: d.email });
});

// OJO: una contraseña actual incorrecta NO es 401 (el front lo tomaría como sesión vencida y redirigiría al login).
router.put("/perfil/password", validar(z.object({ actual: z.string().min(1, "Obligatoria."), nueva: passwordSchema })), async (req, res) => {
  const { actual, nueva } = res.locals.body;
  const { rows: [u] } = await query("SELECT password FROM users WHERE id = $1", [req.userId]);
  if (!u || !(await bcrypt.compare(actual, u.password))) throw new HttpError(422, "Revisá los datos ingresados.", { actual: "La contraseña actual es incorrecta." });
  await query("UPDATE users SET password = $1 WHERE id = $2", [await bcrypt.hash(nueva, 12), req.userId]);
  res.json({});
});

router.delete("/perfil", async (req, res) => {
  await query("DELETE FROM users WHERE id = $1", [req.userId]); // cuentas, categorías, presupuestos y movimientos caen en cascada
  cerrarSesion(res);
  res.status(204).end();
});
