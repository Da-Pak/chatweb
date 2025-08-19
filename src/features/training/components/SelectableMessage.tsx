import React from 'react';
import { Message as MessageType, Persona } from '../../shared/types';
import styled from 'styled-components';
import {
  MessageContainer,
  MessageBubble,
  MessageInfo,
} from '../../shared/styles/GlobalStyle';
import SelectableSentence from './SelectableSentence';

interface SelectableMessageProps {
  message: MessageType;
  messageIndex?: number;
  personas: Record<string, Persona>;
  selectedSentences: Set<string>;
  highlightedSentences: Set<string>;
  memos: Record<string, string>;
  onToggleSelect: (sentenceId: string) => void;
  onMemoChange: (sentenceId: string, memo: string) => void;
  onDeleteMemo: (sentenceId: string) => void;
  showSentenceSelector?: boolean;
  showActionButtons?: boolean;
  onCopy?: () => void;
  onSunAction?: (messageContent: string) => void;
  onPersonAction?: (messageContent: string) => void;
  onDocumentAction?: (messageContent: string) => void;
  onEdit?: () => void;
  isEditing?: boolean;
  onEditSave?: (newContent: string) => void;
  onEditCancel?: () => void;
}

const MessageContent = styled.div`
  white-space: pre-line;
  line-height: 1.6;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-left: 4px;
`;

const ActionButton = styled.button<{ variant?: 'copy' | 'sun' | 'person' | 'document' | 'edit' | 'save' | 'cancel' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #000;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  background: white;
  color: #000;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
  }
  
  &:hover:not(:disabled) { 
    transform: translateY(-1px); 
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); 
    background: #f8f8f8;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    background: #f0f0f0;
  }
`;

const SelectableMessage: React.FC<SelectableMessageProps> = ({
  message,
  messageIndex = 0,
  personas,
  selectedSentences,
  highlightedSentences,
  memos,
  onToggleSelect,
  onMemoChange,
  onDeleteMemo,
  showSentenceSelector = true,
  showActionButtons = false,
  onCopy,
  onSunAction,
  onPersonAction,
  onDocumentAction,
  onEdit,
  isEditing = false,
  onEditSave,
  onEditCancel
}) => {
  // 메시지 객체가 유효하지 않은 경우 에러 방지
  if (!message || typeof message !== 'object') {
    console.warn('SelectableMessage: Invalid message object', message);
    return <div>메시지를 표시할 수 없습니다.</div>;
  }

  const isUser = message.role === 'user';
  const persona = message.persona_id ? personas[message.persona_id] : null;
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 문장 분할 로직
  const splitIntoSentences = (text: string): string[] => {
    // text가 undefined이거나 null인 경우 빈 배열 반환
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    // 엔터 또는 마침표 기준으로 분할하되, 빈 문장은 제외
    return text
      .split(/[\n.]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  };

  const sentences = splitIntoSentences(message.content || '');

  const generateSentenceId = (messageIndex: number | undefined, sentenceIndex: number): string => {
    return `${message.timestamp || 'no-timestamp'}_${messageIndex || 0}_${sentenceIndex}`;
  };

  return (
    <MessageContainer $isUser={isUser}>
      <MessageBubble $isUser={isUser} $personaColor={persona?.color}>
        <MessageContent>
          {sentences.map((sentence, index) => {
            const sentenceId = generateSentenceId(messageIndex, index);
            return (
              <SelectableSentence
                key={sentenceId}
                sentence={sentence}
                sentenceId={sentenceId}
                isSelected={selectedSentences.has(sentenceId)}
                isHighlighted={highlightedSentences.has(sentenceId)}
                hasMemo={sentenceId in memos}
                memo={memos[sentenceId]}
                showSelector={showSentenceSelector}
                onToggleSelect={onToggleSelect}
                onMemoChange={onMemoChange}
                onDeleteMemo={onDeleteMemo}
              />
            );
          })}
        </MessageContent>
      </MessageBubble>
      
      <MessageInfo>
        <span>{isUser ? '나' : (message.persona_name || '어시스턴트')}</span>
        <span>{formatTime(message.timestamp)}</span>
      </MessageInfo>

      {/* 액션 버튼 표시 */}
      {showActionButtons && (
        <ActionButtonsContainer>
          {isUser ? (
            // 사용자 메시지: 복사 + 수정 버튼만
            <>
              <ActionButton variant="copy" onClick={onCopy} title="복사">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="8" height="10" rx="1" stroke="black" strokeWidth="1" fill="none"/>
                  <rect x="6" y="6" width="8" height="8" rx="1" stroke="black" strokeWidth="1" fill="white"/>
                  <path d="M4 5h4M4 7h3M4 9h4" stroke="black" strokeWidth="0.5"/>
                  <path d="M8 9h4M8 11h3M8 13h4" stroke="black" strokeWidth="0.5"/>
                </svg>
              </ActionButton>
              {onEdit && (
                <ActionButton variant="edit" onClick={onEdit} title="수정">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.5 1.5L14.5 4.5L9 10H6V7L11.5 1.5Z" stroke="black" strokeWidth="1" fill="none"/>
                    <path d="M10.5 2.5L13.5 5.5" stroke="black" strokeWidth="1"/>
                    <path d="M2 14H6L6.5 13.5" stroke="black" strokeWidth="1" fill="none"/>
                  </svg>
                </ActionButton>
              )}
            </>
          ) : (
            // LLM 메시지: 복사 + 해/나/문 버튼
            <>
              <ActionButton variant="copy" onClick={onCopy} title="복사">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="8" height="10" rx="1" stroke="black" strokeWidth="1" fill="none"/>
                  <rect x="6" y="6" width="8" height="8" rx="1" stroke="black" strokeWidth="1" fill="white"/>
                  <path d="M4 5h4M4 7h3M4 9h4" stroke="black" strokeWidth="0.5"/>
                  <path d="M8 9h4M8 11h3M8 13h4" stroke="black" strokeWidth="0.5"/>
                </svg>
              </ActionButton>
              <ActionButton variant="sun" onClick={(e) => {
                e.preventDefault();
                onSunAction?.(message.content);
              }} title="해">
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#000'
                }}>해</span>
              </ActionButton>
              <ActionButton variant="person" onClick={(e) => {
                e.preventDefault();
                onPersonAction?.(message.content);
              }} title="나">
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#000'
                }}>나</span>
              </ActionButton>
              <ActionButton variant="document" onClick={(e) => {
                e.preventDefault();
                onDocumentAction?.(message.content);
              }} title="문">
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#000'
                }}>문</span>
              </ActionButton>
            </>
          )}
        </ActionButtonsContainer>
      )}
    </MessageContainer>
  );
};

export default SelectableMessage; 