/**
 * Punto de entrada principal de la aplicación React (Frontend)
 * Inicializa el árbol de componentes en el DOM y monta el modo estricto de React.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Renderiza la aplicación raíz en el elemento contenedor con id 'root'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
