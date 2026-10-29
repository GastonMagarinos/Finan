import { api } from "../api.js";
import { h, $, manejarForm, hoyISO, avisarCambios } from "../utils.js";

let dialogo, form;
const chip = (name, valor, texto, checked = false) =>
  h("label", { class: "chip" }, h("input", { type: "radio", name, value: valor, required: true, checked }), h("span", {}, texto));
const grupo = (name, leyenda, items, ayuda) =>
  h("fieldset", { class: "field" }, h("legend", {}, leyenda),
    h("div", { class: "chips" }, items.map((i) => chip(name, i.id, i.nombre)), chip(name, "__nueva", "+ Nueva")),
    h("input", { name: `${name}_nueva`, placeholder: ayuda, "aria-label": ayuda, maxlength: 60, hidden: true }));

function construir() {
  form = h("form", { class: "form", method: "dialog" },
    h("div", { class: "dialog__head" }, h("h2", { id: "dlg-titulo" }, "Nuevo movimiento"),
      h("button", { class: "btn btn--icon", type: "button", "aria-label": "Cerrar", onclick: () => dialogo.close() }, "✕")),
    h("fieldset", { class: "field" }, h("legend", { class: "visually-hidden" }, "Tipo"),
      h("div", { class: "chips" }, chip("tipo", "gasto", "Gasto", true), chip("tipo", "ingreso", "Ingreso"))),
    h("label", { class: "field field--monto" }, "Monto", h("input", { name: "monto", type: "number", min: "0.01", step: "0.01", inputmode: "decimal", required: true })),
    h("label", { class: "field" }, "Descripción", h("input", { name: "descripcion", required: true, maxlength: 80 })),
    h("label", { class: "field" }, "Fecha", h("input", { name: "fecha", type: "date", required: true })),
    h("div", { "data-cuentas": "" }), h("div", { "data-categorias": "" }),
    h("p", { class: "form-error", role: "alert", hidden: true }),
    h("div", { class: "dialog__actions" },
      h("button", { class: "btn", type: "button", onclick: () => dialogo.close() }, "Cancelar"),
      h("button", { class: "btn btn--primary", type: "submit" }, "Guardar movimiento")));
  dialogo = h("dialog", { "aria-labelledby": "dlg-titulo" }, form);
  document.body.append(dialogo);

  // Al elegir "+ Nueva" se muestra el campo para escribir el nombre.
  form.addEventListener("change", (e) => {
    const nueva = form.elements[`${e.target.name}_nueva`];
    if (e.target.type !== "radio" || !nueva) return;
    nueva.hidden = e.target.value !== "__nueva";
    nueva.required = !nueva.hidden;
    if (!nueva.hidden) nueva.focus();
  });
  const ref = (d, k) => (d[k] === "__nueva" ? { [`${k}_nueva`]: d[`${k}_nueva`].trim() } : { [`${k}_id`]: d[k] });
  manejarForm(form, async (d) => {
    await api.transacciones.crear({ tipo: d.tipo, monto: Number(d.monto), descripcion: d.descripcion.trim(), fecha: d.fecha, ...ref(d, "cuenta"), ...ref(d, "categoria") });
    dialogo.close();
    avisarCambios();
  });
}

export async function abrirDialogoMovimiento() {
  if (!dialogo) construir();
  const alerta = $("[role=alert]", form);
  try {
    const [cuentas, categorias] = await Promise.all([api.cuentas.listar(), api.categorias.listar()]);
    form.reset();
    form.elements.fecha.value = hoyISO();
    $("[data-cuentas]", form).replaceChildren(grupo("cuenta", "Cuenta", cuentas, "Nombre de la nueva cuenta"));
    $("[data-categorias]", form).replaceChildren(grupo("categoria", "Categoría", categorias, "Nombre de la nueva categoría"));
    alerta.hidden = true;
  } catch { alerta.textContent = "No pudimos cargar tus cuentas y categorías."; alerta.hidden = false; }
  dialogo.showModal();
}
