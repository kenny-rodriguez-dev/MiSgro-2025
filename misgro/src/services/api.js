import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7223/api";

const API = axios.create({
  baseURL: baseURL,
});

// --- Interceptor de Solicitud (Request) ---
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Interceptor de Respuesta (Response) CORREGIDO ---
API.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa (2xx), simplemente la retornamos.
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Lista de rutas donde un 401 es un error esperado y no una sesión expirada.
    const publicErrorPaths = [
      '/auth/login',
      // Es buena idea añadir otras rutas de autenticación si pudieran devolver 401 por otras razones.
      '/auth/register' 
    ];

    // Comprobamos si el error es 401 Y si la URL NO ESTÁ en nuestra lista de excepciones.
    if (error.response?.status === 401 && !publicErrorPaths.includes(originalRequest.url)) {
      console.log("Interceptor: 401 Unauthorized en ruta protegida. Despachando evento 'sessionExpired'.");
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sessionExpired"));
      }
      // Detenemos la cadena de promesas para que el modal global tome el control.
      return new Promise(() => {});
    }

    // Para cualquier otro error (incluyendo 401 en /auth/login), dejamos que la promesa se rechace.
    // Esto permite que el bloque .catch() del componente (p.ej., en LoginPage) lo maneje.
    return Promise.reject(error);
  }
);

export default API;
