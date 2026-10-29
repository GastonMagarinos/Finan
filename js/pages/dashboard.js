import { api } from "../api.js";
import { $, money, rangoPeriodo } from "../utils.js";
import { iniciarShell } from "../shell.js";
import { iniciarPeriodo } from "../components/periodo.js";
import { sparkline, gastosPorCategoria } from "../components/charts.js";
import { renderCuentas, renderPresupuestos, renderMovimientos } from "../components/listas.js";

await iniciarShell("index.html");
let periodo = "mes";

async function cargar() {
  const rango = rangoPeriodo(periodo), error = $("[data-error]");
  try {
    const [r, cuentas, presupuestos, movs] = await Promise.all([
      api.resumen(rango), api.cuentas.listar(), api.presupuestos.listar(rango), api.transacciones.listar({ ...rango, limite: 4 })]);
    $("[data-patrimonio]").textContent = money(r.patrimonio);
    const v = $("[data-variacion]");
    v.textContent = `${r.variacion >= 0 ? "▲" : "▼"} ${Math.abs(r.variacion).toLocaleString("es-AR")}% en el período`;
    v.className = r.variacion >= 0 ? "pos" : "neg";
    $("[data-ingresos]").textContent = money(r.ingresos);
    $("[data-gastos]").textContent = money(r.gastos);
    if (r.evolucion?.length) sparkline($("[data-spark]"), r.evolucion);
    gastosPorCategoria($("[data-gastos-categoria]"), r.por_categoria);
    renderCuentas($("[data-cuentas]"), cuentas);
    renderPresupuestos($("[data-presupuestos]"), presupuestos);
    renderMovimientos($("[data-movimientos]"), movs);
    error.hidden = true;
  } catch { error.textContent = "No pudimos cargar tus datos. Reintentá en unos segundos."; error.hidden = false; }
}

iniciarPeriodo($("[data-periodos]"), (p) => { periodo = p; cargar(); });
document.addEventListener("finan:datos-cambiaron", cargar);
