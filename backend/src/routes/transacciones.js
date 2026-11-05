import { Router } from "express";
import { z } from "zod";
import { query, transaccion } from "../db.js";
import { HttpError } from "../errors.js";
import { validar } from "../validate.js";
import { requiereSesion } from "../auth.js";
import { esFechaReal } from "../lib/fechas.js";

export const fecha = z.string().refine(esFechaReal, "Fecha inválida (AAAA-MM-DD).");
const id = z.coerce.number().int().positive();
const nombre = z.string().trim().min(1, "Obligatorio.").max(40, "Máximo 40 caracteres.");

const filtros = z.object({
  desde: fecha.optional(), hasta: fecha.optional(), tipo: z.enum(["gasto", "ingreso"]).optional(),
  cuenta_id: id.optional(), categoria_id: id.optional(), limite: z.coerce.number().int().min(1).max(1000).optional(),
});
// El front manda o el id de una cuenta/categoría existente o el nombre de una nueva (nunca ambos).
const crear = z.object({
  tipo: z.enum(["gasto", "ingreso"]),
  monto: z.coerce.number().positive("Debe ser mayor a 0.").max(9999999999.99, "Monto demasiado grande.").transform((n) => Math.round(n * 100) / 100),
  descripcion: z.string().trim().min(1, "Obligatoria.").max(30, "Máximo 30 caracteres."),
  fecha,
  cuenta_id: id.optional(), cuenta_nueva: nombre.optional(), categoria_id: id.optional(), categoria_nueva: nombre.optional(),
}).superRefine((d, ctx) => {
  for (const k of ["cuenta", "categoria"])
    if (Boolean(d[`${k}_id`]) === Boolean(d[`${k}_nueva`])) ctx.addIssue({ code: "custom", path: [k], message: `Elegí una ${k === "categoria" ? "categoría" : k} o escribí el nombre de una nueva.` });
});

export const router = Router();
router.use("/transacciones", requiereSesion);

router.get("/transacciones", validar(filtros, "query"), async (req, res) => {
  const q = res.locals.query, params = [req.userId], donde = ["a.id_user = $1"];
  const filtrar = (sql, valor) => { params.push(valor); donde.push(sql.replace("?", `$${params.length}`)); };
  if (q.desde) filtrar("t.date >= ?::date", q.desde);
  if (q.hasta) filtrar("t.date < ?::date + 1", q.hasta);
  if (q.tipo) filtrar("t.type = ?", q.tipo);
  if (q.cuenta_id) filtrar("t.id_account = ?", q.cuenta_id);
  if (q.categoria_id) filtrar("t.id_categorie = ?", q.categoria_id);
  params.push(q.limite ?? 1000);
  const { rows } = await query(
    `SELECT t.id, to_char(t.date, 'YYYY-MM-DD') AS fecha, t.title AS descripcion, t.amount AS monto, t.type AS tipo,
            a.name AS cuenta, c.nombre AS categoria
       FROM transactions t JOIN accounts a ON a.id = t.id_account JOIN categories c ON c.id = t.id_categorie
      WHERE ${donde.join(" AND ")} ORDER BY t.date DESC, t.id DESC LIMIT $${params.length}`, params);
  res.json(rows);
});

// Cuenta o categoría existente (y que sea del usuario) -> id; nueva -> la crea (o reutiliza si ya existía ese nombre).
const TABLAS = {
  cuenta: { existente: "SELECT id FROM accounts WHERE id = $1 AND id_user = $2", nueva: "INSERT INTO accounts (id_user, name, type, balance) VALUES ($1, $2, 'general', 0) ON CONFLICT (id_user, name) DO UPDATE SET name = EXCLUDED.name RETURNING id" },
  categoria: { existente: "SELECT id FROM categories WHERE id = $1 AND id_user = $2", nueva: "INSERT INTO categories (id_user, nombre) VALUES ($1, $2) ON CONFLICT (id_user, nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id" },
};
async function resolver(c, tipo, d, userId) {
  if (d[`${tipo}_nueva`]) return (await c.query(TABLAS[tipo].nueva, [userId, d[`${tipo}_nueva`]])).rows[0].id;
  const { rows: [fila] } = await c.query(TABLAS[tipo].existente, [d[`${tipo}_id`], userId]);
  if (!fila) throw new HttpError(422, "Revisá los datos ingresados.", { [tipo]: "No existe." });
  return fila.id;
}

router.post("/transacciones", validar(crear), async (req, res) => {
  const d = res.locals.body;
  const idNuevo = await transaccion(async (c) => {
    const cuenta = await resolver(c, "cuenta", d, req.userId), categoria = await resolver(c, "categoria", d, req.userId);
    const { rows: [t] } = await c.query(
      "INSERT INTO transactions (id_account, id_categorie, title, type, amount, date) VALUES ($1,$2,$3,$4,$5,$6::date) RETURNING id",
      [cuenta, categoria, d.descripcion, d.tipo, d.monto, d.fecha]);
    await c.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [d.tipo === "ingreso" ? d.monto : -d.monto, cuenta]);
    return t.id;
  });
  res.status(201).json({ id: idNuevo });
});
