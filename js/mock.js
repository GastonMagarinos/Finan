// Datos de ejemplo en memoria para ver el front sin backend (config.js -> USE_MOCK). No se carga en producción.
const hoy = new Date(), Y = hoy.getFullYear(), M = hoy.getMonth(), D = hoy.getDate();
const f = (atras) => `${Y}-${String(M + 1).padStart(2, "0")}-${String(Math.max(1, D - atras)).padStart(2, "0")}`;
let sig = 100;
const db = {
  usuario: { id: 1, nombre: "Lucía", apellido: "Fernández", username: "lucia.f", email: "lucia.fernandez@correo.com" },
  cuentas: [{ id: 1, nombre: "Efectivo", saldo: 120000 }, { id: 2, nombre: "Mercado Pago", saldo: 640350 }, { id: 3, nombre: "Banco", saldo: 1720000 }],
  categorias: ["Vivienda", "Alimentos", "Salud", "Transporte", "Streaming", "Otros", "Sueldo"].map((nombre, i) => ({ id: i + 1, nombre })),
  presupuestos: [[1, 260000], [2, 300000], [3, 100000], [4, 150000], [5, 15000]].map(([categoria_id, limite], i) => ({ id: i + 1, categoria_id, limite })),
  transacciones: [
    [0, "Supermercado", 48200, "gasto", 2, 2], [0, "Café", 4500, "gasto", 1, 6], [1, "Sueldo", 1250000, "ingreso", 3, 7], [1, "Alquiler", 240000, "gasto", 3, 1],
    [4, "Netflix", 9800, "gasto", 1, 5], [6, "Farmacia", 18400, "gasto", 1, 3], [6, "SUBE", 6000, "gasto", 2, 4], [8, "Verdulería", 167800, "gasto", 2, 2],
    [10, "Médico", 53000, "gasto", 2, 3], [12, "Nafta", 51000, "gasto", 3, 4], [14, "Compras varias", 85500, "gasto", 3, 6],
  ].map(([atras, descripcion, monto, tipo, cuenta_id, categoria_id], i) => ({ id: i + 1, fecha: f(atras), descripcion, monto, tipo, cuenta_id, categoria_id })),
};
const nombre = (lista, id) => lista.find((x) => String(x.id) === String(id))?.nombre;
const vista = (t) => ({ ...t, cuenta: nombre(db.cuentas, t.cuenta_id), categoria: nombre(db.categorias, t.categoria_id) });
const enRango = (t, p) => (!p.desde || t.fecha >= p.desde) && (!p.hasta || t.fecha <= p.hasta);
const total = (lista) => lista.reduce((s, t) => s + t.monto, 0);
const obtener = (lista, nuevo) => { // busca por id o crea (cuenta_nueva / categoria_nueva)
  const x = { id: ++sig, nombre: nuevo, ...(lista === db.cuentas && { saldo: 0 }) }; lista.push(x); return x.id;
};

const rutas = {
  "GET /auth/yo": () => db.usuario,
  "POST /auth/login": () => ({}), "POST /auth/registro": (_, b) => Object.assign(db.usuario, b) && {}, "POST /auth/logout": () => null,
  "GET /resumen": (p) => {
    const g = db.transacciones.filter((t) => t.tipo === "gasto" && enRango(t, p)), porCat = Map.groupBy(g, (t) => t.categoria_id);
    return {
      patrimonio: total(db.cuentas.map((c) => ({ monto: c.saldo }))), variacion: 4.2,
      ingresos: total(db.transacciones.filter((t) => t.tipo === "ingreso" && enRango(t, p))), gastos: total(g),
      evolucion: [2100000, 2050000, 2180000, 2250000, 2230000, 2340000, 2400000, 2480350],
      por_categoria: [...porCat].map(([id, ts]) => ({ categoria: nombre(db.categorias, id), total: total(ts) })),
    };
  },
  "GET /cuentas": () => db.cuentas, "GET /categorias": () => db.categorias,
  "GET /presupuestos": (p) => db.presupuestos.map((b) => ({ ...b, categoria: nombre(db.categorias, b.categoria_id),
    gastado: total(db.transacciones.filter((t) => t.tipo === "gasto" && String(t.categoria_id) === String(b.categoria_id) && enRango(t, p))) })),
  "POST /presupuestos": (_, b) => { db.presupuestos.push({ id: ++sig, categoria_id: b.categoria_id, limite: b.limite }); return {}; },
  "GET /transacciones": (p) => db.transacciones
    .filter((t) => enRango(t, p) && (!p.tipo || t.tipo === p.tipo) && (!p.cuenta_id || String(t.cuenta_id) === p.cuenta_id) && (!p.categoria_id || String(t.categoria_id) === p.categoria_id))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id).slice(0, Number(p.limite) || Infinity).map(vista),
  "POST /transacciones": (_, b) => {
    const cuenta_id = b.cuenta_nueva ? obtener(db.cuentas, b.cuenta_nueva) : b.cuenta_id;
    const categoria_id = b.categoria_nueva ? obtener(db.categorias, b.categoria_nueva) : b.categoria_id;
    const cuenta = db.cuentas.find((c) => String(c.id) === String(cuenta_id));
    cuenta.saldo += b.tipo === "ingreso" ? b.monto : -b.monto;
    db.transacciones.push({ id: ++sig, fecha: b.fecha, descripcion: b.descripcion, monto: b.monto, tipo: b.tipo, cuenta_id, categoria_id });
    return {};
  },
  "PUT /perfil": (_, b) => Object.assign(db.usuario, b), "PUT /perfil/password": () => ({}), "DELETE /perfil": () => null,
};

export async function mockRequest(method, ruta, { params = {}, body } = {}) {
  await new Promise((r) => setTimeout(r, 120));
  return structuredClone(rutas[`${method} ${ruta}`]?.(params, body) ?? null);
}
