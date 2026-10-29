// URL base del backend Express. Se puede sobreescribir con window.FINAN_API_BASE antes de cargar los módulos.
// true = datos de ejemplo en memoria (sin backend). Poner en false (o window.FINAN_MOCK = false) al conectar la API real.
export const USE_MOCK = window.FINAN_MOCK ?? true;
export const API_BASE = window.FINAN_API_BASE ?? "http://localhost:3000/api";
