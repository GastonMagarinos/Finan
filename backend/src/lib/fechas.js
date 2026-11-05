// Funciones puras (sin dependencias) para fechas YYYY-MM-DD y la serie de evolución.
const DIA = 864e5;
const aMs = (iso) => Date.parse(`${iso}T00:00:00Z`);
const aISO = (ms) => new Date(ms).toISOString().slice(0, 10);
export const hoyISO = () => aISO(Date.now());
export const esFechaReal = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(aMs(v)) && aISO(aMs(v)) === v; // NaN primero: toISOString() lanza con fechas inválidas

export function mesActual(hoy = hoyISO()) {
  const [y, m] = hoy.split("-").map(Number);
  return { desde: `${y}-${String(m).padStart(2, "0")}-01`, hasta: aISO(Date.UTC(y, m, 0)) };
}

/**
 * Patrimonio al cierre del día anterior a `desde` y luego `puntos - 1` cierres parejos hasta `hasta` (sin pasar de hoy).
 * `netos` = { "YYYY-MM-DD": ingresos - gastos de ese día }. Se calcula hacia atrás desde el patrimonio actual.
 */
export function evolucion(patrimonio, netos, desde, hasta, hoy = hoyISO(), puntos = 8) {
  const ini = aMs(desde), fin = Math.max(Math.min(aMs(hasta), aMs(hoy)), ini);
  const cierre = (ms) => Object.entries(netos).reduce((v, [d, n]) => (aMs(d) > ms ? v - n : v), patrimonio);
  const serie = [cierre(ini - DIA)];
  for (let i = 1; i < puntos; i++) serie.push(cierre(Math.round((ini + ((fin - ini) * i) / (puntos - 1)) / DIA) * DIA));
  return serie.map((v) => Math.round(v * 100) / 100);
}
export const variacion = (serie) => (serie[0] ? Math.round(((serie.at(-1) - serie[0]) / Math.abs(serie[0])) * 1000) / 10 : 0);
