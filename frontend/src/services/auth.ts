import { api } from './api';

export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  dietaryPreferences?: string[];
  allergies?: string[];
  skillLevel?: string;
  calorieTarget?: number;
  createdAt?: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthData> {
  const { data } = await api.post<{ success: boolean; data: AuthData }>('/auth/login', {
    email,
    password,
  });
  if (data.data.token) {
    localStorage.setItem('accessToken', data.data.token);
  }
  return data.data;
}

export async function register(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthData> {
  const { data } = await api.post<{ success: boolean; data: AuthData }>('/auth/register', {
    email,
    password,
    fullName,
  });
  if (data.data.token) {
    localStorage.setItem('accessToken', data.data.token);
  }
  return data.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('accessToken');
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ success: boolean; data: User }>('/auth/me');
  return data.data;
}

export async function updateProfile(updates: {
  fullName?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  skillLevel?: string;
  calorieTarget?: number;
}): Promise<User> {
  const { data } = await api.put<{ success: boolean; data: User }>('/auth/profile', updates);
  return data.data;
}
