import { HttpError } from "./errors.js";

/** Valida body/query con zod. El resultado limpio queda en res.locals.body / res.locals.query. */
export const validar = (schema, fuente = "body") => (req, res, next) => {
  const r = schema.safeParse(req[fuente]);
  if (!r.success) {
    const errores = {};
    for (const i of r.error.issues) errores[i.path.join(".") || "_"] ??= i.message;
    throw new HttpError(422, "Revisá los datos ingresados.", errores);
  }
  res.locals[fuente] = r.data;
  next();
};
