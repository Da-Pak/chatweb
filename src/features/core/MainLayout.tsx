import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../shared/hooks/useChat';
import { useBrowserHistory } from '../shared/hooks/useBrowserHistory';
import ConversationSidebar from '../shared/components/ConversationSidebar';
import PersonaSidebar from '../shared/components/PersonaSidebar';
import VaultView from '../vault/components/VaultView';
import StimulusView from '../stimulus/components/StimulusView';
import ChatArea from '../shared/components/ChatArea';
import { GlobalStyle, AppContainer } from '../shared/styles/GlobalStyle';
import { chatApi } from '../shared/api/chatApi';
import { TrainingThread } from '../shared/types';

const MainLayout: React.FC = () => {
  const [isPersonaSidebarCollapsed, setIsPersonaSidebarCollapsed] = useState(false);
  const [isConversationSidebarCollapsed, setIsConversationSidebarCollapsed] = useState(false);
  const [selectedPersonaItem, setSelectedPersonaItem] = useState<string | null>(null);
  const [selectedConversationItem, setSelectedConversationItem] = useState<string | null>(null);
  
  // ConversationSidebar 새로고침 트리거
  const [conversationRefreshTrigger, setConversationRefreshTrigger] = useState(0);
  
  // 해석 관련 상태
  const [currentInterpretation, setCurrentInterpretation] = useState<{
    personaId: string;
    personaName: string;
    content: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  } | null>(null);
  
  // 해석 모드 전용 로딩 상태
  const [isInterpretationLoading] = useState(false);
  
  // 해석 저장소 (실제로는 백엔드에서 관리)
  const [interpretationStore, setInterpretationStore] = useState<Record<string, string>>({});

  // 언어화 관련 상태
  const [verbalizationThreads, setVerbalizationThreads] = useState<TrainingThread[]>([]);
  const [selectedVerbalizationThread, setSelectedVerbalizationThread] = useState<TrainingThread | null>(null);

  const {
    // State
    personas,
    globalMessages,
    conversations,
    selectedConversation,
    isLoading,
    error,

    // Actions
    sendInitialMessage,
    continueConversation,
    updateConversation,
    selectPersona,
    clearError,
  } = useChat();

  // 브라우저 히스토리 관리
  const { parseInitialState } = useBrowserHistory({
    selectedPersonaItem,
    selectedConversationItem,
    currentPersonaId: currentInterpretation?.personaId,
    currentPersonaName: currentInterpretation?.personaName,
    onNavigateBack: (state) => {
      console.log('=== 브라우저 뒤로가기 처리 ===');
      console.log('복원할 상태:', state);
      
      // 상태 복원
      setSelectedPersonaItem(state.selectedPersonaItem);
      setSelectedConversationItem(state.selectedConversationItem);
      
      // 페르소나 선택 복원
      if (state.personaId && personas[state.personaId]) {
        selectPersona(state.personaId);
        
        // 해석 상태 복원이 필요한 경우
        const existingInterpretation = interpretationStore[state.personaId];
        if (existingInterpretation) {
          setCurrentInterpretation({
            personaId: state.personaId,
            personaName: personas[state.personaId].name,
            content: existingInterpretation,
            messages: [
              {
                role: 'assistant',
                content: existingInterpretation,
                timestamp: new Date().toISOString(),
              }
            ],
          });
        }
      }
      
      // 사이드바 상태 조정
      if (state.selectedPersonaItem === 'vault' || state.selectedPersonaItem === 'admin' || state.selectedPersonaItem === 'training') {
        setIsConversationSidebarCollapsed(true);
      } else {
        setIsConversationSidebarCollapsed(false);
      }
    }
  });

  // 초기 로드 시 URL에서 상태 복원
  useEffect(() => {
    const initialState = parseInitialState();
    console.log('=== 초기 상태 복원 ===');
    console.log('URL에서 파싱된 상태:', initialState);
    
    if (initialState.selectedPersonaItem) {
      setSelectedPersonaItem(initialState.selectedPersonaItem);
    }
    
    if (initialState.selectedConversationItem) {
      setSelectedConversationItem(initialState.selectedConversationItem);
    }
    
    if (initialState.personaId && personas[initialState.personaId]) {
      selectPersona(initialState.personaId);
    }
  }, [personas, parseInitialState, selectPersona]);

  // 페르소나 메뉴 아이템 선택 핸들러
  const handleSelectPersonaItem = (itemId: string | null) => {
    // 빈 문자열이면 null로 처리 (관리 모드에서 돌아가기 시)
    const actualItemId = itemId === '' ? null : itemId;
    setSelectedPersonaItem(actualItemId);
    
    // 훈습이나 관리 모드가 아닌 다른 항목 선택 시 원래대로
    if (actualItemId !== 'training' && actualItemId !== 'admin' && actualItemId !== 'vault') {
      setIsConversationSidebarCollapsed(false);
    }
  };

  // 대화 메뉴 아이템 선택 핸들러
  const handleSelectConversationItem = (itemId: string | null) => {
    setSelectedConversationItem(itemId);
    
    // 스레드 선택 시 해당 스레드 데이터 로드 처리
    if (itemId?.includes('-thread-')) {
      console.log('스레드 선택됨:', itemId);
      // 필요시 스레드별 추가 처리 로직
    }
  };

  // 저장고에서 페르소나로 이동 핸들러
  const handleNavigateToPersona = (personaId: string, mode: 'sentence') => {
    const persona = personas[personaId];
    if (!persona) return;

    // 해석이 있는지 확인
    const existingInterpretation = interpretationStore[personaId];
    
    if (existingInterpretation) {
      setCurrentInterpretation({
        personaId,
        personaName: persona.name,
        content: existingInterpretation,
        messages: [
          {
            role: 'assistant',
            content: existingInterpretation,
            timestamp: new Date().toISOString(),
          }
        ],
      });
    }

    // 페르소나 선택 및 모드 전환
    selectPersona(personaId);
    setSelectedPersonaItem(null); // 저장고 모드 해제
    setIsConversationSidebarCollapsed(false);
    
    // 해석 모드로 이동해야 하는지 확인
    const shouldNavigateToInterpretation = sessionStorage.getItem('navigateToInterpretationMode');
    if (shouldNavigateToInterpretation === 'true') {
      sessionStorage.removeItem('navigateToInterpretationMode'); // 사용 후 제거
      setSelectedConversationItem('interpretation');
    } else if (mode === 'sentence') {
      setSelectedConversationItem('sentence');
    }
  };

  // 저장고에서 페르소나로 이동 핸들러 (선택된 문장과 함께)
  const handleNavigateToPersonaWithSentence = (personaId: string, mode: 'sentence', selectedSentence: string) => {
    const persona = personas[personaId];
    if (!persona) return;

    // 해석이 있는지 확인
    const existingInterpretation = interpretationStore[personaId];
    
    if (existingInterpretation) {
      setCurrentInterpretation({
        personaId,
        personaName: persona.name,
        content: existingInterpretation,
        messages: [
          {
            role: 'assistant',
            content: existingInterpretation,
            timestamp: new Date().toISOString(),
          }
        ],
      });
    }

    // 페르소나 선택 및 모드 전환
    selectPersona(personaId);
    setSelectedPersonaItem(null); // 저장고 모드 해제
    setIsConversationSidebarCollapsed(false);
    
    // 문장 모드로 이동하면서 선택된 문장을 저장
    if (mode === 'sentence') {
      setSelectedConversationItem('sentence');
      // 선택된 문장을 전역 상태나 로컬 스토리지에 임시 저장
      sessionStorage.setItem('selectedSentenceForInput', selectedSentence);
      console.log('선택된 문장 저장됨:', selectedSentence);
    }
  };

  // 저장고에서 스레드로 이동 핸들러
  const handleNavigateToThread = (threadId: string, threadType: string, interactionMessage?: string) => {
    console.log('=== 저장고에서 스레드로 이동 ===');
    console.log('threadId:', threadId);
    console.log('threadType:', threadType);
    console.log('interactionMessage:', interactionMessage);
    
    // 상호작용 메시지가 있으면 sessionStorage에 저장
    if (interactionMessage) {
      sessionStorage.setItem('selectedSentenceForInput', interactionMessage);
      console.log('상호작용 메시지를 sessionStorage에 저장:', interactionMessage);
    }
    
    // 구형 해석 ID 형태 확인 (예: interpretation_sigmund_freud)
    // 신형은 타임스탬프가 포함되어 있으므로 숫자가 끝에 있는지 확인
    const isLegacyInterpretationId = threadId.startsWith('interpretation_') && 
                                    !threadId.includes('-') && 
                                    !/\d{10,}$/.test(threadId); // 10자리 이상 숫자로 끝나지 않는 경우만 구형
    
    console.log('isLegacyInterpretationId:', isLegacyInterpretationId);
    console.log('타임스탬프 테스트:', /\d{10,}$/.test(threadId));
    
    // 언어화 스레드인 경우
    if (threadType === 'verbalization') {
      console.log('언어화 스레드로 이동');
      setSelectedPersonaItem('verbalization');
      setIsConversationSidebarCollapsed(false);
      
      // 해당 스레드를 찾아서 선택
      const loadAndSelectThread = async () => {
        try {
          const response = await chatApi.getVerbalizationThreads();
          if (response.data) {
            const targetThread = response.data.find((thread: TrainingThread) => thread.id === threadId);
            if (targetThread) {
              console.log('타겟 언어화 스레드 찾음:', targetThread.id);
              setSelectedVerbalizationThread(targetThread);
              setVerbalizationThreads(response.data);
            } else {
              console.warn('타겟 언어화 스레드를 찾을 수 없음:', threadId);
              // 폴백: 첫 번째 스레드 선택
              if (response.data.length > 0) {
                setSelectedVerbalizationThread(response.data[0]);
                setVerbalizationThreads(response.data);
              }
            }
          }
        } catch (error) {
          console.error('언어화 스레드 로딩 오류:', error);
        }
        
        // ConversationSidebar 새로고침
        setConversationRefreshTrigger(prev => prev + 1);
      };
      
      loadAndSelectThread();
      return;
    }
    

    
    // 해석 타입인 경우 특별 처리
    if (threadType === 'interpretation') {
      console.log('해석 타입 스레드 처리:', threadId);
      
      // 해석 스레드의 경우 페르소나 ID를 추출하여 해석 모드로 이동
      const extractPersonaIdFromThreadId = (id: string): string | null => {
        // interpretation_persona_timestamp 형태 또는 interpretation_persona 형태에서 페르소나 ID 추출
        const parts = id.split('_');
        console.log('스레드 ID 파싱:', parts);
        if (parts.length >= 2 && parts[0] === 'interpretation') {
          const extractedPersonaId = parts[1];
          console.log('추출된 페르소나 ID:', extractedPersonaId);
          return extractedPersonaId;  // 페르소나 ID 부분
        }
        return null;
      };
      
      const personaId = extractPersonaIdFromThreadId(threadId);
      console.log('최종 페르소나 ID:', personaId);
      console.log('페르소나 존재 여부:', personaId && personas[personaId]);
      
      if (personaId && personas[personaId]) {
        const persona = personas[personaId];
        console.log('해석 스레드용 페르소나 찾음:', persona.name);
        
        // 해석이 있는지 확인
        const existingInterpretation = interpretationStore[personaId];
        
        if (existingInterpretation) {
          setCurrentInterpretation({
            personaId,
            personaName: persona.name,
            content: existingInterpretation,
            messages: [
              {
                role: 'assistant',
                content: existingInterpretation,
                timestamp: new Date().toISOString(),
              }
            ],
          });
        }

        // 페르소나 선택 및 해석 모드로 이동
        selectPersona(personaId);
        setSelectedPersonaItem(null); // 저장고 모드 해제
        setIsConversationSidebarCollapsed(false);
        setSelectedConversationItem('interpretation');
        
        console.log('해석 모드로 이동 완료');
        
        // ConversationSidebar 새로고침
        setConversationRefreshTrigger(prev => prev + 1);
        
        return;
      } else {
        console.error('해석 스레드에서 페르소나 ID를 찾을 수 없음, 훈습 스레드 탐색으로 폴백:', threadId);
        // 페르소나를 찾지 못하면 훈습 스레드 탐색 로직으로 폴백
      }
    }
    
    // 훈습 스레드인 경우 - 스레드 ID를 통해 해당 스레드를 찾고 페르소나 정보 추출
    const loadAndNavigateToTrainingThread = async () => {
      try {
        console.log('훈습 스레드 정보 로딩 중...');
        
        // 모든 페르소나의 스레드를 검색해서 해당 스레드를 찾기
        let foundThread = null;
        let foundPersonaId = null;
        
        for (const personaId of Object.keys(personas)) {
          try {
            const threadsResponse = await chatApi.getPersonaThreads(personaId);
            if (threadsResponse.data) {
              const targetThread = threadsResponse.data.find(thread => thread.id === threadId);
              if (targetThread) {
                console.log('스레드를 찾음:', targetThread.id, 'in persona:', personaId);
                foundThread = targetThread;
                foundPersonaId = personaId;
                break;
              }
            }
          } catch (error) {
            console.warn(`페르소나 ${personaId}의 스레드 로딩 실패:`, error);
          }
        }
        
        if (!foundThread || !foundPersonaId) {
          console.error('해당 스레드를 찾을 수 없음:', threadId);
          alert('해당 스레드를 찾을 수 없습니다.');
          return;
        }
        
        const persona = personas[foundPersonaId];
        console.log('찾은 페르소나:', persona.name);
        
        // 해석이 있는지 확인
        const existingInterpretation = interpretationStore[foundPersonaId];
        
        if (existingInterpretation) {
          setCurrentInterpretation({
            personaId: foundPersonaId,
            personaName: persona.name,
            content: existingInterpretation,
            messages: [
              {
                role: 'assistant',
                content: existingInterpretation,
                timestamp: new Date().toISOString(),
              }
            ],
          });
        }

        // 페르소나 선택 및 해당 스레드로 이동
        selectPersona(foundPersonaId);
        setSelectedPersonaItem(null); // 저장고 모드 해제
        setIsConversationSidebarCollapsed(false);
        setSelectedConversationItem(`${threadType}-thread-${threadId}`);
        
        console.log('훈습 스레드로 이동 완료:', `${threadType}-thread-${threadId}`);
        
        // ConversationSidebar 새로고침
        setConversationRefreshTrigger(prev => prev + 1);
        
      } catch (error) {
        console.error('훈습 스레드 로딩 오류:', error);
        alert('스레드 정보를 로딩하는 중 오류가 발생했습니다.');
      }
    };
    
    loadAndNavigateToTrainingThread();
  };

  // 페르소나 선택 핸들러 (카테고리에서 페르소나 클릭 시)
  const handlePersonaSelection = (personaId: string) => {
    const persona = personas[personaId];
    if (!persona) return;

    // 해석이 이미 존재하는지 확인
    const existingInterpretation = interpretationStore[personaId];
    
    if (existingInterpretation) {
      // 1) 해석이 있으면 바로 채팅 모드로
      setCurrentInterpretation({
        personaId,
        personaName: persona.name,
        content: existingInterpretation,
        messages: [
          {
            role: 'assistant',
            content: existingInterpretation,
            timestamp: new Date().toISOString(),
          }
        ],
      });
      
      // 페르소나 선택 및 일반 채팅 모드로 전환
      selectPersona(personaId);
      setSelectedPersonaItem(null); // 훈습 모드 해제
      setIsConversationSidebarCollapsed(false);
      setSelectedConversationItem('interpretation');
    } else {
      // 2) 해석이 없으면 생성 과정 진행
      // 팝업은 TrainingCategoryView에서 처리
    }
  };

  // 해석 완료 핸들러 (팝업에서 해석 생성 완료 시)
  const handleInterpretationComplete = async (personaId: string, interpretation: string) => {
    const persona = personas[personaId];
    
    // 해석을 저장소에 저장
    setInterpretationStore(prev => ({
      ...prev,
      [personaId]: interpretation
    }));
    
    // 현재 해석 설정 (해석을 첫 번째 Assistant 메시지로)
    setCurrentInterpretation({
      personaId,
      personaName: persona?.name || '',
      content: interpretation,
      messages: [
        {
          role: 'assistant',
          content: interpretation,
          timestamp: new Date().toISOString(),
        }
      ],
    });
    
    // 페르소나 선택 및 일반 채팅 모드로 전환
    selectPersona(personaId);
    setSelectedPersonaItem(null); // 훈습 모드 해제
    setIsConversationSidebarCollapsed(false);
    setSelectedConversationItem('interpretation');

    // ConversationSidebar 새로고침 트리거 (나아가기와 문장은 이미 자동 생성됨)
    setConversationRefreshTrigger(prev => prev + 1);
  };

  // 해석 채팅 메시지 전송 핸들러 (더미 함수 - InterpretationView에서 직접 처리)
  const handleInterpretationMessage = async (message: string): Promise<boolean> => {
    console.log('MainLayout의 handleInterpretationMessage는 더 이상 사용되지 않습니다. InterpretationView에서 직접 처리합니다.');
    return true;
  };

  // 해석 업데이트 핸들러
  const handleUpdateInterpretation = (updatedInterpretation: {
    personaId: string;
    personaName: string;
    content: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  }) => {
    setCurrentInterpretation(updatedInterpretation);
  };

  // 대화 업데이트 핸들러
  const handleUpdateConversation = (updatedConversation: any) => {
    if (selectedConversation) {
      updateConversation(selectedConversation, updatedConversation);
    }
  };

  // 대화 모드 전환 핸들러
  const handleSwitchConversationMode = (mode: string) => {
    setSelectedConversationItem(mode);
  };

  // ConversationSidebar 새로고침 핸들러
  const handleRefreshConversationSidebar = () => {
    setConversationRefreshTrigger(prev => prev + 1);
  };

  // 최근 상호작용에서 페르소나 선택 핸들러
  const handleRecentPersonaSelect = (personaId: string) => {
    const persona = personas[personaId];
    if (!persona) return;

    // 해석이 이미 존재하는지 확인
    const existingInterpretation = interpretationStore[personaId];
    
    if (existingInterpretation) {
      // 해석이 있으면 바로 해석 모드로
      setCurrentInterpretation({
        personaId,
        personaName: persona.name,
        content: existingInterpretation,
        messages: [
          {
            role: 'assistant',
            content: existingInterpretation,
            timestamp: new Date().toISOString(),
          }
        ],
      });
    
      // 페르소나 선택 및 해석 모드로 전환
      selectPersona(personaId);
      setSelectedPersonaItem(null); // 최근 상호작용 모드 해제
      setIsConversationSidebarCollapsed(false);
      setSelectedConversationItem('interpretation');
    } else {
      // 해석이 없으면 훈습 모드로 전환
      setSelectedPersonaItem('training');
    }
  };

  // 최근 상호작용에서 스레드 선택 핸들러
  const handleRecentThreadSelect = async (thread: TrainingThread, personaId: string) => {
    console.log('=== 최근 상호작용 스레드 선택 ===');
    console.log('thread:', thread);
    console.log('personaId:', personaId);
    console.log('thread.thread_type:', thread.thread_type);
    
    // 언어화 스레드인 경우 언어화 모드로 전환
    if (personaId === 'verbalization' || thread.thread_type === 'verbalization') {
      console.log('언어화 스레드로 인식, 언어화 모드 전환');
      setSelectedPersonaItem('verbalization');
      setSelectedVerbalizationThread(thread);
      setIsConversationSidebarCollapsed(false);
      // ConversationSidebar가 업데이트되도록 트리거
      setConversationRefreshTrigger(prev => prev + 1);
      return;
    }

    const persona = personas[personaId];
    if (!persona) {
      console.error('페르소나를 찾을 수 없음:', personaId);
      return;
    }

    // 해석 스레드인 경우 실제 스레드 내용을 로딩
    if (thread.thread_type === 'interpretation') {
      console.log('해석 스레드 선택됨, 스레드 내용 로딩 중...');
      
      try {
        // 해석 스레드의 실제 내용과 메시지들을 설정
        const interpretationContent = thread.content || (thread.messages.length > 0 ? thread.messages[0].content : '');
        
        setCurrentInterpretation({
          personaId,
          personaName: persona.name,
          content: interpretationContent,
          messages: thread.messages || [],
        });
        
        // 페르소나 선택 및 해당 스레드 모드로 전환
        selectPersona(personaId);
        setSelectedPersonaItem(null); // 최근 상호작용 모드 해제
        setIsConversationSidebarCollapsed(false);
        setSelectedConversationItem(`${thread.thread_type}-thread-${thread.id}`);
        
        console.log('해석 스레드 로딩 완료:', thread.id);
      } catch (error) {
        console.error('해석 스레드 로딩 중 오류:', error);
        // 폴백으로 기존 해석 사용
        const existingInterpretation = interpretationStore[personaId];
        if (existingInterpretation) {
          setCurrentInterpretation({
            personaId,
            personaName: persona.name,
            content: existingInterpretation,
            messages: [
              {
                role: 'assistant',
                content: existingInterpretation,
                timestamp: new Date().toISOString(),
              }
            ],
          });
        }
        
        selectPersona(personaId);
        setSelectedPersonaItem(null);
        setIsConversationSidebarCollapsed(false);
        setSelectedConversationItem(`${thread.thread_type}-thread-${thread.id}`);
      }
      return;
    }

    // 해석이 아닌 다른 스레드 타입들 (나아가기, 문장)
    const existingInterpretation = interpretationStore[personaId];
    
    if (existingInterpretation) {
      // 해석이 있으면 바로 해석 모드로
      setCurrentInterpretation({
        personaId,
        personaName: persona.name,
        content: existingInterpretation,
        messages: [
          {
            role: 'assistant',
            content: existingInterpretation,
            timestamp: new Date().toISOString(),
          }
        ],
      });
      
      // 페르소나 선택 및 해당 스레드 모드로 전환
      selectPersona(personaId);
      setSelectedPersonaItem(null); // 최근 상호작용 모드 해제
      setIsConversationSidebarCollapsed(false);
      setSelectedConversationItem(`${thread.thread_type}-thread-${thread.id}`);
    } else {
      // 해석이 없으면 훈습 모드로 전환
      setSelectedPersonaItem('training');
    }
  };

  // 대화 목록 사이드바 토글 - 두 사이드바 모두 제어 (ConversationSidebar가 표시될 때)
  const toggleConversationSidebar = () => {
    const newCollapsedState = !isConversationSidebarCollapsed;
    setIsConversationSidebarCollapsed(newCollapsedState);
    setIsPersonaSidebarCollapsed(newCollapsedState);
  };

  // 페르소나 사이드바 단독 토글 (ConversationSidebar가 표시되지 않을 때)
  const togglePersonaSidebar = () => {
    setIsPersonaSidebarCollapsed(!isPersonaSidebarCollapsed);
  };

  // 언어화 스레드 로드
  const loadVerbalizationThreads = useCallback(async () => {
    try {
      console.log('=== 언어화 스레드 로드 시작 ===');
      const response = await chatApi.getVerbalizationThreads();
      console.log('스레드 로드 응답:', response);
      
      if (response.data) {
        console.log('로드된 스레드 개수:', response.data.length);
        setVerbalizationThreads(response.data);
        
        // 현재 선택된 스레드가 있는지 확인하고 업데이트
        setSelectedVerbalizationThread(prevSelected => {
          if (prevSelected) {
            const updatedSelectedThread = response.data?.find(
              thread => thread.id === prevSelected.id
            );
            if (updatedSelectedThread) {
              console.log('기존 선택된 스레드 업데이트:', updatedSelectedThread.id);
              return updatedSelectedThread;
            } else {
              console.log('기존 선택된 스레드를 찾을 수 없음, 첫 번째 스레드 선택');
              return response.data?.[0] || null;
            }
          } else if (response.data && response.data.length > 0) {
            // 선택된 스레드가 없으면 첫 번째 스레드를 선택
            console.log('새로운 첫 번째 스레드 선택:', response.data[0].id);
            return response.data[0];
          }
          return null;
        });
      }
      console.log('=== 언어화 스레드 로드 완료 ===');
    } catch (error) {
      console.error('언어화 스레드 로드 오류:', error);
    }
  }, []); // 의존성 배열에서 selectedVerbalizationThread 제거

  // 언어화 모드일 때 스레드 로드
  useEffect(() => {
    if (selectedPersonaItem === 'verbalization') {
      loadVerbalizationThreads();
    }
  }, [selectedPersonaItem, loadVerbalizationThreads]);

  // 언어화 스레드 업데이트 핸들러
  const handleVerbalizationThreadUpdate = async () => {
    console.log('=== 언어화 스레드 업데이트 요청 ===');
    const currentSelectedId = selectedVerbalizationThread?.id;
    
    await loadVerbalizationThreads();
    
    // 업데이트 후에 이전에 선택된 스레드가 여전히 존재하는지 확인
    if (currentSelectedId) {
      // loadVerbalizationThreads가 완료된 후의 최신 verbalizationThreads를 확인해야 하므로
      // 비동기 로직을 위해 setTimeout 사용
      setTimeout(() => {
        const response = chatApi.getVerbalizationThreads();
        response.then(res => {
          if (res.data) {
            const stillExists = res.data.find((thread: TrainingThread) => thread.id === currentSelectedId);
            if (!stillExists) {
              // 선택된 스레드가 더 이상 존재하지 않으면 첫 번째 스레드 선택
              if (res.data.length > 0) {
                setSelectedVerbalizationThread(res.data[0]);
              } else {
                setSelectedVerbalizationThread(null);
              }
              console.log('삭제된 스레드 감지, 선택 변경됨');
            }
          }
        });
      }, 100);
    }
    
    // ConversationSidebar도 새로고침하여 최근 상호작용에 반영
    setConversationRefreshTrigger(prev => prev + 1);
  };

  // 새 언어화 스레드 생성 핸들러
  const handleCreateNewVerbalizationThread = async (): Promise<void> => {
    try {
      console.log('=== 새 언어화 스레드 생성 시작 ===');
      const response = await chatApi.createNewVerbalizationThread();
      
      if (response.data) {
        console.log('새 스레드 생성됨:', response.data.id);
        
        // 1단계: 새로 생성된 스레드를 즉시 선택
        setSelectedVerbalizationThread(response.data);
        
        // 2단계: 스레드 목록에도 추가 (최신 순서로)
        setVerbalizationThreads(prev => [response.data!, ...prev]);
        
        // 3단계: ConversationSidebar도 새로고침하여 최근 상호작용에 반영
        setConversationRefreshTrigger(prev => prev + 1);
        
        console.log('새 스레드 선택 완료:', response.data.id);
      } else {
        console.error('새 스레드 생성 실패:', response.error);
      }
    } catch (error) {
      console.error('새 언어화 스레드 생성 오류:', error);
    }
  };

  // ConversationSidebar 표시 여부 확인
  const shouldShowConversationSidebar = 
    (selectedPersonaItem !== 'training' && selectedPersonaItem !== 'admin' && selectedPersonaItem !== 'verbalization' && selectedPersonaItem !== 'vault' && selectedPersonaItem !== 'stimulus' && currentInterpretation) ||
    selectedPersonaItem === 'recent' ||
    selectedPersonaItem === 'verbalization';

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        {/* 왼쪽 첫 번째 사이드바 - 페르소나 메뉴 */}
        <PersonaSidebar
          selectedItem={selectedPersonaItem}
          onSelectItem={handleSelectPersonaItem}
          isCollapsed={isPersonaSidebarCollapsed}
          onToggle={shouldShowConversationSidebar ? undefined : togglePersonaSidebar}
        />

        {/* 왼쪽 두 번째 사이드바 - 훈습 모드나 관리 모드가 아니고 해석이 있거나 최근 상호작용 모드일 때 표시 */}
        {shouldShowConversationSidebar && (
          <ConversationSidebar
            selectedItem={selectedConversationItem}
            onSelectItem={handleSelectConversationItem}
            isCollapsed={isConversationSidebarCollapsed}
            onToggle={toggleConversationSidebar}
            selectedPersonaName={currentInterpretation?.personaName}
            selectedPersonaId={currentInterpretation?.personaId}
            refreshTrigger={conversationRefreshTrigger}
            mode={selectedPersonaItem === 'recent' ? 'recent' : selectedPersonaItem === 'verbalization' ? 'verbalization' : 'persona'}
            personas={selectedPersonaItem === 'recent' ? personas : undefined}
            verbalizationThreads={selectedPersonaItem === 'verbalization' ? verbalizationThreads : undefined}
            onSelectVerbalizationThread={selectedPersonaItem === 'verbalization' ? setSelectedVerbalizationThread : undefined}
            onRefreshTrigger={selectedPersonaItem === 'verbalization' ? handleVerbalizationThreadUpdate : undefined}
          />
        )}

        {/* 메인 영역 - 저장고/자극 모드일 때는 각각의 뷰, 그 외에는 채팅 영역 */}
        {selectedPersonaItem === 'vault' ? (
          <VaultView
            personas={personas}
            onNavigateToPersona={handleNavigateToPersona}
            onNavigateToThread={handleNavigateToThread}
            onNavigateToPersonaWithSentence={handleNavigateToPersonaWithSentence}
          />
        ) : selectedPersonaItem === 'stimulus' ? (
          <StimulusView
            personas={personas}
          />
        ) : (
        <ChatArea
          selectedConversation={selectedConversation}
          conversations={conversations}
          personas={personas}
          globalMessages={globalMessages}
          isLoading={currentInterpretation ? isInterpretationLoading : isLoading}
          error={error}
          onSendInitialMessage={sendInitialMessage}
          onContinueConversation={continueConversation}
          onClearError={clearError}
          selectedPersonaItem={selectedPersonaItem}
          onSelectPersona={handlePersonaSelection}
          onInterpretationComplete={handleInterpretationComplete}
          selectedConversationItem={selectedConversationItem}
          currentInterpretation={currentInterpretation}
          onInterpretationMessage={handleInterpretationMessage}
          onUpdateInterpretation={handleUpdateInterpretation}
          onUpdateConversation={handleUpdateConversation}
          onSwitchConversationMode={handleSwitchConversationMode}
          onRefreshConversationSidebar={handleRefreshConversationSidebar}
          conversationRefreshTrigger={conversationRefreshTrigger}
            recentInteractionsProps={{
              personas,
              onSelectPersona: handleRecentPersonaSelect,
              onThreadSelect: handleRecentThreadSelect,
            }}
            verbalizationProps={{
              selectedThread: selectedVerbalizationThread,
              threads: verbalizationThreads,
              onThreadUpdate: handleVerbalizationThreadUpdate,
              onCreateNewThread: handleCreateNewVerbalizationThread,
            }}
        />
        )}
      </AppContainer>
    </>
  );
};

export default MainLayout;
