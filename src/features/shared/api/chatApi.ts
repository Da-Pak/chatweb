import { 
  Persona, PersonaResponse, Conversation, GlobalMessage, ApiResponse,
  InterpretationStatus, InterpretationResponse, InterpretationRequest,
  ProceedRequest, ProceedResponse, SentenceRequest, SentenceResponse,
  TrainingThread, InteractionRecord, ThreadChatRequest, ThreadChatResponse,
  GenerateWithExtrasResponse
} from '../types';
import { 
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete, 
  universalChat
} from '../utils/apiUtils';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const chatApi = {
  // 페르소나 정보 가져오기
  async getPersonas(): Promise<ApiResponse<Record<string, Persona>>> {
    return apiGet<Record<string, Persona>>('/personas');
  },

  // 해석 상태 조회
  async getInterpretationStatus(): Promise<ApiResponse<InterpretationStatus[]>> {
    return apiGet<InterpretationStatus[]>('/interpretations/status');
  },

  // 해석 생성
  async generateInterpretation(request: InterpretationRequest): Promise<ApiResponse<InterpretationResponse>> {
    return apiPost<InterpretationResponse>('/interpretations/generate', request);
  },

  // 해석 조회
  async getInterpretation(personaId: string): Promise<ApiResponse<InterpretationResponse>> {
    return apiGet<InterpretationResponse>(`/interpretations/${personaId}`);
  },

  // 초기 채팅 (모든 페르소나 응답)
  async sendInitialMessage(content: string): Promise<ApiResponse<{
    message_id: string;
    responses: PersonaResponse[];
  }>> {
    return universalChat({ personaId: '', message: content });
  },

  // 특정 페르소나와 대화 이어가기
  async continueConversation(
    persona_id: string,
    user_message: string,
    conversation_id: string
  ): Promise<ApiResponse<PersonaResponse>> {
    return universalChat({ 
      personaId: persona_id, 
      message: user_message, 
      conversationId: conversation_id 
    });
  },

  // 특정 대화 기록 가져오기
  async getConversation(conversation_id: string): Promise<ApiResponse<Conversation>> {
    return apiGet<Conversation>(`/conversations/${conversation_id}`);
  },

  // 모든 대화 기록 가져오기
  async getAllConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiGet<Conversation[]>('/conversations');
  },

  // 전체 메시지 기록 가져오기
  async getGlobalMessages(): Promise<ApiResponse<GlobalMessage[]>> {
    return apiGet<GlobalMessage[]>('/messages');
  },

  // 메시지 수정
  async editMessage(
    conversationId: string,
    messageIndex: number,
    newContent: string
  ): Promise<ApiResponse<{ 
    success: boolean; 
    message: string; 
    updated_conversation?: Conversation;
    new_response?: PersonaResponse;
  }>> {
    return apiPut(`/conversations/${conversationId}/messages/${messageIndex}`, {
      new_content: newContent
    });
  },

  // 스레드 메시지 수정
  async editThreadMessage(
    threadId: string,
    messageIndex: number,
    newContent: string
  ): Promise<ApiResponse<{ 
    success: boolean; 
    message: string; 
    updated_thread?: TrainingThread;
  }>> {
    return apiPut(`/threads/${threadId}/messages/${messageIndex}`, {
      new_content: newContent
    });
  },

  // 모든 페르소나의 자동 해석 생성
  async generateAllInterpretations(): Promise<ApiResponse<{
    message: string;
    interpretations: InterpretationResponse[];
    total_count: number;
  }>> {
    return apiPost('/interpretations/generate-all');
  },

  // ⚠️ DEPRECATED: universalChat 사용 권장
  async chatWithInterpretation(
    personaId: string,
    message: string
  ): Promise<ApiResponse<{
    persona_id: string;
    persona_name: string;
    user_message: string;
    response: string;
    interpretation_used: boolean;
    timestamp: string;
  }>> {
    console.warn('chatWithInterpretation is deprecated. Use universalChat instead.');
    return universalChat({ 
      personaId, 
      message, 
      contextType: 'interpretation' 
    });
  },

  // 컨텍스트 기반 범용 채팅 (해석/나아가기/문장 모두 지원)
  async chatWithContext(
    personaId: string,
    message: string,
    contextType: 'interpretation' | 'proceed' | 'sentence',
    contextContent?: string,
    threadId?: string
  ): Promise<ApiResponse<{
    persona_id: string;
    persona_name: string;
    user_message: string;
    response: string;
    context_type: string;
    context_used: boolean;
    is_first_message: boolean;
    conversation_id: string;
    timestamp: string;
  }>> {
    return universalChat({ 
      personaId, 
      message, 
      contextType, 
      contextContent, 
      threadId 
    });
  },

  // ========== 새로운 기능: 나아가기, 문장, 상호작용 기록 ==========

  // 나아가기 생성
  async generateProceed(request: ProceedRequest): Promise<ApiResponse<ProceedResponse>> {
    return apiPost<ProceedResponse>('/proceed/generate', request);
  },

  // 문장 생성
  async generateSentence(request: SentenceRequest): Promise<ApiResponse<SentenceResponse>> {
    return apiPost<SentenceResponse>('/sentence/generate', request);
  },

  // 나아가기 내용 조회
  async getProceedContent(personaId: string): Promise<ApiResponse<{ proceed_content: string }>> {
    return apiGet<{ proceed_content: string }>(`/proceed/${personaId}`);
  },

  // 문장 내용 조회
  async getSentenceContent(personaId: string): Promise<ApiResponse<{ sentence_content: string }>> {
    return apiGet<{ sentence_content: string }>(`/sentence/${personaId}`);
  },

  // 특정 페르소나의 모든 스레드 조회
  async getPersonaThreads(personaId: string): Promise<ApiResponse<TrainingThread[]>> {
    return apiGet<TrainingThread[]>(`/threads/${personaId}`);
  },

  // 특정 페르소나의 특정 타입 스레드 조회
  async getPersonaThreadsByType(personaId: string, threadType: string): Promise<ApiResponse<TrainingThread[]>> {
    return apiGet<TrainingThread[]>(`/threads/${personaId}/${threadType}`);
  },

  // 스레드와 채팅 (통합 채팅 함수 사용)
  async chatWithThread(request: ThreadChatRequest): Promise<ApiResponse<ThreadChatResponse>> {
    return universalChat({ 
      personaId: '', 
      message: request.user_message, 
      threadId: request.thread_id 
    });
  },

  // 모든 상호작용 기록 조회
  async getAllInteractionRecords(): Promise<ApiResponse<InteractionRecord[]>> {
    return apiGet<InteractionRecord[]>('/interaction-records');
  },

  // 특정 페르소나의 상호작용 기록 조회
  async getInteractionRecord(personaId: string): Promise<ApiResponse<InteractionRecord>> {
    return apiGet<InteractionRecord>(`/interaction-records/${personaId}`);
  },

  // 해석 생성과 동시에 나아가기, 문장도 자동 생성
  async generateInterpretationWithExtras(request: InterpretationRequest): Promise<ApiResponse<GenerateWithExtrasResponse>> {
    return apiPost<GenerateWithExtrasResponse>('/interpretations/generate-with-extras', request);
  },

  // 스레드 삭제
  async deleteThread(threadId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiDelete(`/threads/${threadId}`);
  },

  // 현재 내용을 나아가기로 저장
  async saveCurrentAsProceed(personaId: string, content: string): Promise<ApiResponse<ProceedResponse>> {
    return apiPost<ProceedResponse>('/proceed/save', {
      persona_id: personaId,
      content: content
    });
  },

  // 현재 내용을 문장으로 저장
  async saveCurrentAsSentence(personaId: string, content: string): Promise<ApiResponse<SentenceResponse>> {
    return apiPost<SentenceResponse>('/sentence/save', {
      persona_id: personaId,
      content: content
    });
  },

  // 현재 내용을 해석에 추가 저장
  async saveCurrentAsInterpretation(personaId: string, content: string): Promise<ApiResponse<InterpretationResponse>> {
    return apiPost<InterpretationResponse>('/interpretations/save', {
      persona_id: personaId,
      content: content
    });
  },

  // ========== 언어화 기능 (통합 채팅 함수 사용) ==========

  // 언어화 채팅
  async chatWithVerbalization(
    userMessage: string,
    threadId?: string
  ): Promise<ApiResponse<ThreadChatResponse>> {
    return universalChat({ 
      personaId: '', 
      message: userMessage, 
      contextType: 'verbalization', 
      threadId 
    });
  },

  // 언어화 스레드 목록 조회
  async getVerbalizationThreads(): Promise<ApiResponse<TrainingThread[]>> {
    return apiGet<TrainingThread[]>('/verbalization/threads');
  },

  // 새 언어화 스레드 생성
  async createNewVerbalizationThread(): Promise<ApiResponse<TrainingThread>> {
    return apiPost<TrainingThread>('/verbalization/new-thread');
  },

  // 언어화 스레드 삭제
  async deleteVerbalizationThread(threadId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiDelete<{ success: boolean; message: string }>(`/verbalization/threads/${threadId}`);
  },

  // 더 혼란스럽게 분석 생성
  async generateConfusionAnalysis(personaId: string): Promise<ApiResponse<{
    persona_id: string;
    persona_name: string;
    analysis: {
      persona_id: string;
      persona_name: string;
      sections: Array<{
        title: string;
        content: string;
        sub_items: Array<{
          title: string;
          content: string;
        }>;
      }>;
      timestamp: string;
    };
    timestamp: string;
  }>> {
    return apiPost('/confusion/generate', {
      persona_id: personaId,
      user_input: "기본 혼란스럽게 분석 요청"
    });
  },

  // 더 혼란스럽게 분석 조회
  async getConfusionAnalysis(personaId: string): Promise<ApiResponse<{
    persona_id: string;
    persona_name: string;
    analysis: {
      persona_id: string;
      persona_name: string;
      sections: Array<{
        title: string;
        content: string;
        sub_items: Array<{
          title: string;
          content: string;
        }>;
      }>;
      timestamp: string;
    };
    timestamp: string;
  }>> {
    return apiGet(`/confusion/${personaId}`);
  },
}; 