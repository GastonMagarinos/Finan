/**
 * Capa de acceso al backend (Express + PostgreSQL). Autenticación por cookie httpOnly.
 * Contrato esperado (JSON, nombres en español, errores: { mensaje, errores?: {campo: texto} }):
 *  POST /auth/login {identificador,password} · POST /auth/registro {nombre,apellido,username,email,password}
 *  POST /auth/logout · GET /auth/yo -> {id,nombre,apellido,username,email}
 *  GET /resumen?desde&hasta -> {patrimonio,variacion,ingresos,gastos,evolucion:[n],por_categoria:[{categoria,total}]}
 *  GET /cuentas -> [{id,nombre,saldo}] · GET /categorias -> [{id,nombre}]
 *  GET /presupuestos?desde&hasta -> [{id,categoria_id,categoria,limite,gastado}] · POST /presupuestos {categoria_id,limite}
 *  GET /transacciones?desde&hasta&tipo&cuenta_id&categoria_id&limite -> [{id,fecha,descripcion,monto,tipo,cuenta,categoria}]
 *  POST /transacciones {tipo,monto,descripcion,fecha,(cuenta_id|cuenta_nueva),(categoria_id|categoria_nueva)}
 *  PUT /perfil {nombre,apellido,username,email} · PUT /perfil/password {actual,nueva} · DELETE /perfil
 */
import { API_BASE, USE_MOCK } from "./config.js";

export class ApiError extends Error {
  constructor(status, message, detalles) { super(message); this.status = status; this.detalles = detalles; }
}

async function request(ruta, { method = "GET", body, params } = {}) {
  if (USE_MOCK) return (await import("./mock.js")).mockRequest(method, ruta, { params, body });
  const url = new URL(API_BASE + ruta);
  for (const [k, v] of Object.entries(params ?? {})) if (v != null && v !== "") url.searchParams.set(k, v);
  const res = await fetch(url, {
    method, credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !location.pathname.endsWith("acceso.html")) {
    sessionStorage.removeItem("finan:usuario");
    location.href = "acceso.html";
    return new Promise(() => {}); // la página se está yendo
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.mensaje ?? "Ocurrió un error inesperado.", data?.errores);
  return data;
}

// Al cambiar la sesión o el perfil se descarta el usuario cacheado por el shell.
const olvidar = (p) => p.then((r) => (sessionStorage.removeItem("finan:usuario"), r));

export const api = {
  auth: {
    login: (b) => request("/auth/login", { method: "POST", body: b }),
    registro: (b) => request("/auth/registro", { method: "POST", body: b }),
    logout: () => olvidar(request("/auth/logout", { method: "POST" })),
    yo: () => request("/auth/yo"),
  },
  resumen: (p) => request("/resumen", { params: p }),
  cuentas: { listar: () => request("/cuentas") },
  categorias: { listar: () => request("/categorias") },
  presupuestos: {
    listar: (p) => request("/presupuestos", { params: p }),
    crear: (b) => request("/presupuestos", { method: "POST", body: b }),
  },
  transacciones: {
    listar: (p) => request("/transacciones", { params: p }),
    crear: (b) => request("/transacciones", { method: "POST", body: b }),
  },
  perfil: {
    actualizar: (b) => olvidar(request("/perfil", { method: "PUT", body: b })),
    cambiarPassword: (b) => request("/perfil/password", { method: "PUT", body: b }),
    eliminar: () => olvidar(request("/perfil", { method: "DELETE" })),
  },
};
