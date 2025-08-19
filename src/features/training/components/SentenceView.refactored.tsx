import React, { useEffect, useRef, useState } from 'react';
import { chatApi } from '../../shared/api/chatApi';
import { sentenceApi } from '../api/sentenceApi';
import Message from '../../shared/components/Message';
import MessageInput, { MessageInputRef } from '../../shared/components/MessageInput';
import LoadingMessage from '../../shared/components/LoadingMessage';
import FloatingActionButton from '../../shared/components/FloatingActionButton';
import SelectableMessage from './SelectableMessage';
import { TrainingThread, Persona } from '../../shared/types';

// 공통 훅들 import
import { useToast } from '../../shared/hooks/useToast';
import { useClipboard } from '../../shared/hooks/useClipboard';
import { useMessageEdit } from '../../shared/hooks/useMessageEdit';
import { useThreadActions } from '../../shared/hooks/useThreadActions';
import { useSentenceMenu } from '../../shared/hooks/useSentenceMenu';
import { useSentenceData } from '../../shared/hooks/useSentenceData';

// 공통 스타일 import
import {
  Container,
  HeaderSection,
  HeaderTitle,
  ChatSection,
  ChatMessages,
  ChatInputSection,
  EmptyChat,
  EmptyIcon,
  Toast
} from '../../shared/styles/CommonStyles';

// SentenceView 전용 스타일
import styled from 'styled-components';

const NewThreadButton = styled.button`
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #218838;
  }
`;

interface SentenceViewProps {
  selectedThread: TrainingThread | null;
  personaId: string;
  personaName: string;
  personas: Record<string, Persona>;
  threads: TrainingThread[];
  onThreadUpdate: (threads: TrainingThread[]) => void;
  onCreateNewThread: (threadType: 'sentence') => Promise<void>;
  onEditMessage?: (messageIndex: number, newContent: string) => Promise<boolean>;
  onRefreshThreads?: () => void;
}

