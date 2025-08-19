import React, { useState } from 'react';
import { Message as MessageType, Persona } from '../types';
import styled from 'styled-components';
import {
  MessageContainer,
  MessageBubble,
  MessageInfo,
} from '../styles/GlobalStyle';

interface MessageProps {
  message: MessageType;
  personas: Record<string, Persona>;
  showActionButtons?: boolean;
  showThreeActionButtons?: boolean;
  onCopy?: () => void;
  onSunAction?: (messageContent: string) => void;
  onPersonAction?: (messageContent: string) => void;
  onDocumentAction?: (messageContent: string) => void;
  onEdit?: () => void;
  isEditing?: boolean;
  onEditSave?: (newContent: string) => void;
  onEditCancel?: () => void;
}

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

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 2px solid #007bff;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  resize: vertical;
  outline: none;
  
  &:focus {
    border-color: #0056b3;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const EditButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
`;

const Message: React.FC<MessageProps> = ({ 
  message, 
  personas, 
  showActionButtons = false,
  showThreeActionButtons = true,
  onCopy,
  onSunAction,
  onPersonAction,
  onDocumentAction,
  onEdit,
  isEditing = false,
  onEditSave,
  onEditCancel
}) => {
  const [editText, setEditText] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const isUser = message.role === 'user';
  const persona = message.persona_id ? personas[message.persona_id] : null;
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveEdit = async () => {
    if (onEditSave && editText.trim()) {
      setIsSaving(true);
      try {
        await onEditSave(editText.trim());
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditText(message.content); // 원래 내용으로 복원
    if (onEditCancel) {
      onEditCancel();
    }
  };

  // 편집 모드일 때 텍스트 변경 시 상태 업데이트
  React.useEffect(() => {
    if (isEditing) {
      setEditText(message.content);
    }
  }, [isEditing, message.content]);

  return (
    <MessageContainer $isUser={isUser}>
      {isEditing ? (
        <div style={{ width: '100%' }}>
          <EditTextarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="메시지를 수정하세요..."
            autoFocus
            disabled={isSaving}
          />
          <EditButtonsContainer>
            <ActionButton 
              variant="save" 
              onClick={handleSaveEdit} 
              title={isSaving ? "저장 중..." : "저장"}
              disabled={isSaving}
            >
              {isSaving ? "⏳" : "✓"}
            </ActionButton>
            <ActionButton 
              variant="cancel" 
              onClick={handleCancelEdit} 
              title="취소"
              disabled={isSaving}
            >
              ✕
            </ActionButton>
          </EditButtonsContainer>
          {isSaving && (
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '8px',
              textAlign: 'center'
            }}>
              메시지를 수정하고 새로운 응답을 생성하는 중...
            </div>
          )}
        </div>
      ) : (
        <>
          <MessageBubble
            $isUser={isUser}
            $personaColor={persona?.color}
          >
            {message.content}
          </MessageBubble>
          <MessageInfo>
            {!isUser && persona && (
              <span style={{ color: persona.color, fontWeight: 'bold' }}>
                {persona.name}
              </span>
            )}
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
                  {showThreeActionButtons && (
                    <>
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
                </>
              )}
            </ActionButtonsContainer>
          )}
        </>
      )}
    </MessageContainer>
  );
};

export default Message; 