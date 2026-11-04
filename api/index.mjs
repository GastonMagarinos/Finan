// Función serverless de Vercel: toda petición a /api/* llega acá (ver vercel.json) y la resuelve Express.
import { app } from "../backend/src/app.js";

export default app;
