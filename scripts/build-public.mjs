// Copia SOLO el front a public/ para que Vercel sirva eso como sitio estático.
// Así backend/, tests/, scripts/ y package.json no quedan expuestos públicamente.
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";

rmSync("public", { recursive: true, force: true });
mkdirSync("public");
for (const archivo of readdirSync(".")) if (archivo.endsWith(".html")) cpSync(archivo, `public/${archivo}`);
for (const carpeta of ["css", "js"]) cpSync(carpeta, `public/${carpeta}`, { recursive: true, filter: (ruta) => !ruta.endsWith("package.json") });
console.log("public/ listo");