const SentenceView: React.FC<SentenceViewProps> = ({
  selectedThread,
  personaId,
  personaName,
  personas,
  threads,
  onThreadUpdate,
  onCreateNewThread,
  onEditMessage,
  onRefreshThreads
}) => {
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);

  // 공통 훅 사용
  const { showToast, toastMessage, showCopyToast } = useToast();
  const { handleCopyMessage } = useClipboard();
  const { 
    editingMessageIndex, 
    isLoading: editLoading,
    handleStartEdit, 
    handleCancelEdit, 
    handleEditMessage: editMessage 
  } = useMessageEdit();
  const { handleSunAction, handlePersonAction, handleDocumentAction } = useThreadActions(personaId, onRefreshThreads);
  
  // 문장 데이터 관리
  const {
    memos,
    highlightedSentences,
    setMemos,
    setHighlightedSentences,
    handleMemoChange,
    handleDeleteMemo,
    loadThreadSentenceData
  } = useSentenceData(selectedThread?.id);

  // 문장 메뉴 관리
  const {
    selectedSentences,
    setSelectedSentences,
    handleMenuAction
  } = useSentenceMenu({
    personaId,
    threadType: 'sentence',
    selectedThread,
    memos,
    highlightedSentences,
    setMemos,
    setHighlightedSentences
  });

  const [localThreads, setLocalThreads] = useState<TrainingThread[]>(threads);
  const [isLoading, setIsLoading] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isSentenceModeActive, setIsSentenceModeActive] = useState(false);
  const [currentSelectedThread, setSelectedThread] = useState<TrainingThread | null>(selectedThread);

  // 스레드 업데이트 시 로컬 스레드 목록 업데이트
  useEffect(() => {
    setLocalThreads(threads);
  }, [threads]);

  // 채팅 스크롤
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [selectedThread?.messages]);

  // 메시지 전송 처리
  const handleSendMessage = async (message: string): Promise<boolean> => {
    if (!currentSelectedThread) {
      showCopyToast('스레드를 선택해주세요');
      return false;
    }

    setIsLoading(true);

    try {
      // API 호출
      const response = await chatApi.chatWithThread({
        thread_id: currentSelectedThread.id,
        user_message: message
      });

      if (response.data && response.data.success) {
        // UI 업데이트 로직...
        setIsLoading(false);
        return true;
      } else {
        console.error('문장 채팅 응답 오류:', response);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('문장 채팅 오류:', error);
      setIsLoading(false);
      return false;
    }
  };

  // 메시지 수정 핸들러
  const handleEditMessageWithUpdate = async (messageIndex: number, newContent: string) => {
    return editMessage(
      currentSelectedThread?.id,
      messageIndex,
      newContent,
      (updatedThread) => {
        // 스레드 업데이트 로직
        setSelectedThread(updatedThread);
        const updatedThreads = localThreads.map(t => 
          t.id === currentSelectedThread?.id ? updatedThread : t
        );
        setLocalThreads(updatedThreads);
        onThreadUpdate(updatedThreads);
      }
    );
  };

  // 문장선택 모드 토글
  const handleToggleSentenceMode = () => {
    setIsSentenceModeActive(prev => !prev);
  };

  return (
    <Container>
      <HeaderSection>
        <HeaderTitle>문장</HeaderTitle>
        <NewThreadButton onClick={() => onCreateNewThread('sentence')}>
          새 스레드 생성
        </NewThreadButton>
      </HeaderSection>

      <ChatSection>
        <ChatMessages ref={chatMessagesRef}>
          {!currentSelectedThread?.messages?.length ? (
            <EmptyChat>
              <EmptyIcon>📝</EmptyIcon>
              <div>
                <strong>문장은 페르소나의 핵심 통찰을 간결하게 정리합니다.</strong>
                <br /><br />
                해석 내용을 3개의 핵심 문장으로 요약하여 제공합니다.
              </div>
            </EmptyChat>
          ) : (
            currentSelectedThread.messages.map((message, index) => (
              isSentenceModeActive && message.role === 'assistant' ? (
                <SelectableMessage
                  key={`${message.role}-${index}`}
                  message={message}
                  messageIndex={index}
                  personas={personas}
                  selectedSentences={selectedSentences}
                  highlightedSentences={highlightedSentences}
                  memos={memos}
                  onToggleSelect={(id: string) => setSelectedSentences(prev => {
                    const newSet = new Set(prev);
                    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
                    return newSet;
                  })}
                  onMemoChange={handleMemoChange}
                  onDeleteMemo={handleDeleteMemo}
                  showSentenceSelector={true}
                />
              ) : (
                <Message
                  key={`${message.role}-${index}`}
                  message={message}
                  personas={personas}
                  showActionButtons={true}
                  showThreeActionButtons={true}
                  onCopy={() => handleCopyMessage(message.content)}
                  onEdit={() => handleStartEdit(index)}
                  onEditSave={(newContent: string) => handleEditMessageWithUpdate(index, newContent)}
                  onEditCancel={handleCancelEdit}
                  isEditing={editingMessageIndex === index}
                  onSunAction={handleSunAction}
                  onPersonAction={handlePersonAction}
                  onDocumentAction={handleDocumentAction}
                />
              )
            ))
          )}
          
          {(isLoading || editLoading) && (
            <LoadingMessage 
              personaName={personaName}
              personaColor={personas[personaId]?.color || '#666'}
            />
          )}
        </ChatMessages>

        <ChatInputSection>
          <MessageInput
            ref={messageInputRef}
            onSendMessage={handleSendMessage}
            disabled={isLoading || editLoading}
            placeholder="문장에 대해 질문하거나 추가 설명을 요청하세요..."
            isSentenceModeActive={isSentenceModeActive}
            hasSelectedSentences={selectedSentences.size > 0}
            onToggleSentenceMode={handleToggleSentenceMode}
          />
        </ChatInputSection>
      </ChatSection>

      <Toast $show={showToast}>
        {toastMessage}
      </Toast>

      <FloatingActionButton
        show={isSentenceModeActive ? selectedSentences.size > 0 : showFAB}
        onMenuAction={(action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy') => {
          const selectedIds = Array.from(selectedSentences);
          const selectedTexts = selectedIds.map(id => {
            // 텍스트 추출 로직
            return '';
          });
          
          handleMenuAction(action, selectedIds, selectedTexts, messageInputRef);
        }}
        personaId={personaId}
        currentInterpretation=""
      />
    </Container>
  );
};

export default SentenceView; 