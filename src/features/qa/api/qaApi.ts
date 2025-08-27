import axios from 'axios';
import { API_BASE_URL } from '../../shared/api/chatApi';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터에서 토큰 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface QAQuestion {
  question_id: number;
  question_text: string;
}

export interface QASubmission {
  question_id: number;
  answer: string;
}

export const qaApi = {
  /**
   * QA 질문 목록을 가져옵니다.
   */
  async getQuestions(): Promise<QAQuestion[]> {
    try {
      const response = await api.get<QAQuestion[]>('/api/qa/questions');
      return response.data;
    } catch (error) {
      console.error("QA 질문 로드 실패:", error);
      throw error;
    }
  },

  /**
   * 사용자의 QA 답변 목록을 제출합니다.
   */
  async submitAnswers(answers: QASubmission[]): Promise<{ success: boolean; message: string }> {
    try {
      // 백엔드가 기대하는 { "answers": [...] } 형태로 데이터를 감싸서 전송합니다.
      console.log("QA 답변 제출 데이터:", { answers });
      const response = await api.post('/api/qa/answers', { answers });
      console.log("QA 답변 제출 응답:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("QA 답변 제출 실패:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      throw error;
    }
  },

  /**
   * 사용자의 QA 완료 상태를 확인합니다.
   */
  async getStatus(): Promise<{ is_completed: boolean }> {
    try {
      const response = await api.get('/api/qa/status');
  return response.data;
    } catch (error) {
      console.error("QA 상태 확인 실패:", error);
      throw error;
    }
  }
};
