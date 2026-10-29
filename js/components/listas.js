import { h, money, montoConSigno, fechaCorta } from "../utils.js";
import { colorDe } from "./charts.js";

const vacio = (ul, texto) => ul.replaceChildren(h("li", { class: "muted" }, texto));
const colorCategoria = (nombre = "") => colorDe([...nombre].reduce((a, c) => a + c.charCodeAt(0), 0));

export function renderCuentas(ul, cuentas) {
  if (!cuentas.length) return vacio(ul, "Aún no tenés cuentas. Se crean al cargar un movimiento.");
  const total = cuentas.reduce((s, c) => s + c.saldo, 0) || 1;
  ul.replaceChildren(...cuentas.map((c) => h("li", { class: "row row--cuenta" },
    h("span", { class: "row__nombre" }, c.nombre),
    h("span", { class: "row__monto num" }, money(c.saldo)),
    h("span", { class: "row__sub" }, `${Math.round((c.saldo / total) * 100)}% del patrimonio`),
    h("div", { class: "progress", style: `--v:${(c.saldo / total) * 100}%` }, h("i")))));
}

export function renderPresupuestos(ul, lista) {
  if (!lista.length) return vacio(ul, "Todavía no armaste presupuestos.");
  ul.replaceChildren(...lista.map((p) => {
    const pct = Math.round((p.gastado / p.limite) * 100);
    return h("li", { class: "row" }, h("div", { class: "row__main" },
      h("span", { class: "row__nombre" }, p.categoria),
      h("span", { class: "row__monto num", ...(pct >= 90 && { class: "row__monto num neg" }) }, `${pct}%`),
      h("span", { class: "row__sub num" }, `${money(p.gastado)} de ${money(p.limite)} · quedan ${money(Math.max(p.limite - p.gastado, 0))}`),
      h("div", { class: "progress", style: `--v:${Math.min(pct, 100)}%;--c:${colorCategoria(p.categoria)}`, ...(pct >= 90 && { "data-alerta": "" }), role: "progressbar", "aria-valuenow": pct, "aria-valuemin": 0, "aria-valuemax": 100, "aria-label": `Presupuesto de ${p.categoria}` }, h("i"))));
  }));
}

export function renderMovimientos(ul, lista, { fechas = false } = {}) {
  if (!lista.length) return vacio(ul, "No hay movimientos en este período.");
  ul.replaceChildren(...lista.map((t) => h("li", { class: "row" },
    h("span", { class: "avatar avatar--cat", style: `--c:${colorCategoria(t.categoria)}`, "aria-hidden": "true" }, t.descripcion.charAt(0).toUpperCase()),
    h("div", { class: "row__main" },
      h("span", { class: "row__nombre" }, t.descripcion),
      h("span", { class: `row__monto num ${t.tipo === "ingreso" ? "pos" : ""}` }, montoConSigno(t.monto, t.tipo)),
      h("span", { class: "row__sub" }, [t.categoria, t.cuenta, fechas && fechaCorta(t.fecha)].filter(Boolean).join(" · "))))));
}
