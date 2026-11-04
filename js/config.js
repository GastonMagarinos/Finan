// true = datos de ejemplo en memoria (sin backend). Poner en false (o window.FINAN_MOCK = false) al conectar la API real.
export const USE_MOCK = window.FINAN_MOCK ?? false;
// Backend Express: en local corre en :3000; desplegado (Vercel) vive en el mismo dominio bajo /api.
// Se puede forzar con window.FINAN_API_BASE antes de cargar los módulos.
export const API_BASE = window.FINAN_API_BASE ?? (typeof location !== "undefined" && location.hostname !== "localhost" ? "/api" : "http://localhost:3000/api");
