import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";

const servidor = app.listen(config.port, () => console.log(`Finan API escuchando en http://localhost:${config.port}/api`));
const apagar = () => servidor.close(() => pool.end().then(() => process.exit(0)));
process.on("SIGTERM", apagar);
process.on("SIGINT", apagar);
