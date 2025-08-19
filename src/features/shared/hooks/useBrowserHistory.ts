import { useEffect, useCallback } from 'react';

interface HistoryState {
  selectedPersonaItem: string | null;
  selectedConversationItem: string | null;
  personaId?: string;
  personaName?: string;
}

interface UseBrowserHistoryProps {
  selectedPersonaItem: string | null;
  selectedConversationItem: string | null;
  currentPersonaId?: string;
  currentPersonaName?: string;
  onNavigateBack: (state: HistoryState) => void;
}

export const useBrowserHistory = ({
  selectedPersonaItem,
  selectedConversationItem,
  currentPersonaId,
  currentPersonaName,
  onNavigateBack
}: UseBrowserHistoryProps) => {
  
  // URL을 현재 상태에 맞게 업데이트
  const updateURL = useCallback((state: HistoryState) => {
    const params = new URLSearchParams();
    
    if (state.selectedPersonaItem) {
      params.set('persona', state.selectedPersonaItem);
    }
    
    if (state.selectedConversationItem) {
      params.set('conversation', state.selectedConversationItem);
    }
    
    if (state.personaId) {
      params.set('personaId', state.personaId);
    }
    
    const newURL = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    // 현재 상태를 히스토리에 푸시
    window.history.pushState(state, '', newURL);
  }, []);

  // 페이지 네비게이션 함수
  const navigateTo = useCallback((newState: HistoryState) => {
    updateURL(newState);
  }, [updateURL]);

  // 브라우저 뒤로가기/앞으로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('=== 브라우저 뒤로가기 감지 ===');
      console.log('이벤트 상태:', event.state);
      
      if (event.state) {
        // 저장된 상태로 복원
        onNavigateBack(event.state);
      } else {
        // 초기 상태로 복원 (홈페이지)
        onNavigateBack({
          selectedPersonaItem: null,
          selectedConversationItem: null
        });
      }
    };

    // popstate 이벤트 리스너 등록
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onNavigateBack]);

  // 현재 상태가 변경될 때마다 URL 업데이트
  useEffect(() => {
    const currentState: HistoryState = {
      selectedPersonaItem,
      selectedConversationItem,
      personaId: currentPersonaId,
      personaName: currentPersonaName
    };

    // 초기 로드 시에는 replace 사용, 이후에는 push 사용
    if (window.history.state === null) {
      window.history.replaceState(currentState, '', window.location.href);
    } else {
      // 상태가 실제로 변경된 경우에만 히스토리에 추가
      const previousState = window.history.state;
      const hasChanged = 
        previousState?.selectedPersonaItem !== selectedPersonaItem ||
        previousState?.selectedConversationItem !== selectedConversationItem ||
        previousState?.personaId !== currentPersonaId;

      if (hasChanged) {
        updateURL(currentState);
      }
    }
  }, [selectedPersonaItem, selectedConversationItem, currentPersonaId, currentPersonaName, updateURL]);

  // URL에서 초기 상태 파싱
  const parseInitialState = useCallback((): HistoryState => {
    const params = new URLSearchParams(window.location.search);
    
    return {
      selectedPersonaItem: params.get('persona'),
      selectedConversationItem: params.get('conversation'),
      personaId: params.get('personaId') || undefined,
      personaName: undefined // 이름은 ID로부터 조회 필요
    };
  }, []);

  return {
    navigateTo,
    parseInitialState
  };
}; 