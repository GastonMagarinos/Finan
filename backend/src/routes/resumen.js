import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { validar } from "../validate.js";
import { requiereSesion } from "../auth.js";
import { evolucion, mesActual, variacion } from "../lib/fechas.js";
import { fecha } from "./transacciones.js";

export const router = Router();

router.get("/resumen", requiereSesion, validar(z.object({ desde: fecha.optional(), hasta: fecha.optional() }), "query"), async (req, res) => {
  const { desde, hasta } = { ...mesActual(), ...res.locals.query }, uid = req.userId;
  const [patrimonio, porCategoria, netos] = await Promise.all([
    query("SELECT COALESCE(SUM(balance), 0) AS v FROM accounts WHERE id_user = $1", [uid]),
    query(`SELECT c.nombre AS categoria, t.type AS tipo, SUM(t.amount) AS total
             FROM transactions t JOIN accounts a ON a.id = t.id_account JOIN categories c ON c.id = t.id_categorie
            WHERE a.id_user = $1 AND t.date >= $2::date AND t.date < $3::date + 1 GROUP BY c.nombre, t.type`, [uid, desde, hasta]),
    query(`SELECT to_char(t.date, 'YYYY-MM-DD') AS dia, SUM(CASE WHEN t.type = 'ingreso' THEN t.amount ELSE -t.amount END) AS neto
             FROM transactions t JOIN accounts a ON a.id = t.id_account
            WHERE a.id_user = $1 AND t.date >= $2::date GROUP BY 1`, [uid, desde]),
  ]);
  const total = (tipo) => porCategoria.rows.filter((r) => r.tipo === tipo).reduce((s, r) => s + r.total, 0);
  const serie = evolucion(patrimonio.rows[0].v, Object.fromEntries(netos.rows.map((r) => [r.dia, r.neto])), desde, hasta);
  res.json({
    patrimonio: patrimonio.rows[0].v, variacion: variacion(serie), ingresos: total("ingreso"), gastos: total("gasto"), evolucion: serie,
    por_categoria: porCategoria.rows.filter((r) => r.tipo === "gasto").map(({ categoria, total: t }) => ({ categoria, total: t })),
  });
});
