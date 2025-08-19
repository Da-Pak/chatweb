import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { confusionApi, ConfusionItemDetail, ChatMessage as ApiChatMessage } from '../api/confusionApi';
import Message from '../../shared/components/Message';
import LoadingMessage from '../../shared/components/LoadingMessage';

interface DetailChatViewProps {
  personaId: string;
  itemId: string;
  itemTitle: string;
  itemType: 'theoretical' | 'insightful';
  onBack?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: white;
`;

const Header = styled.div`
  padding: 16px 20px;
  background: #ffffff;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e9ecef;
`;

const BackButton = styled.button`
  background: #f8f9fa;
  border: 1px solid #ddd;
  color: #333;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: #e9ecef;
    border-color: #ccc;
  }
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ChatContainer = styled.div`
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
  background: #ffffff;
`;

const ChatInputSection = styled.div`
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const MessageInput = styled.textarea`
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.4;
  resize: none;
  max-height: 100px;
  min-height: 44px;
  
  &:focus {
    outline: none;
    border-color: #6c757d;
    box-shadow: 0 0 0 2px rgba(108, 117, 125, 0.1);
  }
`;

const SendButton = styled.button`
  background: #6c757d;
  color: white;
  border: 1px solid #5a6268;
  border-radius: 6px;
  width: 80px;
  height: 44px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #5a6268;
    border-color: #545b62;
  }

  &:disabled {
    background: #ccc;
    border-color: #bbb;
    cursor: not-allowed;
  }
`;



const DetailChatView: React.FC<DetailChatViewProps> = ({
  personaId,
  itemId,
  itemTitle,
  itemType,
  onBack
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personaName, setPersonaName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 초기 메시지 로드 (백엔드에서 받아온다고 가정)
    loadInitialMessages();
  }, [itemId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialMessages = async () => {
    setIsLoading(true);
    
    try {
      // 백엔드에서 실제 데이터 조회
      const detail = await confusionApi.getItemDetail(personaId, itemId);
      
      // 페르소나 이름 추출 (예: "[1] 핵심 갈등 요소" → "지그문트 프로이트")
      const displayPersonaName = itemTitle.includes('핵심 갈등 요소') ? '지그문트 프로이트' : 
                                 itemTitle.includes('심리적 방어기제') ? '지그문트 프로이트' :
                                 itemTitle.includes('발달 단계적 특성') ? '지그문트 프로이트' :
                                 itemTitle.includes('무의식적 동기') ? '지그문트 프로이트' :
                                 itemTitle.includes('잠재된 가능성') ? '지그문트 프로이트' :
                                 itemTitle.includes('숨겨진 욕구') ? '지그문트 프로이트' :
                                 itemTitle.includes('창조적 에너지') ? '지그문트 프로이트' :
                                 itemTitle.includes('변화의 징후') ? '지그문트 프로이트' :
                                 '지그문트 프로이트';
      
      setPersonaName(displayPersonaName);
      
      const initialMessages: ChatMessage[] = [
        {
          role: 'assistant',
          content: `**해석**

    ${itemTitle}에 대한 심층 분석을 시작하겠습니다.

    ${detail.interpretation}

**핵심 문장**

    "${detail.key_sentence}"

**나아가기**

    ${detail.proceed}

**나아가기 핵심 문장**

    "${detail.proceed_key_sentence}"`,
          timestamp: new Date().toISOString()
        }
      ];
      
      setMessages(initialMessages);
    } catch (error) {
      console.error('초기 메시지 로드 실패:', error);
      // 에러 발생 시 기본 메시지 표시
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '죄송합니다. 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      };
      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 백엔드로 메시지 전송 및 응답 받기
    try {
      // 대화 히스토리를 API 형식으로 변환
      const conversationHistory: ApiChatMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await confusionApi.chatWithItem(personaId, itemId, {
        user_message: userMessage.content,
        conversation_history: conversationHistory
      });

      const systemResponse: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemResponse]);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>← 뒤로</BackButton>
        <HeaderTitle>{itemTitle}</HeaderTitle>
      </Header>
      
      <ChatContainer>
        <ChatMessages ref={messagesEndRef}>
          {messages.map((message, index) => 
            message.role === 'user' ? (
              <Message
                key={`detail_${index}`}
                message={{
                  ...message,
                  persona_id: undefined,
                  persona_name: undefined,
                }}
                personas={{}}
                showActionButtons={false}
              />
            ) : (
              <Message
                key={`detail_${index}`}
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
                showActionButtons={false}
              />
            )
          )}
          
          {isLoading && (
            <LoadingMessage 
              personaName={personaName}
              personaColor="#6c757d"
            />
          )}
        </ChatMessages>
        
        <ChatInputSection>
          <MessageInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="궁금한 점이나 더 자세히 알고 싶은 내용을 입력해주세요..."
            disabled={isLoading}
          />
          <SendButton onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            전송
          </SendButton>
        </ChatInputSection>
      </ChatContainer>
    </Container>
  );
};

export default DetailChatView; 