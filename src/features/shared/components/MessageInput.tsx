import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  InputContainer,
  InputWrapper,
  MessageInputContainer,
  MessageInput as StyledMessageInput,
  SendButton,
  SentenceModeButton,
  ButtonGroup,
} from '../styles/GlobalStyle';
import QuickPhraseButton from './QuickPhraseButton';
import { QuickPhrase, quickPhraseApi } from '../api/quickPhraseApi';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
  onToggleSentenceMode?: () => void;
  isSentenceModeActive?: boolean;
  hasSelectedSentences?: boolean;
  currentInterpretation?: string;
  personaId?: string;
  onGenerateProceed?: (messageContent: string) => Promise<void>;
  onGenerateSentence?: (messageContent: string) => Promise<void>;
  currentChatMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  onRefreshThreads?: () => void;
}

export interface MessageInputRef {
  insertText: (text: string) => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({
  onSendMessage,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  onToggleSentenceMode,
  isSentenceModeActive = false,
  hasSelectedSentences = false,
  currentInterpretation,
  personaId,
  onGenerateProceed,
  onGenerateSentence,
  currentChatMessages,
  onRefreshThreads,
}, ref) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [quickPhrases, setQuickPhrases] = useState<QuickPhrase[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ref를 통해 외부에서 텍스트 삽입 가능하도록 함
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      setMessage(prev => prev + text);
      // 텍스트 삽입 후 높이 조절
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          textareaRef.current.focus();
        }
      }, 0);
    }
  }));

  const handleSubmit = async () => {
    if (!message.trim() || disabled || isSending) return;

    const messageToSend = message.trim();
    
    // 즉시 입력창 비우고 상태 변경
    setMessage('');
    setIsSending(true);
    
    // 텍스트영역 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const success = await onSendMessage(messageToSend);
      
      if (!success) {
        // 실패 시 메시지 복원
        setMessage(messageToSend);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }
    } catch (error) {
      // 에러 시 메시지 복원
      setMessage(messageToSend);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleStop = () => {
    // 요청 중단 로직 구현 예정
    setIsSending(false);
    console.log('응답 생성을 중단합니다.');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // 자동 높이 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // 컴포넌트가 마운트될 때 포커스 및 자주쓰는 문장 로드
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
    loadQuickPhrases();
    
    // 저장고에서 선택된 문장이 있는지 확인하고 로드
    const selectedSentence = sessionStorage.getItem('selectedSentenceForInput');
    if (selectedSentence) {
      setMessage(selectedSentence);
      // 세션 스토리지에서 제거 (한 번만 사용)
      sessionStorage.removeItem('selectedSentenceForInput');
      
      // 텍스트 삽입 후 높이 조절
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          textareaRef.current.focus();
          // 커서를 텍스트 끝으로 이동
          textareaRef.current.setSelectionRange(selectedSentence.length, selectedSentence.length);
        }
      }, 100);
    }
  }, [disabled]);

  // 자주쓰는 문장 로드
  const loadQuickPhrases = async () => {
    try {
      const phrases = await quickPhraseApi.getQuickPhrases();
      setQuickPhrases(phrases);
    } catch (error) {
      console.error('자주쓰는 문장 로드 실패:', error);
    }
  };

  // 자주쓰는 문장 선택 시 입력창에 삽입
  const handlePhraseSelect = (text: string) => {
    setMessage(prev => prev + text);
    // 텍스트 삽입 후 높이 조절
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        textareaRef.current.focus();
      }
    }, 0);
  };



  return (
    <InputContainer>
      <InputWrapper>
        <MessageInputContainer>
          <StyledMessageInput
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
          />
          <SendButton
            onClick={isSending ? handleStop : handleSubmit}
            disabled={disabled || (!isSending && !message.trim())}
            title={isSending ? '중지' : '전송'}
            style={{
              background: isSending ? '#ffffff' : undefined,
              color: isSending ? '#000000' : undefined,
              border: isSending ? '2px solid rgb(0, 0, 0)' : undefined,
            }}
          >
            {isSending ? '■' : '↑'}
          </SendButton>
        </MessageInputContainer>
        <ButtonGroup>
          <QuickPhraseButton
            quickPhrases={quickPhrases}
            onPhraseSelect={handlePhraseSelect}
            onPhrasesUpdate={loadQuickPhrases}
            currentInterpretation={currentInterpretation}
            personaId={personaId}
            onGenerateProceed={onGenerateProceed}
            onGenerateSentence={onGenerateSentence}
            currentChatMessages={currentChatMessages}
            currentChatContext={currentInterpretation}
            onRefreshThreads={onRefreshThreads}
          />
          <SentenceModeButton
            $isActive={isSentenceModeActive}
            $hasSelected={hasSelectedSentences}
            onClick={onToggleSentenceMode}
            title="문장 선택 모드"
          >
            문장<br/>선택
          </SentenceModeButton>
        </ButtonGroup>
      </InputWrapper>
    </InputContainer>
  );
});

export default MessageInput; 