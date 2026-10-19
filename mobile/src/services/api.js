import axios from 'axios';
import { Platform } from 'react-native';

// No Android Emulator o localhost do PC é 10.0.2.2. No iOS simulator ou web é localhost.
// Permite sobrescrever via env ou default inteligente.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Armazena temporariamente o ID do usuário para cabeçalho de autenticação simulada
let currentUserId = null;
let currentAuthToken = null;

export const setApiUser = (user, token = null) => {
  currentUserId = user?.id || null;
  currentAuthToken = token || null;
};

// Interceptor de requisições
api.interceptors.request.use(
  (config) => {
    if (currentUserId) {
      config.headers['x-user-id'] = String(currentUserId);
    }
    if (currentAuthToken) {
      config.headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respostas para tratamento consistente de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erro ao comunicar com o servidor Aranduê.';
    return Promise.reject(new Error(mensagem));
  }
);

export default api;
