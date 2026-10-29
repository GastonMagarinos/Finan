import { api } from "../api.js";
import { $, money } from "../utils.js";
import { iniciarShell } from "../shell.js";
import { renderCuentas, renderMovimientos } from "../components/listas.js";

await iniciarShell("cuentas.html");
async function cargar() {
  try {
    const [cuentas, movs] = await Promise.all([api.cuentas.listar(), api.transacciones.listar({ limite: 6 })]);
    $("[data-total]").textContent = money(cuentas.reduce((s, c) => s + c.saldo, 0));
    renderCuentas($("[data-cuentas]"), cuentas);
    renderMovimientos($("[data-movimientos]"), movs, { fechas: true });
  } catch { const e = $("[data-error]"); e.textContent = "No pudimos cargar tus cuentas."; e.hidden = false; }
}
cargar();
document.addEventListener("finan:datos-cambiaron", cargar);
