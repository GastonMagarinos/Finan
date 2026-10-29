import { api } from "../api.js";
import { $, manejarForm } from "../utils.js";
import { iniciarShell } from "../shell.js";
import { getTema, setTema } from "../theme.js";

const usuario = await iniciarShell("perfil.html");
const datos = $("[data-form-datos]"), clave = $("[data-form-clave]"), tema = $("[data-form-tema]");
const aviso = (form, texto) => { const p = $("[data-ok]", form); p.textContent = texto; p.hidden = false; };

for (const campo of ["nombre", "apellido", "username", "email"]) datos.elements[campo].value = usuario[campo] ?? "";
$("[data-nombre-completo]").textContent = `${usuario.nombre} ${usuario.apellido}`;
$("[data-email]").textContent = usuario.email;
$("[data-username]").textContent = `@${usuario.username}`;
$("[data-avatar]").textContent = usuario.nombre.charAt(0).toUpperCase();

manejarForm(datos, async (d) => { await api.perfil.actualizar(d); aviso(datos, "Datos guardados."); });
manejarForm(clave, async (d, form) => {
  if (d.nueva !== d.repetir) throw new Error("Las contraseñas nuevas no coinciden.");
  await api.perfil.cambiarPassword({ actual: d.actual, nueva: d.nueva });
  form.reset(); aviso(clave, "Contraseña actualizada.");
});

tema.elements.tema.value = getTema();
tema.addEventListener("change", (e) => setTema(e.target.value));

$("[data-cerrar-sesion]").addEventListener("click", async () => { await api.auth.logout(); location.href = "acceso.html"; });
$("[data-eliminar-cuenta]").addEventListener("click", async () => {
  if (!confirm("Se borrarán tus movimientos, cuentas y presupuestos. Esta acción no se puede deshacer. ¿Continuar?")) return;
  await api.perfil.eliminar(); location.href = "acceso.html";
});
