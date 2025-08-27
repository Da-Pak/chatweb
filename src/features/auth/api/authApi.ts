import axios from 'axios';
import { UserCreate, User } from '../types/authTypes';
import { API_BASE_URL } from '../../shared/api/chatApi';

const API_URL = `${API_BASE_URL}/auth`;

export const register = async (userInfo: UserCreate): Promise<User> => {
  const response = await axios.post(`${API_URL}/register`, userInfo);
  return response.data;
};

export const login = async (credentials: UserCreate) => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  // In a real app, you'd get a token back
  return response.data;
};

export const getStatus = async () => {
  // This would typically require a token
  const response = await axios.get(`${API_URL}/status`);
  return response.data;
};

export {}; // Add this line to ensure it's treated as a module
