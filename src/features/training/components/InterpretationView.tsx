import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import MessageInput, { MessageInputRef } from '../../shared/components/MessageInput';
import Message from '../../shared/components/Message';
import SelectableMessage from './SelectableMessage';
import FloatingActionButton from '../../shared/components/FloatingActionButton';
import LoadingMessage from '../../shared/components/LoadingMessage';
import { sentenceApi } from '../api/sentenceApi';
import { TrainingThread } from '../../shared/types';

import { useSentenceMenu } from '../../shared/hooks/useSentenceMenu';
import { useSentenceData } from '../../shared/hooks/useSentenceData';


interface InterpretationViewProps {
  interpretation: string;
  personaName: string;
  onSendMessage: (message: string) => Promise<boolean>;
  onEditMessage?: (messageIndex: number, newContent: string) => Promise<boolean>;
  isLoading: boolean;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  onGenerateNewInterpretation?: () => void;
  onSwitchToMode?: (mode: 'proceed' | 'sentence') => void;
  personaId?: string;
  onRefreshThreads?: () => void;
  selectedThread?: TrainingThread | null; // 나아가기와 동일하게 추가
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

// 복사 알림을 위한 토스트 컴포넌트
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

const InterpretationView: React.FC<InterpretationViewProps> = ({
  interpretation,
  personaName,
  onSendMessage,
  onEditMessage,
  isLoading,
  messages,
  onGenerateNewInterpretation,
  onSwitchToMode,
  personaId,
  onRefreshThreads,
  selectedThread: propSelectedThread,
}) => {
  const [selectedThread, setSelectedThread] = useState<TrainingThread | null>(propSelectedThread || null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  
  // 문장 선택 관련 상태
  const [selectedSentences, setSelectedSentences] = useState<Set<string>>(new Set());
  const [highlightedSentences, setHighlightedSentences] = useState<Set<string>>(new Set());
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [isSentenceModeActive, setIsSentenceModeActive] = useState(false);



  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // 선택된 스레드 변경 시 처리 (나아가기와 동일)
  useEffect(() => {
    if (propSelectedThread) {
      console.log('선택된 해석 스레드 변경:', propSelectedThread.id);
      setSelectedThread(propSelectedThread);
      
      // 스레드별 문장 데이터 로딩
      loadThreadSentenceData(propSelectedThread.id);
    }
  }, [propSelectedThread]);

  // 스레드별 문장 데이터 로딩 (나아가기와 동일한 방식)
  const loadThreadSentenceData = async (threadId: string) => {
      try {
      console.log('=== 해석 스레드 데이터 로딩 시작 ===');
      console.log('스레드 ID:', threadId);
        
      // 백엔드에서 스레드 데이터 로딩
        const data = await sentenceApi.getThreadSentenceData(threadId);
        
      console.log('로딩된 메모:', Object.keys(data.memos).length, '개');
      console.log('로딩된 하이라이트:', data.highlights.length, '개');
        
      // 백엔드 데이터로 상태 설정
          setMemos(data.memos);
          setHighlightedSentences(new Set(data.highlights));
        
        console.log('=== 해석 스레드 데이터 로딩 완료 ===');
      } catch (error) {
      console.error('스레드 문장 데이터 로딩 실패:', error);
        // 실패 시 빈 상태로 초기화
        setMemos({});
        setHighlightedSentences(new Set());
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
      // 대체 복사 방법
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyToast(successMessage);
      } catch (fallbackError) {
        console.error('대체 복사 방법도 실패:', fallbackError);
        showCopyToast('복사 실패');
      }
    }
  };

  // 메시지 복사 기능
  const handleCopyMessage = async (messageContent: string) => {
    await copyToClipboard(messageContent, '메시지가 복사되었습니다');
  };

  // 메시지 수정 시작
  const handleStartEdit = (messageIndex: number) => {
    setEditingMessageIndex(messageIndex);
  };

  // 메시지 수정 완료
  const handleEditMessage = async (messageIndex: number, newContent: string) => {
    if (onEditMessage) {
      const success = await onEditMessage(messageIndex, newContent);
      if (success) {
        setEditingMessageIndex(null);
        showCopyToast('메시지가 수정되었습니다');
      } else {
        showCopyToast('메시지 수정에 실패했습니다');
      }
    }
  };

  // 메시지 수정 취소
  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
  };

