import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { HttpError } from "../errors.js";
import { validar } from "../validate.js";
import { requiereSesion } from "../auth.js";
import { mesActual } from "../lib/fechas.js";
import { fecha } from "./transacciones.js";

const rango = z.object({ desde: fecha.optional(), hasta: fecha.optional() });
const crear = z.object({
  categoria_id: z.coerce.number().int().positive(),
  limite: z.coerce.number().positive("Debe ser mayor a 0.").max(9999999999.99).transform((n) => Math.round(n * 100) / 100),
});

export const router = Router();
router.use("/presupuestos", requiereSesion);

router.get("/presupuestos", validar(rango, "query"), async (req, res) => {
  const { desde, hasta } = { ...mesActual(), ...res.locals.query };
  const { rows } = await query(
    `SELECT c.id AS id, c.id AS categoria_id, c.nombre AS categoria, b."limit" AS limite,
            COALESCE((SELECT SUM(t.amount) FROM transactions t JOIN accounts a ON a.id = t.id_account
                       WHERE t.id_categorie = c.id AND a.id_user = $1 AND t.type = 'gasto'
                         AND t.date >= $2::date AND t.date < $3::date + 1), 0) AS gastado
       FROM budget b JOIN categories c ON c.id = b.id_categorie
      WHERE c.id_user = $1 ORDER BY c.nombre`, [req.userId, desde, hasta]);
  res.json(rows);
});

// Crea o actualiza el límite de una categoría (un presupuesto por categoría).
router.post("/presupuestos", validar(crear), async (req, res) => {
  const { categoria_id, limite } = res.locals.body;
  const { rowCount } = await query(
    `INSERT INTO budget (id_categorie, "limit") SELECT id, $3::numeric FROM categories WHERE id = $1 AND id_user = $2
     ON CONFLICT (id_categorie) DO UPDATE SET "limit" = EXCLUDED."limit"`, [categoria_id, req.userId, limite]);
  if (!rowCount) throw new HttpError(422, "Revisá los datos ingresados.", { categoria_id: "La categoría no existe." });
  res.status(201).json({});
});
