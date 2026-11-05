import { Router } from "express";
import { query } from "../db.js";
import { requiereSesion } from "../auth.js";

export const router = Router();
router.get("/cuentas", requiereSesion, async (req, res) =>
  res.json((await query("SELECT id, name AS nombre, balance AS saldo FROM accounts WHERE id_user = $1 ORDER BY id", [req.userId])).rows));
router.get("/categorias", requiereSesion, async (req, res) =>
  res.json((await query("SELECT id, nombre FROM categories WHERE id_user = $1 ORDER BY nombre", [req.userId])).rows));
