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
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response (después de recibir)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');
    const isUnauthorized = error.response?.status === 401;
    const notRetried = !originalRequest._retry;

    // Si no es 401, es endpoint de auth, o ya se reintentó, rechazar directamente
    if (!isUnauthorized || isAuthEndpoint || !notRetried) {
      return Promise.reject(error);
    }

    // Marcar como reintentado
    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token available");

      const response = await axios.post(`${domain ?? "http://localhost:4000"}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      // Limpiar todo el localStorage cuando falla el refresh token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export default api;