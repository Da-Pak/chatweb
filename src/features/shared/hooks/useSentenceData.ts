import { useState, useEffect, useCallback } from 'react';
import { sentenceApi } from '../../training/api/sentenceApi';

export const useSentenceData = (threadId?: string) => {
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [highlightedSentences, setHighlightedSentences] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreadSentenceData = useCallback(async () => {
    if (!threadId) return;
    
    console.log('=== 스레드 문장 데이터 로딩 시작 ===');
    console.log('대상 스레드 ID:', threadId);
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await sentenceApi.getThreadSentenceData(threadId);
      
      console.log('로딩된 데이터:', {
        memo_count: Object.keys(data.memos || {}).length,
        highlight_count: data.highlights?.length || 0,
        memos: data.memos,
        highlights: data.highlights
      });
      
      setMemos(data.memos || {});
      setHighlightedSentences(new Set(data.highlights || []));
      
      console.log('스레드 문장 데이터 로딩 완료');
    } catch (error) {
      console.error('스레드 문장 데이터 로딩 실패:', error);
      setError(error instanceof Error ? error.message : '데이터 로딩에 실패했습니다');
      
      // 실패 시 빈 상태로 초기화
      setMemos({});
      setHighlightedSentences(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  // 스레드별 메모/하이라이트 데이터 로딩
  useEffect(() => {
    if (threadId) {
      loadThreadSentenceData();
    }
  }, [threadId, loadThreadSentenceData]);

  const handleMemoChange = async (
    sentenceId: string, 
    memo: string, 
    threadId?: string, 
    threadType?: string,
    sentenceContent?: string
  ) => {
    console.log('=== 메모 변경 처리 시작 ===');
    console.log('문장 ID:', sentenceId);
    console.log('메모 내용:', memo.substring(0, 50) + (memo.length > 50 ? '...' : ''));
    console.log('스레드 ID:', threadId);
    console.log('스레드 타입:', threadType);
    
    try {
      // 로컬 상태에서 메모 즉시 업데이트 (UI 반응성)
      setMemos(prev => ({
        ...prev,
        [sentenceId]: memo
      }));
      
      // 백엔드 API 호출
      const response = await sentenceApi.createOrUpdateMemo({
        sentence_id: sentenceId,
        thread_id: threadId,
        thread_type: threadType,
        content: memo,
        sentence_content: sentenceContent
      });
      
      console.log('메모 저장 API 응답:', response);
      console.log('메모 변경 처리 완료');
      
      return response;
    } catch (error) {
      console.error('메모 저장 실패:', error);
      
      // 실패 시 원래 상태로 되돌리기
      setMemos(prev => {
        const newMemos = { ...prev };
        if (memo.trim() === '') {
          delete newMemos[sentenceId];
        } else {
          // 이전 상태를 복원하기 어려우므로 다시 로딩
          loadThreadSentenceData();
        }
        return newMemos;
      });
      
      throw error;
    }
  };

  const handleDeleteMemo = async (sentenceId: string) => {
    console.log('=== 메모 삭제 처리 시작 ===');
    console.log('문장 ID:', sentenceId);
    
    try {
      // 로컬 상태에서 메모 즉시 제거 (UI 반응성)
      setMemos(prev => {
        const newMemos = { ...prev };
        delete newMemos[sentenceId];
        return newMemos;
      });
      
      // 백엔드 API 호출
      const response = await sentenceApi.deleteMemo(sentenceId);
      
      console.log('메모 삭제 API 응답:', response);
      console.log('메모 삭제 처리 완료');
      
      return response;
    } catch (error) {
      console.error('메모 삭제 실패:', error);
      
      // 실패 시 원래 상태로 되돌리기
      if (memos[sentenceId] !== undefined) {
        setMemos(prev => ({
          ...prev,
          [sentenceId]: memos[sentenceId]
        }));
      }
      
      throw error;
    }
  };

  const handleToggleHighlight = async (
    sentenceId: string, 
    threadId?: string, 
    threadType?: string
  ) => {
    console.log('=== 하이라이트 토글 처리 시작 ===');
    console.log('문장 ID:', sentenceId);
    console.log('현재 하이라이트 상태:', highlightedSentences.has(sentenceId));
    
    const isCurrentlyHighlighted = highlightedSentences.has(sentenceId);
    
    try {
      // 로컬 상태에서 하이라이트 즉시 토글 (UI 반응성)
      setHighlightedSentences(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyHighlighted) {
          newSet.delete(sentenceId);
        } else {
          newSet.add(sentenceId);
        }
        return newSet;
      });
      
      // 백엔드 API 호출
      let response;
      if (isCurrentlyHighlighted) {
        response = await sentenceApi.deleteHighlight(sentenceId);
      } else {
        // threadId와 threadType이 없으면 빈 문자열로 처리
        response = await sentenceApi.createHighlight({
          sentence_id: sentenceId,
          thread_id: threadId || '',
          thread_type: threadType || ''
        });
      }
      
      console.log('하이라이트 토글 API 응답:', response);
      console.log('하이라이트 토글 처리 완료');
      
      return response;
    } catch (error) {
      console.error('하이라이트 토글 실패:', error);
      
      // 실패 시 원래 상태로 되돌리기
      setHighlightedSentences(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyHighlighted) {
          newSet.add(sentenceId);
        } else {
          newSet.delete(sentenceId);
        }
        return newSet;
      });
      
      throw error;
    }
  };

  return {
    memos,
    highlightedSentences,
    isLoading,
    error,
    loadThreadSentenceData,
    handleMemoChange,
    handleDeleteMemo,
    handleToggleHighlight,
    setMemos,
    setHighlightedSentences
  };
}; 