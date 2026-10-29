const CLAVE = "finan:tema";
const oscuro = matchMedia("(prefers-color-scheme: dark)");
export const getTema = () => localStorage.getItem(CLAVE) ?? "system";
export function aplicarTema(tema = getTema()) {
  const dark = tema === "dark" || (tema === "system" && oscuro.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}
export function setTema(tema) { localStorage.setItem(CLAVE, tema); aplicarTema(tema); }
oscuro.addEventListener("change", () => getTema() === "system" && aplicarTema());
aplicarTema();
