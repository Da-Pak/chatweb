import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingMessageProps {
  personaName?: string;
  personaColor?: string;
  customMessage?: string;
}

const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const MessageBubble = styled.div<{ $personaColor?: string }>`
  background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
  border: 1px solid #dadce0;
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  max-width: 80%;
  position: relative;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.1);
`;

const LoadingText = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  color: #5f6368;
`;

const Dot = styled.span<{ $delay: number }>`
  width: 8px;
  height: 8px;
  background: #5f6368;
  border-radius: 50%;
  animation: ${pulse} 1.4s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
`;

const MessageInfo = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  width: 100%;
  max-width: 80%;
  gap: 8px;
`;

const TypingIndicator = styled.div<{ $personaColor: string }>`
  span {
    background-color: ${props => props.$personaColor};
  }
`;

const MessageContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LoadingMessage: React.FC<LoadingMessageProps> = ({
  personaName = "AI",
  personaColor = "#666",
  customMessage
}) => {
  const [messageText, setMessageText] = useState(customMessage || "응답 생성 중");

  useEffect(() => {
    if (customMessage) {
      setMessageText(customMessage);
      return;
    }

    let index = 0;
    const messages = [
      "응답 생성 중",
      "내용을 분석 중",
      "답변을 작성 중",
      "최종 검토 중"
    ];

    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessageText(messages[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [customMessage]);

  const formatTime = () => {
    return new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MessageContainer>
      <MessageBubble $personaColor={personaColor}>
        <LoadingText>
          {messageText}
          <Dot $delay={0} />
          <Dot $delay={0.2} />
          <Dot $delay={0.4} />
        </LoadingText>
      </MessageBubble>
      <MessageInfo>
        <span style={{ color: personaColor, fontWeight: 'bold' }}>
          {personaName}
        </span>
        <span>{formatTime()}</span>
      </MessageInfo>
      <MessageContent>
        <TypingIndicator $personaColor={personaColor}>
          <span></span>
          <span></span>
          <span></span>
        </TypingIndicator>
      </MessageContent>
    </MessageContainer>
  );
};

export default LoadingMessage; 