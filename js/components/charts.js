import { h, money } from "../utils.js";
const NS = "http://www.w3.org/2000/svg";
const svg = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
export const colorDe = (i) => `var(--cat-${(i % 6) + 1})`;

export function sparkline(el, valores) {
  const w = 300, alto = 80, min = Math.min(...valores), rango = Math.max(...valores) - min || 1;
  const puntos = valores.map((v, i) => `${(i / Math.max(valores.length - 1, 1)) * w},${alto - 4 - ((v - min) / rango) * (alto - 8)}`).join(" ");
  el.setAttribute("viewBox", `0 0 ${w} ${alto}`);
  el.replaceChildren(svg("polygon", { points: `0,${alto} ${puntos} ${w},${alto}`, class: "spark__area" }), svg("polyline", { points: puntos, class: "spark__line" }));
}

/** Torta (móvil/tablet) + barras (escritorio) sobre la misma leyenda; el CSS elige cuál mostrar. */
export function gastosPorCategoria(raiz, datos) {
  const total = datos.reduce((s, d) => s + d.total, 0);
  if (!total) return raiz.replaceChildren(h("p", { class: "muted" }, "Todavía no hay gastos en este período."));
  const orden = [...datos].sort((a, b) => b.total - a.total);
  const torta = svg("svg", { class: "chart__pie", viewBox: "0 0 100 100", role: "img", "aria-label": "Gastos por categoría" });
  let ang = -Math.PI / 2;
  orden.forEach((d, i) => {
    const frac = d.total / total, fin = ang + frac * 2 * Math.PI;
    const p = (a) => `${50 + 50 * Math.cos(a)} ${50 + 50 * Math.sin(a)}`;
    const forma = frac > 0.999 ? svg("circle", { cx: 50, cy: 50, r: 50 })
      : svg("path", { d: `M50 50L${p(ang)}A50 50 0 ${frac > 0.5 ? 1 : 0} 1 ${p(fin)}Z` });
    forma.setAttribute("fill", colorDe(i)); forma.setAttribute("stroke", "var(--surface)"); forma.setAttribute("stroke-width", 1);
    torta.append(forma); ang = fin;
  });
  const leyenda = h("ul", { class: "chart__legend" }, orden.map((d, i) => {
    const pct = (d.total / total) * 100;
    return h("li", { class: "chart__item", style: `--c:${colorDe(i)};--v:${(d.total / orden[0].total) * 100}%` },
      h("span", { class: "chart__dot" }), h("span", {}, d.categoria),
      h("span", { class: "muted num" }, `${pct.toFixed(1).replace(".", ",")}%`), h("span", { class: "num" }, money(d.total)),
      h("span", { class: "chart__bar" }, h("i")));
  }));
  raiz.replaceChildren(h("div", { class: "chart" }, torta, leyenda));
}
