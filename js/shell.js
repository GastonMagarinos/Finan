import { api } from "./api.js";
import { $$ } from "./utils.js";
import "./theme.js";

const CLAVE = "finan:usuario"; // caché en sessionStorage: el nombre/avatar aparecen al instante al cambiar de página
const leer = () => { try { return JSON.parse(sessionStorage.getItem(CLAVE)); } catch { return null; } };
const pintar = (u) => {
  $$("[data-usuario-nombre]").forEach((el) => (el.textContent = u.nombre));
  $$("[data-avatar-inicial]").forEach((el) => (el.textContent = u.nombre.charAt(0).toUpperCase() || "?"));
};

/** La navegación ya viene en el HTML; acá solo se completan los datos del usuario y el botón "Nuevo movimiento". */
export async function iniciarShell() {
  const cache = leer();
  if (cache) pintar(cache);

  let dialogo; // se carga recién al primer uso
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("[data-abrir-movimiento]")) return;
    dialogo ??= await import("./components/movimiento-dialog.js");
    dialogo.abrirDialogoMovimiento();
  });

  const usuario = await api.auth.yo().catch(() => null);
  if (!usuario) return cache ?? { nombre: "", apellido: "", username: "", email: "" };
  sessionStorage.setItem(CLAVE, JSON.stringify(usuario));
  pintar(usuario);
  return usuario;
}
