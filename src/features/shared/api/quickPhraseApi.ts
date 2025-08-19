import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface QuickPhrase {
  id: string;
  text: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface QuickPhraseCreateRequest {
  text: string;
}

export interface QuickPhraseResponse {
  success: boolean;
  message: string;
  phrase?: QuickPhrase;
}

export const quickPhraseApi = {
  // 자주쓰는 문장 목록 조회
  async getQuickPhrases(): Promise<QuickPhrase[]> {
    const response = await axios.get(`${API_BASE_URL}/api/quick_phrases`);
    return response.data;
  },

  // 자주쓰는 문장 생성
  async createQuickPhrase(request: QuickPhraseCreateRequest): Promise<QuickPhraseResponse> {
    const response = await axios.post(`${API_BASE_URL}/api/quick_phrases`, request);
    return response.data;
  },

  // 자주쓰는 문장 삭제
  async deleteQuickPhrase(phraseId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/api/quick_phrases/${phraseId}`);
    return response.data;
  },

  // 자주쓰는 문장 순서 변경
  async updateQuickPhrasesOrder(phraseIds: string[]): Promise<{ success: boolean; message: string }> {
    const response = await axios.put(`${API_BASE_URL}/api/quick_phrases/order`, {
      phrase_ids: phraseIds
    });
    return response.data;
  }
}; 