import { api } from "../api.js";
import { $, $$, manejarForm } from "../utils.js";
import "../theme.js";

const pestanas = $$("[role=tab]"), paneles = $$("[role=tabpanel]");
function mostrar(id) {
  pestanas.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.panel === id)));
  paneles.forEach((p) => (p.hidden = p.id !== id));
}
pestanas.forEach((t) => t.addEventListener("click", () => mostrar(t.dataset.panel)));
$$("[data-ir]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); mostrar(a.dataset.ir); }));
mostrar(location.hash === "#registro" ? "registro" : "ingreso");

const entrar = () => (location.href = "index.html");
manejarForm($("[data-form-login]"), async (d) => { await api.auth.login({ identificador: d.identificador, password: d.password }); entrar(); });
manejarForm($("[data-form-registro]"), async (d) => {
  if (d.password !== d.repetir) throw new Error("Las contraseñas no coinciden.");
  const { repetir, terminos, ...datos } = d;
  await api.auth.registro(datos); entrar();
});
