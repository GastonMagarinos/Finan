import { api } from "../api.js";
import { $, h, money, rangoPeriodo, manejarForm, avisarCambios } from "../utils.js";
import { iniciarShell } from "../shell.js";
import { renderPresupuestos } from "../components/listas.js";

await iniciarShell("presupuestos.html");
const dialogo = $("[data-dialogo-presupuesto]"), form = $("form", dialogo);

async function cargar() {
  try {
    const lista = await api.presupuestos.listar(rangoPeriodo("mes"));
    const suma = (k) => lista.reduce((s, p) => s + p[k], 0);
    $("[data-presupuestado]").textContent = money(suma("limite"));
    $("[data-gastado]").textContent = money(suma("gastado"));
    $("[data-disponible]").textContent = money(Math.max(suma("limite") - suma("gastado"), 0));
    renderPresupuestos($("[data-lista]"), lista);
  } catch { const e = $("[data-error]"); e.textContent = "No pudimos cargar tus presupuestos."; e.hidden = false; }
}

$("[data-abrir-presupuesto]").addEventListener("click", async () => {
  const categorias = await api.categorias.listar();
  $("select", form).replaceChildren(...categorias.map((c) => h("option", { value: c.id }, c.nombre)));
  form.reset(); $("[role=alert]", form).hidden = true;
  dialogo.showModal();
});
$("[data-cerrar]", dialogo).addEventListener("click", () => dialogo.close());
manejarForm(form, async (d) => {
  await api.presupuestos.crear({ categoria_id: d.categoria, limite: Number(d.limite) });
  dialogo.close(); cargar(); avisarCambios();
});
cargar();
document.addEventListener("finan:datos-cambiaron", cargar);
