import { API_BASE_URL } from '../api/chatApi';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * 공통 API 클라이언트 - fetch 패턴 통합
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = getTimeoutForEndpoint(endpoint)
  } = options;

  // 기본 헤더 설정
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  try {
    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 응답 처리
    if (response.ok) {
      const data = await response.json();
      return { data };
    } else {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.detail || `서버 오류 (${response.status})`;
      return { error: errorMessage };
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { error: `요청 시간 초과: 서버 응답이 너무 늦습니다. (${timeout/1000}초 초과)` };
    } else if (error.message?.includes('fetch')) {
      return { error: '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.' };
    } else {
      return { error: `네트워크 오류: ${error.message || error}` };
    }
  }
}

/**
 * 엔드포인트에 따른 타임아웃 설정
 */
function getTimeoutForEndpoint(endpoint: string): number {
  // 해석 생성 관련 API는 더 긴 타임아웃 설정
  if (endpoint.includes('/interpretations/generate') || 
      endpoint.includes('/interpretations/generate-all') ||
      endpoint.includes('/interpretations/generate-with-extras')) {
    return 60000; // 60초
  }
  
  // 채팅 관련 API도 더 긴 타임아웃
  if (endpoint.includes('/chat/') || 
      endpoint.includes('/threads/chat') ||
      endpoint.includes('/verbalization/chat')) {
    return 120000; // 30초
  }
  
  // 기본 타임아웃
  return 15000; // 15초 (기본값을 10초에서 15초로 증가)
}

/**
 * 공통 GET 요청
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * 공통 POST 요청
 */
export async function apiPost<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'POST', body });
}

/**
 * 공통 PUT 요청
 */
export async function apiPut<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'PUT', body });
}

/**
 * 공통 DELETE 요청
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * 에러 처리 유틸리티
 */
export function handleApiError(error: any, defaultMessage: string = '작업에 실패했습니다'): string {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
}

/**
 * 저장고 관리를 위한 제네릭 클래스
 */
export class VaultManager<T, CreateRequest, UpdateRequest = Partial<CreateRequest>> {
  constructor(private baseEndpoint: string) {}

  async getAll(): Promise<ApiResponse<T[]>> {
    return apiGet<T[]>(this.baseEndpoint);
  }

  async create(request: CreateRequest): Promise<ApiResponse<{ success: boolean; message: string; saved_item?: T }>> {
    return apiPost(this.baseEndpoint, request);
  }

  async delete(id: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiDelete(`${this.baseEndpoint}/${id}`);
  }

  async update(id: string, request: UpdateRequest): Promise<ApiResponse<{ success: boolean; message: string; updated_item?: T }>> {
    return apiPut(`${this.baseEndpoint}/${id}`, request);
  }

  async interact(id: string, request: any = {}): Promise<ApiResponse<any>> {
    return apiPost(`${this.baseEndpoint}/${id}/interact`, request);
  }
}

/**
 * 통합 채팅 함수
 */
export interface ChatRequest {
  personaId: string;
  message: string;
  contextType?: 'interpretation' | 'proceed' | 'sentence' | 'verbalization';
  contextContent?: string;
  threadId?: string;
  conversationId?: string;
}

export async function universalChat(request: ChatRequest): Promise<ApiResponse<any>> {
  const { personaId, message, contextType, contextContent, threadId, conversationId } = request;

  // 채팅 타입에 따른 엔드포인트 결정
  if (contextType === 'verbalization') {
    return apiPost('/verbalization/chat', {
      user_message: message,
      thread_id: threadId
    });
  } else if (threadId) {
    return apiPost('/threads/chat', {
      thread_id: threadId,
      user_message: message
    });
  } else if (contextType && contextContent) {
    return apiPost('/chat/with-context', {
      persona_id: personaId,
      user_message: message,
      context_type: contextType,
      context_content: contextContent,
      thread_id: threadId
    });
  } else if (conversationId) {
    return apiPost('/chat/continue', {
      persona_id: personaId,
      user_message: message,
      conversation_id: conversationId
    });
  } else {
    return apiPost('/chat/initial', { content: message });
  }
} 