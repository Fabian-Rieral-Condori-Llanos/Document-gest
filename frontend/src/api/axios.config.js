import axios from 'axios';

// En desarrollo, usamos el proxy de Vite (mismo origen, cookies funcionan)
// En producción, usamos la URL directa del API
const baseURL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL 
  : '/api';  // Proxy de Vite - mismo origen

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANTE: Enviar cookies en cada petición
});

console.log(' API Mode:', import.meta.env.PROD ? 'Production' : 'Development (Proxy)');
console.log(' API Base URL:', baseURL);

export default api;