import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { HttpError } from "./errors.js";

const { name, maxAge, ...opcionesBase } = config.cookie;
export const iniciarSesion = (res, idUsuario) =>
  res.cookie(name, jwt.sign({ sub: String(idUsuario) }, config.jwtSecret, { algorithm: "HS256", expiresIn: "7d" }), { ...opcionesBase, maxAge });
export const cerrarSesion = (res) => res.clearCookie(name, opcionesBase);

/** Middleware: exige la cookie de sesión y deja el id en req.userId. */
export function requiereSesion(req, _res, next) {
  const token = req.cookies?.[name];
  if (!token) throw new HttpError(401, "Sesión no iniciada.");
  try { req.userId = Number(jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] }).sub); }
  catch { throw new HttpError(401, "La sesión venció."); }
  next();
}
