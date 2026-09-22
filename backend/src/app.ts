/**
 * Configuración central de la aplicación Express.
 * Define middlewares globales (CORS, JSON parser), rutas públicas/protegidas,
 * capturador de rutas 404 y el manejador global de errores.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { entorno } from './config/entorno';
import { manejadorErrores } from './middlewares/manejador-errores.middleware';
import { rutasTickets } from './routes/ticket.routes';
import { rutasUsuarios } from './routes/usuario.routes';

// Instancia principal de la aplicación Express
export const app: Application = express();

// 1. Configuración de CORS permitiendo múltiples orígenes separados por coma
const origenesPermitidos = entorno.FRONTEND_URL.split(',').map((origen) => origen.trim());

app.use(
  cors({
    origin: origenesPermitidos,
    credentials: true,
  })
);

// 2. Parseo de cuerpos de petición en formato JSON
app.use(express.json());

// 3. Ruta básica de comprobación de salud del servicio (health check público)
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    exito: true,
    mensaje: 'Servicio de Curifor Tickets en funcionamiento',
    entorno: entorno.NODE_ENV,
    origenesPermitidos,
    fecha: new Date().toISOString(),
  });
});

// 4. Montaje de rutas modulares de la API
app.use('/api/tickets', rutasTickets);
app.use('/api/usuarios', rutasUsuarios);

// 5. Intermediario para capturar rutas no encontradas (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    exito: false,
    mensaje: 'La ruta solicitada no existe',
  });
});

// 6. Intermediario global para captura y formateo de errores (500 / errores operacionales)
app.use(manejadorErrores);
