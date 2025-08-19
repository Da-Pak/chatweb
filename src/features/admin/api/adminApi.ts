import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminApi = {
  // 페르소나 정보 조회
  async getPersonaInfo() {
    try {
      const response = await api.get('/admin/personas/info');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.detail || '페르소나 정보 조회에 실패했습니다.' };
    }
  },

  // 페르소나 재로딩
  async reloadPersonas() {
    try {
      const response = await api.post('/admin/personas/reload');
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.detail || '페르소나 재로딩에 실패했습니다.' };
    }
  },

  // CSV 다운로드 URL 생성
  getDownloadUrl() {
    return `${API_BASE_URL}/admin/personas/csv`;
  },

  // CSV 업로드
  async uploadPersonasCSV(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/admin/personas/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { data: response.data };
    } catch (error: any) {
      return { error: error.response?.data?.detail || 'CSV 업로드에 실패했습니다.' };
    }
  },
}; 