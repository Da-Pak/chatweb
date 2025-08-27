import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import MessageInput, { MessageInputRef } from '../../shared/components/MessageInput';
import Message from '../../shared/components/Message';
import SelectableMessage from './SelectableMessage';
import FloatingActionButton from '../../shared/components/FloatingActionButton';
import LoadingMessage from '../../shared/components/LoadingMessage';
import { chatApi } from '../../shared/api/chatApi';
import { TrainingThread } from '../../shared/types';
import { sentenceApi } from '../api/sentenceApi';
import { useSentenceMenu } from '../../shared/hooks/useSentenceMenu';

interface ProceedViewProps {
  personaId: string;
  personaName: string;
  proceedContent: string;
  onRefreshThreads?: () => void;
  onSwitchToMode: (mode: 'interpretation' | 'proceed' | 'sentence') => void;
  onGenerateNewInterpretation: () => void;

  selectedThread: TrainingThread | null;
  threads: TrainingThread[];
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
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
`;

// 토스트 스타일 컴포넌트 추가
const Toast = styled.div<{ show: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  background: #6c757d;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transform: ${props => props.show ? 'translateX(0)' : 'translateX(120%)'};
  transition: transform 0.3s ease;
  font-size: 14px;
  font-weight: 500;
`;

const ProceedView: React.FC<ProceedViewProps> = ({
  personaId,
  personaName,
  proceedContent,
  selectedThread: propSelectedThread,
  onRefreshThreads,
}) => {
  const [selectedThread, setSelectedThread] = useState<TrainingThread | null>(propSelectedThread || null);
  const [isLoading, setIsLoading] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // 문장 선택 관련 상태
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(new Set());
  const [highlightedSentences, setHighlightedSentences] = useState<Set<string>>(new Set());
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [isSentenceModeActive, setIsSentenceModeActive] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);

  // 선택된 스레드 변경 시 스레드별 문장 데이터 로딩 (InterpretationView와 동일)
  useEffect(() => {
    if (propSelectedThread) {
      console.log('=== 나아가기 스레드 변경 시작 ===');
      console.log('새로운 스레드 ID:', propSelectedThread.id);
      console.log('새로운 스레드 메시지 개수:', propSelectedThread.messages?.length || 0);
      
      setSelectedThread(propSelectedThread);
      
      // 스레드별 문장 데이터 로딩
      loadThreadSentenceData(propSelectedThread.id);
      
      console.log('=== 나아가기 스레드 변경 완료 ===');
    } else {
      console.log('선택된 스레드가 해제됨');
      setSelectedThread(null);
      // 스레드가 없으면 상태 초기화
      setMemos({});
      setHighlightedSentences(new Set());
    }
  }, [propSelectedThread]);

  // 스레드별 문장 데이터 로딩 (백엔드 API만 사용)
  const loadThreadSentenceData = async (threadId: string) => {
    try {
      console.log('=== 나아가기 스레드 데이터 로딩 시작 ===');
      console.log('스레드 ID:', threadId);
      
      // 백엔드에서 스레드 데이터 로딩
      const data = await sentenceApi.getThreadSentenceData(threadId);
      
      console.log('로딩된 메모:', Object.keys(data.memos).length, '개');
      console.log('로딩된 하이라이트:', data.highlights.length, '개');
      
      // 백엔드 데이터로 상태 설정
      setMemos(data.memos);
      setHighlightedSentences(new Set(data.highlights));
      
      console.log('=== 나아가기 스레드 데이터 로딩 완료 ===');
    } catch (error) {
      console.error('스레드 문장 데이터 로딩 실패:', error);
      // 실패 시 빈 상태로 초기화
      setMemos({});
      setHighlightedSentences(new Set());
    }
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [selectedThread?.messages]);

  // 메시지 전송 처리 (InterpretationView와 동일한 구조)
  const handleSendMessage = async (message: string): Promise<boolean> => {
    if (!message.trim()) return false;

    // 사용자 메시지를 즉시 추가하여 UI에 표시
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
      persona_id: personaId
    };

    // 먼저 사용자 메시지를 로컬 상태에 추가
    if (selectedThread) {
      const updatedThread = {
        ...selectedThread,
        messages: [...selectedThread.messages, userMessage]
      };
      setSelectedThread(updatedThread);
    }

