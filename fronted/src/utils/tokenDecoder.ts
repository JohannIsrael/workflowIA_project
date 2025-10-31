import { jwtDecode } from 'jwt-decode';

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  fullName: string;
  createdAt: string;
  lastLogin: string;
  token: string;
  exp?: number;
  iat?: number;
}

/**
 * Decodifica el refreshToken y retorna su payload
 */
export const decodeRefreshToken = (): TokenPayload | null => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }
    const decoded = jwtDecode<TokenPayload>(refreshToken);
    return decoded;
  } catch (error) {
    console.error('Error decoding refresh token:', error);
    return null;
  }
};

/**
 * Decodifica el accessToken y retorna su payload
 */
export const decodeAccessToken = (): TokenPayload | null => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return null;
    }
    const decoded = jwtDecode<TokenPayload>(accessToken);
    return decoded;
  } catch (error) {
    console.error('Error decoding access token:', error);
    return null;
  }
};

/**
 * Verifica si un token está expirado
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded.exp) {
      return false;
    }
    const currentTime = Date.now() / 1000; // Convertir a segundos
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