  // 문장 선택 핸들러들
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
    console.log('=== 해석 메모 저장 디버깅 ===');
    console.log('문장 ID:', sentenceId);
    console.log('메모 내용:', memo);
    console.log('페르소나 ID:', personaId);
    console.log('selectedThread:', selectedThread?.id);
    
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
    
    console.log('추출된 문장 내용:', sentenceContent);
    
    // 스레드 ID 결정 로직 개선
    let threadIdToUse = selectedThread?.id;
    
    // 스레드가 없는 경우 폴백 로직
    if (!threadIdToUse) {
      // 해석 기반 대화인 경우 기본 스레드 ID 생성
      if (interpretation) {
        threadIdToUse = `interpretation_chat_${personaId}`;
      } else {
        console.warn('스레드 ID를 결정할 수 없음, 메모 저장 중단');
        throw new Error('스레드 정보를 찾을 수 없습니다');
      }
    }
    
    console.log('최종 스레드 ID:', threadIdToUse);
    
    try {
      // 직접 API 호출로 sentence_content도 함께 전달
      // useSentenceData 훅은 sentence_content를 지원하지 않으므로 직접 호출
        await sentenceApi.createOrUpdateMemo({
          sentence_id: sentenceId,
          thread_id: threadIdToUse,
          thread_type: 'interpretation',
          content: memo,
          sentence_content: sentenceContent,
          source_message_id: `interpretation_${personaId}`,
          // 백엔드 자동 저장을 위한 추가 정보
          tags: ['interpretation', ...(personaId ? [personaId] : [])],
          source_conversation_id: threadIdToUse,
          source_thread_id: threadIdToUse,
        } as any);
        
        // 성공 시 로컬 상태도 업데이트
        setMemos(prev => ({
          ...prev,
          [sentenceId]: memo
        }));
      
      console.log('해석 메모 저장 성공');
      showCopyToast('메모가 저장되었습니다');
    } catch (error) {
      console.error('해석 메모 저장 실패:', error);
      showCopyToast('메모 저장에 실패했습니다');
      throw error; // SelectableSentence에서 에러 처리할 수 있도록
    }
    
