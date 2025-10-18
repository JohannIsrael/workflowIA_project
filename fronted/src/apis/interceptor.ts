import axios from "axios";
const domain = import.meta.env.VITE_DOMAIN

// Crear instancia de Axios
const api = axios.create({
  baseURL: domain ?? "http://localhost:4000", 
  withCredentials: true, 
});

// Interceptor de request (antes de enviar)
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem("token"); // o de tu store
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response (después de recibir)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log("No autorizado, redirigir a login");
    }
    return Promise.reject(error);
  }
);

export default api;