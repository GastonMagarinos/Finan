import { api } from "../api.js";
import { $, h, money, rangoPeriodo, fechaCorta } from "../utils.js";
import { iniciarShell } from "../shell.js";
import { iniciarPeriodo } from "../components/periodo.js";
import { renderMovimientos } from "../components/listas.js";

await iniciarShell("transacciones.html");
const filtros = $("[data-filtros]");
let periodo = "mes";

async function cargarOpciones() {
  const [cuentas, categorias] = await Promise.all([api.cuentas.listar(), api.categorias.listar()]);
  const opciones = (sel, items) => sel.append(...items.map((i) => h("option", { value: i.id }, i.nombre)));
  opciones(filtros.elements.cuenta_id, cuentas);
  opciones(filtros.elements.categoria_id, categorias);
}

async function cargar() {
  const f = Object.fromEntries(new FormData(filtros));
  try {
    const lista = await api.transacciones.listar({ ...rangoPeriodo(periodo), tipo: f.tipo, cuenta_id: f.cuenta_id, categoria_id: f.categoria_id });
    const suma = (t) => lista.filter((x) => x.tipo === t).reduce((s, x) => s + x.monto, 0);
    $("[data-ingresos]").textContent = money(suma("ingreso"));
    $("[data-gastos]").textContent = money(suma("gasto"));
    $("[data-balance]").textContent = money(suma("ingreso") - suma("gasto"));
    const contenedor = $("[data-grupos]");
    const porFecha = Map.groupBy(lista, (t) => t.fecha);
    contenedor.replaceChildren(...(lista.length ? [...porFecha].flatMap(([fecha, items]) => {
      const ul = h("ul", { class: "list" });
      renderMovimientos(ul, items);
      return [h("h3", { class: "group-title" }, fechaCorta(fecha)), ul];
    }) : [h("p", { class: "muted" }, "No hay movimientos con estos filtros.")]));
    $("[data-error]").hidden = true;
  } catch { const e = $("[data-error]"); e.textContent = "No pudimos cargar los movimientos."; e.hidden = false; }
}

filtros.addEventListener("change", cargar);
document.addEventListener("finan:datos-cambiaron", cargar);
await cargarOpciones().catch(() => {});
iniciarPeriodo($("[data-periodos]"), (p) => { periodo = p; cargar(); });
