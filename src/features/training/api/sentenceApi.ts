import { 
  apiGet, 
  apiPost, 
  apiDelete, 
  VaultManager
} from '../../shared/utils/apiUtils';

export interface SentenceVaultItem {
  id: string;
  sentence: string;
  source_message_id: string;
  source_conversation_id?: string;
  source_thread_id?: string;  // 원본 스레드 ID
  source_thread_type?: string;  // 원본 스레드 타입
  source_sentence_id?: string;  // 원본 문장 ID
  created_at: string;
  tags: string[];
  metadata?: Record<string, any>;
  
  // 통합된 문장 상태 정보
  is_highlighted: boolean;  // 하이라이트 여부
  highlight_color?: string;  // 하이라이트 색상
  memo_content?: string;  // 메모 내용
  is_pinned: boolean;  // 고정 여부
}

export interface SentenceVaultRequest {
  sentences: string[];
  source_message_id: string;
  source_conversation_id?: string;
  source_thread_id?: string;
  source_thread_type?: string;
  source_sentence_ids?: string[];  // 원본 문장 ID들
  tags?: string[];
  
  // 각 문장별 상태 정보 (sentences와 동일한 순서)
  highlight_states?: boolean[];  // 하이라이트 여부
  highlight_colors?: (string | null)[];  // 하이라이트 색상
  memo_contents?: (string | null)[];  // 메모 내용
}

export interface SentenceVaultResponse {
  success: boolean;
  message: string;
  saved_items: SentenceVaultItem[];
}

export interface VaultRestoreRequest {
  thread_id: string;
  sentence_id: string;
}

export interface VaultRestoreResponse {
  success: boolean;
  message: string;
  restored_highlight: boolean;
  restored_memo: boolean;
  highlight_color?: string;
  memo_content?: string;
}

export interface VaultUpdateRequest {
  is_highlighted?: boolean;
  highlight_color?: string;
  memo_content?: string;
  is_pinned?: boolean;
  tags?: string[];
}

export interface VaultUpdateResponse {
  success: boolean;
  message: string;
  updated_item: SentenceVaultItem;
}

export interface SentenceMemo {
  id: string;
  sentence_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SentenceMemoRequest {
  sentence_id: string;
  thread_id?: string;
  thread_type?: string;
  content: string;
  sentence_content?: string;  // 메모 저장고 저장을 위한 문장 내용
  source_message_id?: string;  // 메모 저장고 저장을 위한 메시지 ID
  
  // 연관된 문장들 정보 (메모와 함께 선택된 문장들)
  related_sentence_ids?: string[];  // 메모와 연관된 모든 문장 ID들
  related_sentence_contents?: string[];  // 메모와 연관된 모든 문장 내용들
}

export interface SentenceMemoResponse {
  success: boolean;
  message: string;
  memo?: SentenceMemo;
}

export interface SentenceHighlight {
  id: string;
  sentence_id: string;
  thread_id: string;
  thread_type: string;
  created_at: string;
}

export interface SentenceHighlightRequest {
  sentence_id: string;
  thread_id: string;
  thread_type: string;
}

export interface SentenceHighlightResponse {
  success: boolean;
  message: string;
  highlight?: SentenceHighlight;
}

export interface ThreadSentenceData {
  memos: Record<string, string>;
  highlights: string[];
}

// 메모 저장고 관련 타입들
export interface MemoVaultItem {
  id: string;
  memo_content: string;  // 사용자가 삽입한 메모 내용
  sentence_content: string;  // 원본 문장 내용
  source_message_id: string;
  source_conversation_id?: string;
  source_thread_id?: string;
  source_thread_type?: string;
  source_sentence_id: string;
  created_at: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface MemoVaultRequest {
  memo_content: string;  // 사용자가 삽입한 메모
  sentence_content: string;  // 원본 문장
  source_message_id: string;
  source_conversation_id?: string;
  source_thread_id?: string;
  source_thread_type?: string;
  source_sentence_id: string;
  tags?: string[];
  metadata?: Record<string, any>;  // 연관된 문장들 정보 등을 저장하는 메타데이터
}

export interface MemoVaultResponse {
  success: boolean;
  message: string;
  saved_item?: MemoVaultItem;
}

export interface MemoVaultInteractionResponse {
  success: boolean;
  message: string;
  interaction_message: string;
  source_thread_id?: string;
  source_thread_type?: string;
  memo_item: MemoVaultItem;
}

// 저장고 매니저 인스턴스들
const sentenceVaultManager = new VaultManager<SentenceVaultItem, SentenceVaultRequest, VaultUpdateRequest>('/vault/sentences');
const memoVaultManager = new VaultManager<MemoVaultItem, MemoVaultRequest>('/vault/memos');

class SentenceApi {
  // === 문장 저장고 관련 API (VaultManager 사용) ===
  
