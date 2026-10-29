export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

/** Crea elementos sin innerHTML (evita XSS con datos del backend). */
export function h(tag, props = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") el.style.cssText = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...hijos.flat().filter((x) => x != null && x !== false));
  return el;
}

const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const money = (n) => moneda.format(n);
export const montoConSigno = (m, tipo) => `${tipo === "ingreso" ? "+" : "−"} ${money(Math.abs(m))}`;
export const fechaCorta = (iso) => new Date(`${iso}T00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const hoyISO = () => iso(new Date());

/** Rango {desde,hasta} (YYYY-MM-DD) para cada período del selector. */
export function rangoPeriodo(periodo, ref = new Date()) {
  const y = ref.getFullYear(), m = ref.getMonth(), d = ref.getDate();
  const r = {
    dia: [new Date(y, m, d), new Date(y, m, d)],
    semana: [new Date(y, m, d - ((ref.getDay() + 6) % 7)), new Date(y, m, d - ((ref.getDay() + 6) % 7) + 6)],
    mes: [new Date(y, m, 1), new Date(y, m + 1, 0)],
    trimestre: [new Date(y, Math.floor(m / 3) * 3, 1), new Date(y, Math.floor(m / 3) * 3 + 3, 0)],
    anio: [new Date(y, 0, 1), new Date(y, 11, 31)],
  }[periodo];
  return { desde: iso(r[0]), hasta: iso(r[1]) };
}

/** Maneja submit: evita doble envío, muestra errores del backend en el [role=alert] del form. */
export function manejarForm(form, accion) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const boton = $("[type=submit]", form), alerta = $("[role=alert]", form);
    alerta.hidden = true; boton.disabled = true;
    try {
      await accion(Object.fromEntries(new FormData(form)), form);
    } catch (err) {
      alerta.textContent = err instanceof TypeError ? "No pudimos conectar con el servidor." : err.message;
      alerta.hidden = false;
    } finally { boton.disabled = false; }
  });
}

export const avisarCambios = () => document.dispatchEvent(new CustomEvent("finan:datos-cambiaron"));