    // 로딩 상태 시작
    setIsLoading(true);

    try {
      console.log('=== 나아가기 메시지 전송 시작 ===');
      console.log('현재 선택된 스레드:', selectedThread);
      console.log('메시지:', message);

      if (!selectedThread?.id) {
        showCopyToast('선택된 스레드가 없습니다.');
        setIsLoading(false);
        return false;
      }

      // chatWithThread API 사용 (InterpretationView와 동일)
      const response = await chatApi.chatWithThread({
        thread_id: selectedThread.id,
        user_message: message
      });

      console.log('=== 나아가기 API 응답 ===');
      console.log('응답:', response);

      if (response.data && response.data.success) {
        // 백엔드에서 받은 완전한 스레드 데이터로 업데이트
        setSelectedThread(response.data.thread);
        showCopyToast('답변이 생성되었습니다.');
        
        // 스레드 목록 새로고침
        if (onRefreshThreads) {
          onRefreshThreads();
        }
        
        setIsLoading(false);
        return true;
      } else {
        // API 실패 시 사용자 메시지 제거
        if (selectedThread) {
          const revertedThread = {
            ...selectedThread,
            messages: selectedThread.messages.slice(0, -1) // 마지막 사용자 메시지 제거
          };
          setSelectedThread(revertedThread);
        }
        console.error('나아가기 채팅 응답 오류:', response);
        showCopyToast('답변 생성에 실패했습니다.');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      // API 실패 시 사용자 메시지 제거
      if (selectedThread) {
        const revertedThread = {
          ...selectedThread,
          messages: selectedThread.messages.slice(0, -1) // 마지막 사용자 메시지 제거
        };
        setSelectedThread(revertedThread);
      }
      console.error('나아가기 채팅 오류:', error);
      showCopyToast('네트워크 오류가 발생했습니다.');
      setIsLoading(false);
      return false;
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
    if (!selectedThread?.id) {
      showCopyToast('스레드가 선택되지 않았습니다');
      return false;
    }

    try {
      setIsLoading(true);
      
      // 백엔드 API 호출
      const response = await chatApi.editThreadMessage(selectedThread.id, messageIndex, newContent);
      
      if (response.data) {
        // 백엔드에서 TrainingThread 객체를 직접 반환
        const updatedThread = response.data as any; // TrainingThread
        
        // 즉시 로컬 상태 업데이트 (즉시 UI 반영)
        setSelectedThread(updatedThread);
        
        // 부모 컴포넌트 새로고침 (스레드 목록 업데이트)
        onRefreshThreads?.();
        
        setEditingMessageIndex(null);
        showCopyToast('메시지가 수정되고 새로운 응답이 생성되었습니다');
        setIsLoading(false);
        return true;
      } else {
        console.error('메시지 수정 실패:', response.error);
        showCopyToast('메시지 수정에 실패했습니다');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('메시지 수정 오류:', error);
      showCopyToast('메시지 수정 중 오류가 발생했습니다');
      setIsLoading(false);
      return false;
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
  };

  // 문장 선택 관련 함수들
  const handleToggleSelect = (sentenceId: string) => {
    setSelectedSentences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sentenceId)) {
        newSet.delete(sentenceId);
      } else {
        newSet.add(sentenceId);
      }
      return newSet;
    });
  };

  const handleMemoChange = async (sentenceId: string, memo: string) => {
    // sentenceId로부터 실제 문장 내용 찾기
    const [timestamp, , sentenceIndex] = sentenceId.split('_');
    let sentenceContent = '';
    if (selectedThread?.messages) {
      const message = selectedThread.messages.find(m => m.timestamp === timestamp);
      if (message) {
        const sentences = message.content.split(/[\n.]+/).map(s => s.trim()).filter(s => s.length > 0);
        sentenceContent = sentences[parseInt(sentenceIndex)] || '';
      }
    }
    
    try {
      // 기존 메모가 있는지 확인하여 업데이트/생성 구분
      const existingMemo = memos[sentenceId];
      
      // 백엔드 API 호출로 실제 저장 (백엔드 자동 저장을 위한 추가 정보 포함)
      await sentenceApi.createOrUpdateMemo({
        sentence_id: sentenceId,
        thread_id: selectedThread?.id,
        thread_type: 'proceed',
        content: memo,
        sentence_content: sentenceContent,
        source_message_id: `proceed_${personaId}`,
        // 백엔드 자동 저장을 위한 추가 정보
        persona_id: personaId,
        tags: ['proceed', ...(personaId ? [personaId] : [])],
        source_conversation_id: selectedThread?.id,
        source_thread_id: selectedThread?.id,
        // 기존 메모 여부 표시
        is_update: !!existingMemo
      } as any);
      
      // 성공 시 로컬 상태도 업데이트
      setMemos(prev => ({
        ...prev,
        [sentenceId]: memo
      }));
      
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
      
      // 하이라이트도 제거
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
  const proceedMenuActions = useSentenceMenu({
    personaId: personaId || '',
    threadType: 'proceed',
    selectedThread,
    memos,
    highlightedSentences,
    setMemos,
    setHighlightedSentences
  });

  // 액션 핸들러들
  const handleSunAction = async (messageContent: string) => {
    // 전달받은 메시지 내용을 해석 스레드에 저장
    if (!personaId) return;
    
    if (!messageContent) {
      showCopyToast('저장할 메시지 내용이 없습니다');
      return;
    }
    
    try {
      // chatApi를 통해 메시지 내용을 해석 스레드에 저장
      const response = await chatApi.saveCurrentAsInterpretation(personaId, messageContent, selectedThread?.messages);
      
      if (response.data) {
        // 스레드 새로고침
        if (onRefreshThreads) {
          onRefreshThreads();
        }
        showCopyToast('메시지가 해석 스레드에 저장되었습니다');
      } else {
        showCopyToast('해석 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('해석 저장 중 오류:', error);
      showCopyToast('해석 저장에 실패했습니다');
    }
  };

  const handlePersonAction = async (messageContent: string) => {
    // 전달받은 메시지 내용을 나아가기 스레드에 저장
    if (!personaId) return;
    
    if (!messageContent) {
      showCopyToast('저장할 메시지 내용이 없습니다');
      return;
    }
    
    try {
      // chatApi를 통해 메시지 내용을 나아가기 스레드에 저장
      const response = await chatApi.saveCurrentAsProceed(personaId, messageContent, selectedThread?.messages);
      
      if (response.data) {
        // 스레드 새로고침
        if (onRefreshThreads) {
          onRefreshThreads();
        }
        showCopyToast('메시지가 나아가기 스레드에 저장되었습니다');
      } else {
        console.error('나아가기 저장 실패:', response.error);
        showCopyToast('나아가기 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('나아가기 저장 중 오류:', error);
      showCopyToast('나아가기 저장에 실패했습니다');
    }
  };

  const handleDocumentAction = async (messageContent: string) => {
    // 전달받은 메시지 내용을 문장 스레드에 저장
    if (!personaId) return;
      
    if (!messageContent) {
      showCopyToast('저장할 메시지 내용이 없습니다');
      return;
    }
    
    try {
      // chatApi를 통해 메시지 내용을 문장 스레드에 저장
      const response = await chatApi.saveCurrentAsSentence(personaId, messageContent, selectedThread?.messages);
      
      if (response.data) {
        // 스레드 새로고침 (문장 모드로 전환하지 않고 백그라운드에서만 저장)
        if (onRefreshThreads) {
          onRefreshThreads();
        }
        showCopyToast('메시지가 문장 스레드에 저장되었습니다');
      } else {
        console.error('문장 저장 실패:', response.error);
        showCopyToast('문장 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('문장 저장 중 오류:', error);
      showCopyToast('문장 저장에 실패했습니다');
    }
  };

  // 스레드 새로고침 함수 (부모에게 위임)
  const handleRefreshThreads = async () => {
    if (onRefreshThreads) {
      onRefreshThreads();
    }
  };

  // FloatingActionButton 메뉴 액션 처리
  const handleMenuAction = async (action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy') => {
    const selectedIds = Array.from(selectedSentences);
    const selectedTexts = selectedIds.map(id => {
      // sentenceId에서 실제 문장 텍스트를 찾아내는 로직
      const [timestamp, , sentenceIndex] = id.split('_');
      const message = selectedThread?.messages.find(m => m.timestamp === timestamp);
      if (message) {
        const sentences = message.content.split(/[\n.]+/).map(s => s.trim()).filter(s => s.length > 0);
        return sentences[parseInt(sentenceIndex)] || '';
      }
      return '';
    }).filter(text => text.length > 0);

    // 새로운 통합된 메뉴 액션 사용
    await proceedMenuActions.handleMenuAction(action, selectedIds, selectedTexts, messageInputRef);
  };

  // 문장선택 모드 토글
  const handleToggleSentenceMode = () => {
    setIsSentenceModeActive(prev => !prev);
  };

  return (
    <Container>
      <Toast show={showToast}>
        {toastMessage}
      </Toast>
      
      <ChatSection>
        <ChatMessages ref={chatMessagesRef}>
          {(() => {
            // 표시할 메시지 결정: selectedThread 기반으로만 표시 (InterpretationView와 동일)
            const displayMessages = selectedThread?.messages || [];
            
            // 메시지가 없는 경우 빈 채팅 화면 표시
            if (!displayMessages || displayMessages.length === 0) {
              return (
                <EmptyChat>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                  <div>나아가기에 대해 더 자세히 질문해보세요</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {personaName}와 대화를 나눌 수 있습니다
                  </div>
                </EmptyChat>
              );
            }
            
            // 메시지들을 렌더링
            return displayMessages.map((message, index) => 
              message.role === 'user' ? (
                <Message
                  key={`proceed_${index}`}
                  message={{
                    ...message,
                    persona_id: undefined,
                    persona_name: undefined,
                  }}
                  personas={{}}
                  showActionButtons={true}
                  onCopy={() => handleCopyMessage(message.content)}
                  onEdit={() => handleStartEdit(index)}
                  isEditing={editingMessageIndex === index}
                  onEditSave={(newContent) => handleEditMessage(index, newContent)}
                  onEditCancel={handleCancelEdit}
                />
              ) : (
                <SelectableMessage
                  key={`proceed_${index}`}
                  message={{
                    ...message,
                    persona_id: 'current_persona',
                    persona_name: personaName,
                  }}
                  personas={{
                    current_persona: {
                      name: personaName,
                      description: '',
                      color: '#ff9800',
                      prompt: '',
                      category: '',
                      subcategory: ''
                    }
                  }}
                  selectedSentences={isSentenceModeActive ? selectedSentences : new Set()}
                  highlightedSentences={highlightedSentences}
                  memos={memos}
                  onToggleSelect={isSentenceModeActive ? handleToggleSelect : () => {}}
                  onMemoChange={handleMemoChange}
                  onDeleteMemo={handleDeleteMemo}
                  showSentenceSelector={isSentenceModeActive}
                  showActionButtons={true}
                  onCopy={() => handleCopyMessage(message.content)}
                  onSunAction={(messageContent) => handleSunAction(messageContent)}
                  onPersonAction={(messageContent) => handlePersonAction(messageContent)}
                  onDocumentAction={(messageContent) => handleDocumentAction(messageContent)}
                />
              )
            );
          })()}
          
          {isLoading && (
            <LoadingMessage 
              personaName={personaName}
              personaColor="#6c757d"
              customMessage="응답 생성중..."
            />
          )}
        </ChatMessages>

        <ChatInputSection>
          <MessageInput
            ref={messageInputRef}
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder={`${personaName}에게 나아가기에 대해 질문해보세요...`}
            onToggleSentenceMode={handleToggleSentenceMode}
            isSentenceModeActive={isSentenceModeActive}
            hasSelectedSentences={selectedSentences.size > 0}
            currentInterpretation={selectedThread?.content || proceedContent}
            personaId={personaId}
            onGenerateProceed={(messageContent: string) => handlePersonAction(messageContent)}
            onGenerateSentence={(messageContent: string) => handleDocumentAction(messageContent)}
            currentChatMessages={selectedThread?.messages}
            onRefreshThreads={handleRefreshThreads}
          />
        </ChatInputSection>
      </ChatSection>
      
      <FloatingActionButton
        show={isSentenceModeActive && selectedSentences.size > 0}
        onMenuAction={handleMenuAction}
        personaId={personaId}
        currentInterpretation={proceedContent}
      />
    </Container>
  );
};

export default ProceedView;