/** Formato de error que espera el front (js/api.js): { mensaje, errores?: { campo: texto } } */
export class HttpError extends Error {
  constructor(status, mensaje, errores) { super(mensaje); this.status = status; this.errores = errores; }
}

const UNICOS = {
  users_username_key: { username: "Ese usuario ya está en uso." },
  users_email_key: { email: "Ese correo ya está registrado." },
};
/** Traduce una violación de UNIQUE de Postgres a un 409 legible; deja pasar cualquier otro error. */
export const traducirUnico = (err) =>
  err.code === "23505" && UNICOS[err.constraint] ? new HttpError(409, "Revisá los datos ingresados.", UNICOS[err.constraint]) : err;

export const noEncontrado = (_req, res) => res.status(404).json({ mensaje: "Ruta no encontrada." });

// eslint-disable-next-line no-unused-vars
export function manejarErrores(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ mensaje: err.message, errores: err.errores });
  if (err.type === "entity.parse.failed") return res.status(400).json({ mensaje: "El cuerpo no es un JSON válido." });
  console.error(err);
  res.status(500).json({ mensaje: "Error interno del servidor." });
}
