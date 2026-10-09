import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor de requisição para injetar credenciais e x-user-id
api.interceptors.request.use((config) => {
  try {
    const salvo = localStorage.getItem('arandue_usuario_ativo');
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (parsed?.id) {
        config.headers['x-user-id'] = parsed.id;
      }
    }
  } catch {
    // Ignora erro de parsing
  }
  return config;
});

// Interceptor para padronizar erros da API
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Garante mensagem legível caso a resposta venha com o formato { success: false, message: ... }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Erro ao conectar com o servidor.';
    return Promise.reject(new Error(message));
  }
);

export default api;