    console.log('=== 해석 메모 저장 디버깅 끝 ===');
  };

  const handleDeleteMemo = async (sentenceId: string) => {
    try {
      // 로컬 상태에서 메모 삭제
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
      
      // 백엔드 API 호출 (비동기, 실패해도 로컬 삭제는 유지)
      sentenceApi.deleteMemo(sentenceId).catch(error => {
        console.warn('백엔드 메모 삭제 실패 (로컬 삭제는 성공):', error);
      });
      
      showCopyToast('메모가 삭제되었습니다');
    } catch (error) {
      console.error('메모 삭제 실패:', error);
      showCopyToast('메모 삭제에 실패했습니다');
    }
  };

  // 기존 로직을 useSentenceMenu 훅으로 교체
  const sentenceMenuActions = useSentenceMenu({
    personaId: personaId || '',
    threadType: 'interpretation',
    selectedThread,
    memos,
    highlightedSentences,
    setMemos,
    setHighlightedSentences
  });

  // FloatingActionButton 메뉴 액션 처리 (문장선택 모드용)
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
    await sentenceMenuActions.handleMenuAction(action, selectedIds, selectedTexts, messageInputRef);
  };

  // 문장선택 모드 토글
  const handleToggleSentenceMode = () => {
    setIsSentenceModeActive(prev => !prev);
  };

  // 향후 확장을 위한 버튼 핸들러들
  const handleSunAction = async (messageContent: string) => {
    // 전달받은 메시지 내용을 해석 스레드에 저장
    console.log('=== handleSunAction 시작 ===');
    console.log('personaId:', personaId);
    console.log('messageContent:', messageContent.substring(0, 100) + '...');
    
    if (!personaId) {
      console.error('personaId가 없습니다');
      showCopyToast('페르소나 ID를 찾을 수 없습니다');
      return;
    }
    
    if (!messageContent) {
      console.error('저장할 메시지 내용이 없습니다');
      showCopyToast('저장할 메시지 내용이 없습니다');
      return;
    }
    
    try {
      console.log('최종 저장할 내용:', {
        personaId,
        contentLength: messageContent.length,
        contentPreview: messageContent.substring(0, 100) + '...'
      });
      
      // chatApi를 통해 메시지 내용을 해석 스레드에 저장
      const { chatApi } = await import('../../shared/api/chatApi');
      console.log('chatApi 가져옴');
      
      const response = await chatApi.saveCurrentAsInterpretation(personaId, messageContent);
      console.log('API 응답:', response);
      
      if (response.data && response.data.persona_id && response.data.interpretation) {
        console.log('해석 저장 성공:', response.data);
        // 스레드 새로고침
        if (onRefreshThreads) {
          console.log('스레드 새로고침 시작');
          onRefreshThreads();
          console.log('스레드 새로고침 완료');
        }
        showCopyToast('메시지가 해석 스레드에 저장되었습니다');
      } else if (response.error) {
        console.error('API 오류:', response.error);
        showCopyToast(`해석 저장에 실패했습니다: ${response.error}`);
      } else {
        console.error('예상치 못한 응답 구조:', response);
        // 응답이 있지만 예상한 구조가 아닌 경우에도 성공으로 처리
        if (response.data) {
          console.log('응답이 있으므로 성공으로 처리');
          if (onRefreshThreads) {
            console.log('스레드 새로고침 시작');
            onRefreshThreads();
            console.log('스레드 새로고침 완료');
          }
          showCopyToast('메시지가 해석 스레드에 저장되었습니다');
        } else {
          showCopyToast('해석 저장에 실패했습니다');
        }
      }
    } catch (error) {
      console.error('해석 저장 중 예외 발생:', error);
      showCopyToast(`해석 저장에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log('=== handleSunAction 완료 ===');
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
      const { chatApi } = await import('../../shared/api/chatApi');
      const response = await chatApi.saveCurrentAsProceed(personaId, messageContent);
      
      if (response.data) {
        // 스레드 새로고침
        if (onRefreshThreads) {
          onRefreshThreads();
        }
        showCopyToast('메시지가 나아가기 스레드에 저장되었습니다');
      } else {
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
      const { chatApi } = await import('../../shared/api/chatApi');
      const response = await chatApi.saveCurrentAsSentence(personaId, messageContent);
      
      if (response.data) {
        // 스레드 새로고침
        if (onRefreshThreads) {
          onRefreshThreads();
        }
        showCopyToast('메시지가 문장 스레드에 저장되었습니다');
      } else {
        showCopyToast('문장 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('문장 저장 중 오류:', error);
      showCopyToast('문장 저장에 실패했습니다');
    }
  };

  return (
    <Container>
      <Toast show={showToast}>
        {toastMessage}
      </Toast>
      
      <ChatSection>
        <ChatMessages ref={chatMessagesRef}>
          {(() => {
            // 표시할 메시지 결정: selectedThread가 있으면 그것을 우선 사용, 없으면 props의 messages 사용
            const displayMessages = selectedThread && selectedThread.messages.length > 0 
              ? selectedThread.messages 
              : messages;
            
            // 메시지가 없는 경우 빈 채팅 화면 표시
            if (!displayMessages || displayMessages.length === 0) {
              return (
            <EmptyChat>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
              <div>해석에 대해 더 자세히 질문해보세요</div>
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
                  key={`interpretation_${index}`}
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
                  key={`interpretation_${index}`}
                  message={{
                    ...message,
                    persona_id: 'current_persona',
                    persona_name: personaName,
                  }}
                  personas={{
                    current_persona: {
                      name: personaName,
                      description: '',
                      color: '#6c757d',
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
                  onSunAction={handleSunAction}
                  onPersonAction={handlePersonAction}
                  onDocumentAction={handleDocumentAction}
                />
              )
            );
          })()}
          
          {isLoading && (
            <LoadingMessage 
              personaName={personaName}
              personaColor="#6c757d"
            />
          )}
        </ChatMessages>

        <ChatInputSection>
          <MessageInput
            ref={messageInputRef}
            onSendMessage={onSendMessage}
            disabled={isLoading}
            placeholder={`${personaName}에게 해석에 대해 질문해보세요...`}
            onToggleSentenceMode={handleToggleSentenceMode}
            isSentenceModeActive={isSentenceModeActive}
            hasSelectedSentences={selectedSentences.size > 0}
            currentInterpretation={interpretation}
            personaId={personaId}
            onGenerateProceed={handlePersonAction}
            onGenerateSentence={handleDocumentAction}
            currentChatMessages={messages}
            onRefreshThreads={onRefreshThreads}
          />
        </ChatInputSection>
      </ChatSection>
      
      <FloatingActionButton
        show={isSentenceModeActive && selectedSentences.size > 0}
        onMenuAction={handleMenuAction}
        personaId={personaId}
        currentInterpretation={interpretation}
      />
    </Container>
  );
};

export default InterpretationView; 