  async saveSentencesToVault(request: SentenceVaultRequest): Promise<SentenceVaultResponse> {
    console.log('=== 저장고 저장 시작 (통합 API 사용) ===');
    console.log('요청 데이터:', JSON.stringify(request, null, 2));
    
    try {
      const response = await sentenceVaultManager.create(request);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('성공 응답:', response.data);
      console.log('=== 저장고 저장 완료 ===');
      return response.data as SentenceVaultResponse;
      
    } catch (error: any) {
      console.error('저장고 저장 오류:', error);
      throw error;
    }
  }

  async getVaultSentences(): Promise<SentenceVaultItem[]> {
    const response = await sentenceVaultManager.getAll();
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  async deleteVaultSentence(sentenceId: string): Promise<{ success: boolean; message: string }> {
    const response = await sentenceVaultManager.delete(sentenceId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || { success: false, message: '삭제 실패' };
  }

  async updateVaultSentence(sentenceId: string, request: VaultUpdateRequest): Promise<VaultUpdateResponse> {
    const response = await sentenceVaultManager.update(sentenceId, request);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as VaultUpdateResponse;
  }

  async restoreVaultSentence(vaultSentenceId: string, request: VaultRestoreRequest): Promise<VaultRestoreResponse> {
    const response = await apiPost<VaultRestoreResponse>(`/vault/sentences/${vaultSentenceId}/restore`, request);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data!;
  }

  // === 메모 관련 API (통합) ===
  
  async createOrUpdateMemo(request: SentenceMemoRequest): Promise<SentenceMemoResponse> {
    console.log('=== 메모 저장 API 호출 ===');
    console.log('요청 데이터:', {
      sentence_id: request.sentence_id,
      thread_id: request.thread_id,
      thread_type: request.thread_type,
      content: request.content?.substring(0, 50) + (request.content?.length > 50 ? '...' : ''),
      has_related_sentences: (request.related_sentence_ids?.length || 0) > 0
    });
    
    try {
      const response = await apiPost<SentenceMemoResponse>('/memos', request);
      
      if (response.error) {
        console.error('메모 저장 API 에러:', response.error);
        throw new Error(response.error);
      }
      
      console.log('메모 저장 성공:', response.data?.success);
      return response.data!;
    } catch (error) {
      console.error('메모 저장 API 호출 실패:', error);
      throw error;
    }
  }

  async getMemo(sentenceId: string): Promise<SentenceMemo | null> {
    const response = await apiGet<SentenceMemo>(`/memos/${sentenceId}`);
    return response.data || null;
  }

  async deleteMemo(sentenceId: string): Promise<{ success: boolean; message: string }> {
    console.log('=== 메모 삭제 API 호출 ===');
    console.log('문장 ID:', sentenceId);
    
    try {
      const response = await apiDelete<{ success: boolean; message: string }>(`/memos/${sentenceId}`);
      
      if (response.error) {
        console.error('메모 삭제 API 에러:', response.error);
        throw new Error(response.error);
      }
      
      console.log('메모 삭제 성공:', response.data?.success);
      return response.data!;
    } catch (error) {
      console.error('메모 삭제 API 호출 실패:', error);
      throw error;
    }
  }

  async getAllMemos(): Promise<Record<string, string>> {
    const response = await apiGet<Record<string, string>>('/memos');
    return response.data || {};
  }

  // === 하이라이트 관련 API (통합) ===
  
  async createHighlight(request: SentenceHighlightRequest): Promise<SentenceHighlightResponse> {
    console.log('=== 하이라이트 생성 API 호출 ===');
    console.log('요청 데이터:', {
      sentence_id: request.sentence_id,
      thread_id: request.thread_id,
      thread_type: request.thread_type
    });
    
    try {
      const response = await apiPost<SentenceHighlightResponse>('/highlights', request);
      
      if (response.error) {
        console.error('하이라이트 생성 API 에러:', response.error);
        throw new Error(response.error);
      }
      
      console.log('하이라이트 생성 성공:', response.data?.success);
      return response.data!;
    } catch (error) {
      console.error('하이라이트 생성 API 호출 실패:', error);
      throw error;
    }
  }

  async deleteHighlight(sentenceId: string): Promise<{ success: boolean; message: string }> {
    console.log('=== 하이라이트 삭제 API 호출 ===');
    console.log('문장 ID:', sentenceId);
    
    try {
      const response = await apiDelete<{ success: boolean; message: string }>(`/highlights/${sentenceId}`);
      
      if (response.error) {
        console.error('하이라이트 삭제 API 에러:', response.error);
        throw new Error(response.error);
      }
      
      console.log('하이라이트 삭제 성공:', response.data?.success);
      return response.data!;
    } catch (error) {
      console.error('하이라이트 삭제 API 호출 실패:', error);
      throw error;
    }
  }

  async getAllHighlights(): Promise<Record<string, string[]>> {
    const response = await apiGet<Record<string, string[]>>('/highlights');
    return response.data || {};
  }

  async getThreadHighlights(threadId: string): Promise<string[]> {
    const response = await apiGet<{ highlights: string[] }>(`/highlights/thread/${threadId}`);
    return response.data?.highlights || [];
  }

  // === 스레드 관련 API ===
  
  async getThreadSentenceData(threadId: string): Promise<ThreadSentenceData> {
    console.log('=== 스레드 문장 데이터 조회 API 호출 ===');
    console.log('스레드 ID:', threadId);
    
    try {
      const response = await apiGet<ThreadSentenceData>(`/threads/${threadId}/sentence-data`);
      
      if (response.error) {
        console.error('스레드 문장 데이터 조회 API 에러:', response.error);
        throw new Error(response.error);
      }
      
      console.log('스레드 문장 데이터 조회 성공:', {
        memo_count: Object.keys(response.data?.memos || {}).length,
        highlight_count: response.data?.highlights?.length || 0
      });
      
      return response.data!;
    } catch (error) {
      console.error('스레드 문장 데이터 조회 API 호출 실패:', error);
      throw error;
    }
  }

  // === 메모 저장고 관련 API (VaultManager 사용) ===
  
  async saveMemoToVault(request: MemoVaultRequest): Promise<MemoVaultResponse> {
    const response = await memoVaultManager.create(request);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as MemoVaultResponse;
  }

  async getVaultMemos(): Promise<MemoVaultItem[]> {
    const response = await memoVaultManager.getAll();
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  async deleteVaultMemo(memoId: string): Promise<{ success: boolean; message: string }> {
    const response = await memoVaultManager.delete(memoId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || { success: false, message: '삭제 실패' };
  }

  async interactWithVaultMemo(memoId: string): Promise<MemoVaultInteractionResponse> {
    const response = await memoVaultManager.interact(memoId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data as MemoVaultInteractionResponse;
  }

  // === 개발용 API ===
  
  async resetDevData(): Promise<{ success: boolean; message: string }> {
    const response = await apiPost<{ success: boolean; message: string }>('/dev/reset');
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data!;
  }
}

export const sentenceApi = new SentenceApi();
