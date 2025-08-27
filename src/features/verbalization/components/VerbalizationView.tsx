import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { TrainingThread } from '../../shared/types';
import { chatApi } from '../../shared/api/chatApi';
import MessageInput, { MessageInputRef } from '../../shared/components/MessageInput';
import Message from '../../shared/components/Message';
import SelectableMessage from '../../training/components/SelectableMessage';
import LoadingMessage from '../../shared/components/LoadingMessage';
import FloatingActionButton from '../../shared/components/FloatingActionButton';
import { sentenceApi } from '../../training/api/sentenceApi';
import { useSentenceMenu } from '../../shared/hooks/useSentenceMenu';
import { useSentenceData } from '../../shared/hooks/useSentenceData';

interface VerbalizationViewProps {
  selectedThread: TrainingThread | null;
  threads: TrainingThread[];
  onThreadUpdate: () => void;
  onCreateNewThread: () => Promise<void>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
`;

const HeaderTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #343a40;
  margin: 0;
`;

const NewThreadButton = styled.button`
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.2);

  &:hover {
    background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(108, 117, 125, 0.2);
  }
`;

const ChatSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ChatInputSection = styled.div`
  padding: 16px 20px;
  border-top: none;
  background: #ffffff;
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

// 토스트 스타일 컴포넌트 추가
const Toast = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #6c757d;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transform: ${props => props.$show ? 'translateX(0)' : 'translateX(120%)'};
  transition: transform 0.3s ease;
  font-size: 14px;
  font-weight: 500;
`;

const VerbalizationView: React.FC<VerbalizationViewProps> = ({
  selectedThread,
  threads,
  onThreadUpdate,
  onCreateNewThread
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  
  // 문장선택 관련 상태 추가
  const [isSentenceModeActive, setIsSentenceModeActive] = useState(false);
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(new Set());
  const [highlightedSentences, setHighlightedSentences] = useState<Set<string>>(new Set());
  const [memos, setMemos] = useState<Record<string, string>>({});
  
  // 텍스트 선택 관련 상태
  const [selectedText, setSelectedText] = useState('');
  const [showFAB, setShowFAB] = useState(false);
  
  // 로컬 메시지 상태 - 사용자 메시지를 즉시 UI에 반영하기 위함
  const [localMessages, setLocalMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    persona_name?: string;
  }>>([]);

  // useSentenceData 훅 사용
  const sentenceDataHook = useSentenceData(selectedThread?.id);

  // 스레드별 문장 데이터 로딩 (백엔드 API만 사용)
  const loadThreadSentenceData = async (threadId: string) => {
    try {
      console.log('=== 언어화 스레드 데이터 로딩 시작 ===');
      console.log('스레드 ID:', threadId);
      
      // 백엔드에서 스레드 데이터 로딩
      const data = await sentenceApi.getThreadSentenceData(threadId);
      
      console.log('로딩된 메모:', Object.keys(data.memos).length, '개');
      console.log('로딩된 하이라이트:', data.highlights.length, '개');
      
      // 백엔드 데이터로 상태 설정
      setMemos(data.memos);
      setHighlightedSentences(new Set(data.highlights));
      
      console.log('=== 언어화 스레드 데이터 로딩 완료 ===');
    } catch (error) {
      console.error('스레드 문장 데이터 로딩 실패:', error);
      // 실패 시 빈 상태로 초기화
      setMemos({});
      setHighlightedSentences(new Set());
    }
  };

  // selectedThread가 변경될 때 localMessages 동기화 및 스레드 데이터 로딩
  useEffect(() => {
    console.log('=== 언어화 selectedThread 변경 ===');
    console.log('selectedThread:', selectedThread);
    console.log('selectedThread.messages:', selectedThread?.messages);
    
    if (selectedThread) {
      // 스레드 메시지들을 localMessages로 동기화 (깊은 복사)
      const threadMessages = selectedThread.messages || [];
      console.log('스레드 메시지들:', threadMessages.map(m => ({ role: m.role, content: m.content?.substring(0, 50) + '...', timestamp: m.timestamp })));
      
      // 깊은 복사로 메시지 동기화하여 참조 문제 방지
      setLocalMessages([...threadMessages]);
      
      // 스레드별 문장 데이터 로딩
      loadThreadSentenceData(selectedThread.id);
    } else {
      console.log('selectedThread가 없음 - localMessages 초기화');
      setLocalMessages([]);
      // 스레드가 없으면 데이터 초기화
      setMemos({});
      setHighlightedSentences(new Set());
    }
  }, [selectedThread, selectedThread?.messages]);

  // 스크롤을 맨 아래로 이동 - localMessages 기준으로 변경
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [localMessages, isLoading]);

  // 메시지 전송 처리
  const handleSendMessage = async (message: string): Promise<boolean> => {
    if (!message.trim() || isLoading) return false;

    // 1단계: 사용자 메시지를 즉시 UI에 추가
    const userMessage = {
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setLocalMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('=== 언어화 메시지 전송 ===');
      console.log('selectedThread:', selectedThread);
      console.log('message:', message);

      // 2단계: API 호출
      const response = await chatApi.chatWithVerbalization(
        message,
        selectedThread?.id
      );

      if (response.data && response.data.success) {
        // 3단계: 백엔드에서 업데이트된 스레드 정보로 부모 컴포넌트 동기화
        console.log('스레드 업데이트 시작');
        await onThreadUpdate();
        console.log('스레드 업데이트 완료');
        
        // 4단계: 로컬 메시지도 즉시 업데이트 (빠른 UI 응답)
        if (response.data.thread && response.data.thread.messages) {
          console.log('로컬 메시지 즉시 업데이트');
          setLocalMessages([...response.data.thread.messages]);
        }
        
        return true;
      } else {
        // 실패 시 사용자 메시지 제거
        setLocalMessages(prev => prev.slice(0, -1));
        console.error('메시지 전송 실패:', response.error);
        showCopyToast(`언어화 채팅 실패: ${response.error}`);
        return false;
      }
    } catch (error) {
      // 오류 시 사용자 메시지 제거
      setLocalMessages(prev => prev.slice(0, -1));
      console.error('메시지 전송 오류:', error);
      showCopyToast(`네트워크 오류: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 새 스레드 생성 처리
  const handleCreateNewThread = async () => {
    try {
      console.log('=== 새 스레드 생성 시작 ===');
      
      // 1단계: 로컬 메시지 초기화 (새 대화 준비)
      setLocalMessages([]);
      
      // 2단계: 새 스레드 생성
      console.log('새 스레드 생성 중...');
      
      // 3단계: 상위 컴포넌트에 새 스레드 생성 요청
      await onCreateNewThread();
      
      // 4단계: 성공 메시지 표시
      showCopyToast('새 대화가 시작되었습니다!');
      
      console.log('새 스레드 생성 및 선택 완료');
    } catch (error) {
      console.error('새 스레드 생성 오류:', error);
      showCopyToast('새 대화 생성에 실패했습니다.');
    }
  };

  // 토스트 메시지 표시 함수
  const showCopyToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 텍스트 복사 유틸리티 함수
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showCopyToast(successMessage);
    } catch (error) {
      console.error('복사 실패:', error);
      showCopyToast('복사 실패');
    }
  };

  // 메시지 복사 기능
  const handleCopyMessage = async (messageContent: string) => {
    await copyToClipboard(messageContent, '메시지가 복사되었습니다');
  };

  // 메시지 수정 관련 함수들
  const handleStartEdit = (messageIndex: number) => {
    setEditingMessageIndex(messageIndex);
  };

  const handleEditMessage = async (messageIndex: number, newContent: string) => {
    // 언어화에서는 메시지 수정 기능을 제공하지 않음
    // 필요시 추후 구현
    return false;
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
  };

  // 텍스트 선택 핸들러
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setSelectedText(selectedText);
      setShowFAB(true);
    } else {
      setSelectedText('');
      setShowFAB(false);
    }
  };

  // 선택 해제 핸들러
  const handleClearSelection = () => {
    setSelectedText('');
    setShowFAB(false);
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  // FloatingActionButton 메뉴 액션 핸들러
  const handleFABMenuAction = async (action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy') => {
    switch (action) {
      case 'sendToInput':
        if (messageInputRef.current && selectedText) {
          messageInputRef.current.insertText(selectedText);
          showCopyToast('선택한 텍스트가 입력창에 추가되었습니다');
        }
        break;
      
      case 'copy':
        if (selectedText) {
          await copyToClipboard(selectedText, '선택한 텍스트가 복사되었습니다');
        }
        break;
      
      case 'saveToVault':
        // 언어화에서도 저장고 기능 제공
        if (selectedText) {
          try {
            console.log('=== 언어화 텍스트 선택 저장고 저장 시작 ===');
            console.log('선택된 텍스트:', selectedText);
            console.log('선택된 스레드:', selectedThread?.id);
            
            if (!selectedThread?.id) {
              console.warn('선택된 스레드가 없습니다');
              showCopyToast('저장할 스레드를 선택해주세요');
              break;
            }
            
            const saveRequest = {
              sentences: [selectedText],
              source_message_id: 'verbalization_text_selection',
              source_conversation_id: selectedThread.id,
              source_thread_id: selectedThread.id,
              source_thread_type: 'verbalization',
              tags: ['verbalization', 'text_selection']
            };
            
            console.log('텍스트 선택 저장 요청:', saveRequest);
            
            const response = await sentenceApi.saveSentencesToVault(saveRequest);
            console.log('텍스트 선택 저장 응답:', response);
            
            console.log('=== 언어화 텍스트 선택 저장고 저장 완료 ===');
            showCopyToast('저장고에 저장되었습니다');
          } catch (error) {
            console.error('=== 언어화 텍스트 선택 저장고 저장 실패 ===', error);
            console.error('오류 세부사항:', {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
            showCopyToast(`저장고 저장에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          console.warn('선택된 텍스트가 없습니다');
          showCopyToast('저장할 텍스트를 선택해주세요');
        }
        break;
      
      case 'addMemo':
        // 언어화에서도 메모 기능 제공
        if (selectedText) {
          try {
            // 선택된 텍스트에 대한 메모 프롬프트
            const memo = prompt('선택한 텍스트에 대한 메모를 입력하세요:', selectedText);
            if (memo) {
              // 간단한 로컬 메모 저장 (실제로는 더 복잡한 로직 필요)
              showCopyToast(`메모가 저장되었습니다: ${memo.substring(0, 30)}${memo.length > 30 ? '...' : ''}`);
            }
          } catch (error) {
            console.error('메모 저장 오류:', error);
            showCopyToast('메모 저장에 실패했습니다');
          }
        }
        break;
      
      case 'highlight':
        // 언어화에서도 하이라이트 기능 제공
        if (selectedText) {
          showCopyToast('텍스트가 하이라이트되었습니다');
        }
        break;
    }
    
    // 액션 실행 후 선택 해제
    handleClearSelection();
  };

  // 채팅 메시지 영역에 이벤트 리스너 등록
  useEffect(() => {
    const chatElement = chatMessagesRef.current;
    if (chatElement) {
      const handleMouseUp = () => {
        setTimeout(handleTextSelection, 10); // 약간의 지연을 주어 selection이 완료된 후 처리
      };

      chatElement.addEventListener('mouseup', handleMouseUp);
      chatElement.addEventListener('touchend', handleMouseUp);

      return () => {
        chatElement.removeEventListener('mouseup', handleMouseUp);
        chatElement.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, []);

  // 다른 곳 클릭 시 선택 해제
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // FAB나 메시지 영역이 아닌 곳 클릭 시 선택 해제
      if (chatMessagesRef.current && !chatMessagesRef.current.contains(target) && !target.closest('[data-fab]')) {
        handleClearSelection();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 문장 선택 관련 핸들러들
  const handleToggleSelect = (sentenceId: string) => {
    console.log('handleToggleSelect 시작:', sentenceId);
    console.log('현재 selectedSentences:', Array.from(selectedSentences));
    
    setSelectedSentences(prev => {
      const newSet = new Set(prev);
      const wasSelected = newSet.has(sentenceId);
      
      if (wasSelected) {
        newSet.delete(sentenceId);
        console.log('문장 선택 해제:', sentenceId);
      } else {
        newSet.add(sentenceId);
        console.log('문장 선택 추가:', sentenceId);
      }
      
      console.log('새로운 selectedSentences:', Array.from(newSet));
      return newSet;
    });
  };

  const handleMemoChange = async (sentenceId: string, memo: string) => {
    console.log('=== 언어화 메모 저장 시작: 디버깅 강화 ===');
    console.log('Sentence ID:', sentenceId);
    console.log('Memo:', memo);

    const [timestamp, messageIndexStr, sentenceIndexStr] = sentenceId.split('_');
    const messageIndex = parseInt(messageIndexStr);
    const sentenceIndex = parseInt(sentenceIndexStr);
    console.log('Parsed Info:', { timestamp, messageIndex, sentenceIndex });
    
    let sentenceContent = '';
    
    // 타임스탬프와 인덱스를 모두 사용하여 메시지를 더 정확하게 찾습니다.
    const message = localMessages.find((msg, idx) => 
      (msg.timestamp === timestamp || idx === messageIndex) && msg.role === 'assistant'
    );

    console.log('전체 localMessages 타임스탬프 목록:');
    localMessages.forEach((m, i) => console.log(`- [${i}] ${m.timestamp}`));
    
      if (message) {
      console.log('메시지 찾음:', message.content.substring(0, 50) + '...');
        const sentences = message.content.split(/[\n.]+/).map(s => s.trim()).filter(s => s.length > 0);
      if (sentenceIndex < sentences.length) {
        sentenceContent = sentences[sentenceIndex];
        console.log('추출된 원본 문장:', sentenceContent);
      } else {
        console.warn('Sentence index out of bounds.');
      }
    } else {
      console.error('메모할 원본 메시지를 찾지 못했습니다.');
    }
    
    if (!selectedThread?.id) {
      console.error('선택된 스레드가 없음');
      throw new Error('스레드 정보를 찾을 수 없습니다');
    }
    
    try {
      // 개선된 useSentenceData 훅의 handleMemoChange 사용
      if (sentenceDataHook?.handleMemoChange) {
        await sentenceDataHook.handleMemoChange(
          sentenceId, 
          memo, 
          selectedThread.id, 
          'verbalization',
          sentenceContent
        );
      } else {
        // 폴백: 직접 API 호출
        await sentenceApi.createOrUpdateMemo({
          sentence_id: sentenceId,
          thread_id: selectedThread.id,
          thread_type: 'verbalization',
          content: memo,
          sentence_content: sentenceContent,
          source_message_id: 'verbalization_chat',
          // 백엔드 자동 저장을 위한 추가 정보
          persona_id: 'verbalization',
          tags: ['verbalization'],
          source_conversation_id: selectedThread.id,
          source_thread_id: selectedThread.id,
        } as any);
        
        // 성공 시 로컬 상태도 업데이트
        setMemos(prev => ({
          ...prev,
          [sentenceId]: memo
        }));
      }
      
      console.log('언어화 메모 저장 성공');
      showCopyToast('메모가 저장되었습니다');
    } catch (error) {
      console.error('메모 저장 실패:', error);
      showCopyToast('메모 저장에 실패했습니다');
      throw error;
    }
  };

  const handleDeleteMemo = async (sentenceId: string) => {
    try {
      // 백엔드 API 호출
      await sentenceApi.deleteMemo(sentenceId);
      
      // 성공 시 로컬 상태 업데이트
      setMemos(prev => {
        const newMemos = { ...prev };
        delete newMemos[sentenceId];
        return newMemos;
      });
      
      setHighlightedSentences(prev => {
        const newSet = new Set(prev);
        newSet.delete(sentenceId);
        return newSet;
      });
      
      showCopyToast('메모가 삭제되었습니다');
    } catch (error) {
      console.error('메모 삭제 실패:', error);
      showCopyToast('메모 삭제에 실패했습니다');
    }
  };

  // 새로운 통합된 메뉴 액션 훅 사용
  const verbalizationMenuActions = useSentenceMenu({
    personaId: 'verbalization',
    threadType: 'verbalization',
    selectedThread,
    memos,
    highlightedSentences,
    setMemos,
    setHighlightedSentences
  });

  // FloatingActionButton 메뉴 액션 처리 (문장선택 모드용)
  const handleMenuAction = async (action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy') => {
    const selectedIds = Array.from(selectedSentences);
    
    console.log('=== 언어화 handleMenuAction 시작 ===');
    console.log('액션:', action);
    console.log('선택된 ID들:', selectedIds);
    console.log('selectedThread 메시지 수:', selectedThread?.messages?.length || 0);
    console.log('로컬 메시지 수:', localMessages.length);
    
    // 선택된 문장들의 텍스트를 추출
    const selectedTexts: string[] = [];
    const filteredSelectedIds: string[] = [];
    
    // selectedThread가 있으면 우선 사용, 없으면 localMessages 사용
    const messagesToUse = selectedThread?.messages || localMessages;
    console.log('사용할 메시지 배열:', messagesToUse.length > 0 ? '선택된 스레드 메시지' : '로컬 메시지');
    
    selectedIds.forEach(id => {
      console.log('처리 중인 ID:', id);
      const [timestamp, messageIndexStr, sentenceIndexStr] = id.split('_');
      const messageIndex = parseInt(messageIndexStr);
      const sentenceIndex = parseInt(sentenceIndexStr);
      
      console.log('파싱된 정보:', { timestamp, messageIndex, sentenceIndex });
      
      // 메시지 찾기 - 먼저 messageIndex로 시도
      let message = null;
      if (!isNaN(messageIndex) && messageIndex >= 0 && messageIndex < messagesToUse.length) {
        message = messagesToUse[messageIndex];
        console.log('messageIndex로 찾은 메시지:', message ? `${message.role}: ${message.content.substring(0, 30)}...` : '없음');
      }
      
      // messageIndex로 안 되면 timestamp로 시도
      if (!message) {
        message = messagesToUse.find(m => m.timestamp === timestamp);
        console.log('timestamp로 찾은 메시지:', message ? `${message.role}: ${message.content.substring(0, 30)}...` : '없음');
      }
      
      if (message && message.role === 'assistant') {
        // 문장 분할
        const sentences = message.content
          .split(/[\n.]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        const text = sentences[sentenceIndex] || '';
        console.log('선택된 문장 텍스트:', text);
        
        if (text && text.length > 0) {
          selectedTexts.push(text);
          filteredSelectedIds.push(id);
          console.log('유효한 문장 추가됨:', text);
        }
      } else if (message && message.role === 'user') {
        console.log('무시됨 - user 메시지');
      } else {
        console.warn('메시지를 찾을 수 없음:', { id, messageIndex, timestamp });
      }
    });
    
    console.log('최종 선택된 텍스트들:', selectedTexts);
    console.log('최종 필터링된 ID들:', filteredSelectedIds);

    switch (action) {
      case 'sendToInput':
        if (messageInputRef.current && selectedTexts.length > 0) {
          const formattedText = selectedTexts.map(text => `"${text}"`).join(', ');
          messageInputRef.current.insertText(formattedText);
        }
        break;
      
      case 'saveToVault':
        try {
          if (selectedTexts.length === 0) {
            showCopyToast('assistant 메시지만 저장할 수 있습니다');
            break;
          }
          
          if (!selectedThread?.id) {
            showCopyToast('저장할 스레드를 선택해주세요');
            break;
          }
          
          // 하이라이트/메모 상태 수집
          const highlightStates: boolean[] = [];
          const highlightColors: (string | null)[] = [];
          const memoContents: (string | null)[] = [];
          
          for (const sentenceId of filteredSelectedIds) {
            const isHighlighted = highlightedSentences.has(sentenceId);
            const memoContent = memos[sentenceId] || null;
            
            highlightStates.push(isHighlighted);
            highlightColors.push(isHighlighted ? 'yellow' : null);
            memoContents.push(memoContent);
          }

          await sentenceApi.saveSentencesToVault({
            sentences: selectedTexts,
            source_message_id: 'verbalization_chat',
            source_conversation_id: selectedThread.id,
            source_thread_id: selectedThread.id,
            source_thread_type: 'verbalization',
            source_sentence_ids: filteredSelectedIds,
            tags: ['verbalization'],
            highlight_states: highlightStates,
            highlight_colors: highlightColors,
            memo_contents: memoContents
          });
          
          // 백엔드에 하이라이트 저장
          if (selectedThread?.id) {
            for (const sentenceId of filteredSelectedIds) {
              try {
                await sentenceApi.createHighlight({
                  sentence_id: sentenceId,
                  thread_id: selectedThread.id,
                  thread_type: 'verbalization'
                });
              } catch (highlightError) {
                console.warn('하이라이트 저장 실패:', sentenceId, highlightError);
              }
            }
          }
          
          // 로컬 상태 업데이트
          setHighlightedSentences(prev => {
            const newSet = new Set(prev);
            filteredSelectedIds.forEach(id => newSet.add(id));
            return newSet;
          });
          
          showCopyToast('저장고에 저장되었습니다');
        } catch (error) {
          console.error('저장고 저장 실패:', error);
          showCopyToast('저장고 저장에 실패했습니다');
        }
        break;
      
      case 'addMemo':
        // 새로운 통합된 메뉴 액션 사용
        await verbalizationMenuActions.handleAddMemo(filteredSelectedIds, selectedTexts);
        break;
      
      case 'highlight':
        if (filteredSelectedIds.length > 0 && selectedThread?.id) {
          try {
            const currentlyHighlighted = filteredSelectedIds.filter(id => highlightedSentences.has(id));
            
            if (currentlyHighlighted.length > 0) {
              // 하이라이트 제거
              setHighlightedSentences(prev => {
                const newSet = new Set(prev);
                filteredSelectedIds.forEach(id => newSet.delete(id));
                return newSet;
              });
              
              // 백엔드에서 하이라이트 삭제
              for (const sentenceId of filteredSelectedIds) {
                try {
                  await sentenceApi.deleteHighlight(sentenceId);
                } catch (error) {
                  console.warn('백엔드 하이라이트 삭제 실패:', error);
                }
              }
              
              showCopyToast('하이라이트가 제거되었습니다');
            } else {
              // 하이라이트 추가
              setHighlightedSentences(prev => {
                const newSet = new Set(prev);
                filteredSelectedIds.forEach(id => newSet.add(id));
                return newSet;
              });
              
              // 백엔드에 하이라이트 저장
              for (const sentenceId of filteredSelectedIds) {
                try {
                  await sentenceApi.createHighlight({
                    sentence_id: sentenceId,
                    thread_id: selectedThread.id,
                    thread_type: 'verbalization'
                  });
                } catch (error) {
                  console.warn('백엔드 하이라이트 저장 실패:', error);
                }
              }
              
              showCopyToast('하이라이트가 추가되었습니다');
            }
          } catch (error) {
            console.error('하이라이트 토글 실패:', error);
            showCopyToast('하이라이트 처리에 실패했습니다');
          }
        }
        break;
      
      case 'copy':
        if (selectedTexts.length > 0) {
          await copyToClipboard(selectedTexts.join(' '), '선택된 문장이 복사되었습니다');
        }
        break;
    }

    // 모든 선택 해제
    setSelectedSentences(new Set());
  };

  // 문장선택 모드 토글
  const handleToggleSentenceMode = () => {
    setIsSentenceModeActive(prev => !prev);
  };

  return (
    <Container>
      {/* 헤더 */}
      <HeaderSection>
        <HeaderTitle>언어화</HeaderTitle>
        <NewThreadButton onClick={handleCreateNewThread}>
          새 대화 시작
        </NewThreadButton>
      </HeaderSection>

      {/* 채팅 영역 */}
      <ChatSection>
        <ChatMessages ref={chatMessagesRef}>
          {localMessages.length === 0 ? (
            <EmptyChat>
              <EmptyIcon>💭</EmptyIcon>
              <div>
                <strong>언어화는 막연하고 뭔지 모를 감정이나 생각을 말로 표현함으로써<br />
                그것을 인식하고 만들어 가는 것입니다.</strong>
                <br /><br />
                자유롭게 당신의 생각을 말로 내뱉으세요!
                <br /><br />
                어떤 것이든 좋습니다. 지금 느끼고 있는 감정이나 생각을 편안하게 말씀해 주세요.
              </div>
            </EmptyChat>
          ) : (
            localMessages.map((message, index) => {
              const isAssistant = message.role === 'assistant';
              
              // assistant 메시지는 항상 SelectableMessage로 렌더링하여 문장 분할과 상호작용 기능 제공
              return isAssistant ? (
                <SelectableMessage
                  key={`${message.role}-${index}`}
                  message={message}
                  messageIndex={index}
                  personas={{}}
                  selectedSentences={isSentenceModeActive ? selectedSentences : new Set()}
                  highlightedSentences={highlightedSentences}
                  memos={memos}
                  onToggleSelect={isSentenceModeActive ? handleToggleSelect : () => {}}
                  onMemoChange={handleMemoChange}
                  onDeleteMemo={handleDeleteMemo}
                  showSentenceSelector={isSentenceModeActive}
                  showActionButtons={true}
                  onCopy={() => handleCopyMessage(message.content)}
                  // 언어화에서는 해, 나, 문 버튼 비활성화
                  onSunAction={() => {}}
                  onPersonAction={() => {}}
                  onDocumentAction={() => {}}
                />
              ) : (
                <Message
                  key={`${message.role}-${index}`}
                  message={message}
                  personas={{}}
                  showActionButtons={true}
                  showThreeActionButtons={false}
                  onCopy={() => handleCopyMessage(message.content)}
                  onEdit={message.role === 'user' ? () => handleStartEdit(index) : undefined}
                  onEditSave={(newContent) => handleEditMessage(index, newContent)}
                  onEditCancel={handleCancelEdit}
                  isEditing={editingMessageIndex === index}
                />
              );
            })
          )}
          
          {/* 로딩 메시지 */}
          {isLoading && (
            <LoadingMessage 
              personaName="언어화 도우미"
              personaColor="#666"
            />
          )}
        </ChatMessages>

        {/* 입력창 */}
        <ChatInputSection>
          <MessageInput
            ref={messageInputRef}
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder="언어화는 막연하고 뭔지 모를 감정이나 생각을 말로 표현함으로써 그것을 인식하고 만들어 가는 것입니다. 자유롭게 당신의 생각을 말로 내뱉으세요!"
            isSentenceModeActive={isSentenceModeActive}
            hasSelectedSentences={selectedSentences.size > 0}
            onToggleSentenceMode={handleToggleSentenceMode}
          />
        </ChatInputSection>
      </ChatSection>

      {/* 토스트 메시지 */}
      <Toast $show={showToast}>
        {toastMessage}
      </Toast>

      {/* FloatingActionButton */}
      <FloatingActionButton
        show={isSentenceModeActive ? selectedSentences.size > 0 : showFAB}
        onMenuAction={isSentenceModeActive ? handleMenuAction : handleFABMenuAction}
        personaId="verbalization"
        currentInterpretation=""
      />
    </Container>
  );
};

export default VerbalizationView; 