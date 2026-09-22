/**
 * Punto de entrada del servidor HTTP (Backend).
 * Se encarga de inicializar la escucha de conexiones en el puerto configurado.
 */

import { app } from './app';
import { entorno } from './config/entorno';

// Iniciar la escucha del servidor HTTP
app.listen(entorno.PUERTO, () => {
  console.log(`🚀 Servidor de Curifor Tickets iniciado`);
  console.log(`📡 Puerto: ${entorno.PUERTO}`);
  console.log(`🌍 Entorno: ${entorno.NODE_ENV}`);
  console.log(`🔒 CORS habilitado para los orígenes: ${entorno.FRONTEND_URL}`);
});
