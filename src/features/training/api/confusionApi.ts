import { apiGet, apiPost } from '../../shared/utils/apiUtils';

// API 응답 타입 정의
export interface ConfusionItemDetail {
  item_id: string;
  interpretation: string;
  key_sentence: string;
  proceed: string;
  proceed_key_sentence: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConfusionChatRequest {
  user_message: string;
  conversation_history: ChatMessage[];
}

export interface ConfusionChatResponse {
  response: string;
}

export const confusionApi = {
  // 개별 혼란스러운 해석 항목 상세 정보 조회
  async getItemDetail(personaId: string, itemId: string): Promise<ConfusionItemDetail> {
    try {
      const response = await apiGet<ConfusionItemDetail>(`/training/confusion/${personaId}/item/${itemId}`);
      if (!response.data) {
        throw new Error('응답 데이터가 없습니다.');
      }
      return response.data;
    } catch (error) {
      console.error('혼란스러운 해석 항목 조회 실패:', error);
      throw error;
    }
  },

  // 특정 혼란스러운 해석 항목과 채팅
  async chatWithItem(
    personaId: string, 
    itemId: string, 
    request: ConfusionChatRequest
  ): Promise<ConfusionChatResponse> {
    try {
      const response = await apiPost<ConfusionChatResponse>(
        `/training/confusion/${personaId}/item/${itemId}/chat`,
        request
      );
      if (!response.data) {
        throw new Error('응답 데이터가 없습니다.');
      }
      return response.data;
    } catch (error) {
      console.error('혼란스러운 해석 항목 채팅 실패:', error);
      throw error;
    }
  }
}; 