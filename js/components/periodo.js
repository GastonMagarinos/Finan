import { h, $$ } from "../utils.js";
const PERIODOS = [["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"], ["trimestre", "Trimestre"], ["anio", "Año"]];

/** Rellena el selector de período y avisa el cambio (también una vez al inicio). */
export function iniciarPeriodo(grupo, alCambiar, inicial = "mes") {
  grupo.replaceChildren(...PERIODOS.map(([v, t]) => h("button", { type: "button", "data-periodo": v, "aria-pressed": String(v === inicial) }, t)));
  grupo.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $$("button", grupo).forEach((x) => x.setAttribute("aria-pressed", x === b));
    alCambiar(b.dataset.periodo);
  });
  alCambiar(inicial);
}
