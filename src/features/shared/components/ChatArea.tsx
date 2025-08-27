import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Conversation, Persona, GlobalMessage, TrainingThread, InteractionRecord } from '../types';
import Message from './Message';
import MessageInput from './MessageInput';
import TrainingCategoryView from '../../training/components/TrainingCategoryView';
import InterpretationView from '../../training/components/InterpretationView';
import ProceedView from '../../training/components/ProceedView';
import SentenceView from '../../training/components/SentenceView';
import ConfusionView from '../../training/components/ConfusionView';
import PersonaAdminPanel from '../../admin/components/PersonaAdminPanel';
import LoadingMessage from './LoadingMessage';
import { chatApi } from '../api/chatApi';
import {
  MainArea,
  ChatContent,
  EmptyState,
  EmptyStateTitle,
  EmptyStateText,
} from '../styles/GlobalStyle';
import InteractionHistoryView from '../../training/components/InteractionHistoryView';
import VerbalizationView from '../../verbalization/components/VerbalizationView';

// Helper and styled components from RecentInteractionsView
const getThreadTypeLabel = (type: string) => {
  switch (type) {
    case 'interpretation': return '해석';
    case 'proceed': return '나아가기';
    case 'sentence': return '문장';
    case 'verbalization': return '언어화';
    default: return type;
  }
};

const RecentInteractionHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 81px;
  box-sizing: border-box;
`;

const RecentInteractionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const NavigateButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%);
  border: 1px solid #ccc;
  border-radius: 12px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: linear-gradient(90deg, #f8f8f8 0%, #e8e8e8 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;


interface ChatAreaProps {
  selectedConversation: string | null;
  conversations: Record<string, Conversation>;
  personas: Record<string, Persona>;
  globalMessages: GlobalMessage[];
  isLoading: boolean;
  error: string | null;
  onSendInitialMessage: (message: string) => Promise<boolean>;
  onContinueConversation: (conversationId: string, message: string) => Promise<boolean>;
  onClearError: () => void;
  selectedPersonaItem?: string | null; // 훈습 모드 확인용
  onSelectPersona?: (personaId: string) => void; // 페르소나 선택 핸들러
  onInterpretationComplete: (personaId: string, interpretation: string) => void; // 해석 완료 핸들러
  selectedConversationItem?: string | null; // 선택된 대화 항목
  currentInterpretation?: {
    personaId: string;
    personaName: string;
    content: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  } | null;
  onInterpretationMessage: (message: string) => Promise<boolean>; // 해석 채팅 메시지 핸들러
  onUpdateInterpretation?: (updatedInterpretation: {
    personaId: string;
    personaName: string;
    content: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  }) => void; // 해석 업데이트 핸들러
  onUpdateConversation?: (updatedConversation: any) => void; // 대화 업데이트 핸들러
  onSwitchConversationMode?: (mode: string) => void; // 대화 모드 전환 핸들러
  onRefreshConversationSidebar?: () => void; // ConversationSidebar 새로고침 핸들러
  conversationRefreshTrigger?: number; // ConversationSidebar 새로고침 트리거
  viewingRecentThread?: (TrainingThread & { persona_id: string; persona_name: string; }) | null;
  isRecentThreadLoading?: boolean;
  onNavigateToThread?: (threadId: string, threadType: string, interactionMessage?: string) => void;
  recentInteractionsProps?: {
    personas: Record<string, Persona>;
    onSelectPersona: (personaId: string) => void;
    onThreadSelect: (thread: TrainingThread, personaId: string) => void;
  }; // 최근 상호작용 관련 props
  verbalizationProps?: {
    selectedThread: TrainingThread | null;
    threads: TrainingThread[];
    onThreadUpdate: () => void;
    onCreateNewThread: () => Promise<void>;
  }; // 언어화 관련 props
}

const ChatArea: React.FC<ChatAreaProps> = ({
  selectedConversation,
  conversations,
  personas,
  globalMessages,
  isLoading,
  error,
  onSendInitialMessage,
  onContinueConversation,
  onClearError,
  selectedPersonaItem,
  onSelectPersona,
  onInterpretationComplete,
  selectedConversationItem,
  currentInterpretation,
  onInterpretationMessage,
  onUpdateInterpretation,
  onUpdateConversation,
  onSwitchConversationMode,
  onRefreshConversationSidebar,
  conversationRefreshTrigger,
  recentInteractionsProps,
  verbalizationProps,
  viewingRecentThread,
  isRecentThreadLoading,
  onNavigateToThread,
}) => {
  const chatContentRef = useRef<HTMLDivElement>(null);
  const currentConversation = selectedConversation ? conversations[selectedConversation] : null;
  
  // 편집 상태 관리
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  
  // 훈습 관련 상태
  const [threads, setThreads] = useState<TrainingThread[]>([]);
  const [proceedContent, setProceedContent] = useState<string>('');
  const [sentenceContent, setSentenceContent] = useState<string>('');
  const [interactionRecords, setInteractionRecords] = useState<InteractionRecord[]>([]);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [currentConversation?.messages, globalMessages, isLoading]);

  // 훈습 데이터 로딩을 더 정확하게 수정
  useEffect(() => {
    const loadTrainingData = async () => {
      if (!currentInterpretation?.personaId) return;

      try {
        // 스레드 데이터 로드
        const threadsResponse = await chatApi.getPersonaThreads(currentInterpretation.personaId);
        if (threadsResponse.data) {
          setThreads(threadsResponse.data);
          
          // 현재 페르소나의 스레드 (이미 필터링됨)
          const personaThreads = threadsResponse.data;
          
          // 나아가기와 문장 스레드에서 콘텐츠 추출
          const proceedThread = personaThreads.find(t => t.thread_type === 'proceed');
          const sentenceThread = personaThreads.find(t => t.thread_type === 'sentence');
          
          if (proceedThread && proceedThread.messages.length > 0) {
            const firstProceedMessage = proceedThread.messages.find(m => m.role === 'assistant');
            if (firstProceedMessage) {
              setProceedContent(firstProceedMessage.content);
            }
          }
          
          if (sentenceThread && sentenceThread.messages.length > 0) {
            const firstSentenceMessage = sentenceThread.messages.find(m => m.role === 'assistant');
            if (firstSentenceMessage) {
              setSentenceContent(firstSentenceMessage.content);
            }
          }
        }
      } catch (error) {
        console.error('훈습 데이터 로드 실패:', error);
      }
    };

    loadTrainingData();
  }, [currentInterpretation?.personaId]);
  
  // ConversationSidebar 새로고침 트리거에 따라 스레드도 새로고침
  useEffect(() => {
    const reloadThreadsFromSidebar = async () => {
      if (!currentInterpretation?.personaId) return;

      try {
        const threadsResponse = await chatApi.getPersonaThreads(currentInterpretation.personaId);
        if (threadsResponse.data) {
          console.log('ConversationSidebar 새로고침에 따라 ChatArea 스레드도 업데이트:', threadsResponse.data.length);
          setThreads(threadsResponse.data);
        }
      } catch (error) {
        console.error('스레드 새로고침 실패:', error);
      }
    };

    // conversationRefreshTrigger가 변경될 때마다 스레드 새로고침
    if (conversationRefreshTrigger && conversationRefreshTrigger > 0 && currentInterpretation?.personaId) {
      console.log('conversationRefreshTrigger 변경에 따른 스레드 새로고침:', conversationRefreshTrigger);
      reloadThreadsFromSidebar();
    }
  }, [conversationRefreshTrigger, currentInterpretation?.personaId]);

  // 스레드 업데이트 시 콘텐츠도 업데이트
  useEffect(() => {
    const proceedThread = threads.find(t => t.thread_type === 'proceed');
    const sentenceThread = threads.find(t => t.thread_type === 'sentence');
    
    if (proceedThread && proceedThread.messages.length > 0) {
      const firstProceedMessage = proceedThread.messages.find(m => m.role === 'assistant');
      if (firstProceedMessage) {
        setProceedContent(firstProceedMessage.content);
      }
    }
    
    if (sentenceThread && sentenceThread.messages.length > 0) {
      const firstSentenceMessage = sentenceThread.messages.find(m => m.role === 'assistant');
      if (firstSentenceMessage) {
        setSentenceContent(firstSentenceMessage.content);
      }
    }
  }, [threads]);

  // 상호작용 기록 로드
  useEffect(() => {
    const loadInteractionRecords = async () => {
      try {
        const recordsResponse = await chatApi.getAllInteractionRecords();
        if (recordsResponse.data) {
          setInteractionRecords(recordsResponse.data);
        }
      } catch (error) {
        console.error('상호작용 기록 로드 실패:', error);
      }
    };

    loadInteractionRecords();
  }, [currentInterpretation, threads]); // threads나 currentInterpretation이 변경될 때마다 새로고침

  const handleSendMessage = async (message: string) => {
    let success = false;
    if (selectedConversation) {
      // 기존 대화에 메시지 추가
      success = await onContinueConversation(selectedConversation, message);
    } else if (currentInterpretation) {
      // 해석 모드에서는 해석 관련 메시지 전송
      success = await onInterpretationMessage(message);
    } else {
      // 새로운 대화 시작
      success = await onSendInitialMessage(message);
    }

    if (success && onRefreshConversationSidebar) {
      console.log('메시지 전송 성공, ConversationSidebar 새로고침 실행');
      onRefreshConversationSidebar();
    }
    
    return success;
  };

  // 통합된 메시지 수정 핸들러
  const handleEditMessage = async (messageIndex: number, newContent: string): Promise<boolean> => {
    // 해석 모드인 경우
    if (currentInterpretation) {
      try {
        // 메시지 수정 - 수정 후 새로운 응답 자동 생성
        const updatedMessages = [...currentInterpretation.messages];
        if (messageIndex >= 0 && messageIndex < updatedMessages.length) {
          // 수정된 메시지 업데이트
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: newContent,
            timestamp: new Date().toISOString(),
          };

          // 수정된 메시지 이후의 모든 메시지들 제거
          const filteredMessages = updatedMessages.slice(0, messageIndex + 1);

          // 백엔드 API를 통해 새로운 AI 응답 생성
          try {
            const response = await chatApi.universalChat({
              personaId: currentInterpretation.personaId,
              message: newContent,
              contextType: 'interpretation'
            });

            if (response.data) {
              const aiResponse = {
                role: 'assistant' as const,
                content: response.data.response,
                timestamp: response.data.timestamp,
              };

              const updatedInterpretation = {
                ...currentInterpretation,
                messages: [...filteredMessages, aiResponse],
              };

              // 상위 컴포넌트에 업데이트 알림
              if (onUpdateInterpretation) {
                onUpdateInterpretation(updatedInterpretation);
              }

              return true;
            } else {
              // API 호출 실패 시 로컬에서 임시 응답 생성
              const aiResponse = {
                role: 'assistant' as const,
                content: `${currentInterpretation.personaName}의 관점에서 수정된 메시지에 대해 새롭게 응답드리겠습니다.\n\n"${newContent}"에 대해 분석해보면, 이는 이전과는 다른 맥락을 제시하고 있습니다. 수정된 내용을 바탕으로 새로운 해석과 통찰을 제공하겠습니다.`,
                timestamp: new Date().toISOString(),
              };

              const updatedInterpretation = {
                ...currentInterpretation,
                messages: [...filteredMessages, aiResponse],
              };

              if (onUpdateInterpretation) {
                onUpdateInterpretation(updatedInterpretation);
              }

              return true;
            }
          } catch (apiError) {
            console.error('해석 API 호출 실패:', apiError);
            
            // API 호출 실패 시 로컬에서 임시 응답 생성
            const aiResponse = {
              role: 'assistant' as const,
              content: `${currentInterpretation.personaName}의 관점에서 수정된 메시지에 대해 새롭게 응답드리겠습니다.\n\n"${newContent}"에 대해 분석해보면, 이는 이전과는 다른 맥락을 제시하고 있습니다. 수정된 내용을 바탕으로 새로운 해석과 통찰을 제공하겠습니다.`,
              timestamp: new Date().toISOString(),
            };

            const updatedInterpretation = {
              ...currentInterpretation,
              messages: [...filteredMessages, aiResponse],
            };

            if (onUpdateInterpretation) {
              onUpdateInterpretation(updatedInterpretation);
            }

            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('해석 메시지 수정 실패:', error);
        return false;
      }
    }
    
    // 일반 대화 모드인 경우
    if (selectedConversation && currentConversation) {
      try {
        const result = await chatApi.editMessage(selectedConversation, messageIndex, newContent);
        
        if (result.data?.success && result.data.updated_conversation) {
          // 수정된 대화 정보로 즉시 UI 업데이트
          if (onUpdateConversation) {
            onUpdateConversation(result.data.updated_conversation);
          }
          
          return true;
        } else {
          console.error('메시지 수정 실패:', result.error);
          return false;
        }
      } catch (error) {
        console.error('메시지 수정 요청 실패:', error);
        return false;
      }
    }
    
    return false;
  };



  const renderInitialResponses = () => {
    if (!globalMessages.length) return null;
    
    const latestMessage = globalMessages[globalMessages.length - 1];
    
    return (
      <div>
        {/* 사용자 질문 */}
        <Message
          message={{
            role: 'user',
            content: latestMessage.user_message,
            timestamp: latestMessage.timestamp,
          }}
          personas={personas}
          showActionButtons={false}
        />
        
        {/* 모든 페르소나 응답 */}
        {latestMessage.responses.map((response) => (
          <Message
            key={`${latestMessage.id}_${response.persona_id}`}
            message={{
              role: 'assistant',
              content: response.content,
              timestamp: response.timestamp,
              persona_id: response.persona_id,
              persona_name: response.persona_name,
            }}
            personas={personas}
            showActionButtons={true}
          />
        ))}
        
        <div style={{
          margin: '20px 0',
          padding: '16px',
          backgroundColor: '#f8f8f8',
          borderRadius: '8px',
          border: 'none',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            💡 각 페르소나와 개별적으로 대화를 이어가려면
          </div>
          <div style={{ fontSize: '13px', color: '#888' }}>
            왼쪽 사이드바에서 페르소나를 선택하거나, 특정 대화를 선택하세요
          </div>
        </div>
      </div>
    );
  };

  const renderConversation = () => {
    if (!currentConversation) return null;

    return currentConversation.messages.map((message, index) => (
      <Message
        key={`${currentConversation.id}_${index}`}
        message={message}
        personas={personas}
        showActionButtons={true}
        onCopy={() => {
          navigator.clipboard.writeText(message.content);
        }}
        onEdit={message.role === 'user' ? () => setEditingMessageIndex(index) : undefined}
        onEditSave={message.role === 'user' ? async (newContent) => {
          const success = await handleEditMessage(index, newContent);
          if (success) {
            setEditingMessageIndex(null);
          }
          return success;
        } : undefined}
        onEditCancel={() => setEditingMessageIndex(null)}
        isEditing={editingMessageIndex === index}
        onSunAction={() => {}}
        onPersonAction={() => {}}
        onDocumentAction={() => {}}
      />
    ));
  };

  const renderEmptyState = () => (
    <EmptyState>
      <EmptyStateTitle>새로운 대화를 시작해보세요!</EmptyStateTitle>
      <EmptyStateText>
        {Object.keys(personas).length > 0 ? (
          <>
            아래에 질문을 입력하면 {Object.keys(personas).length}개의 페르소나가<br />
            각각 다른 관점에서 답변해드립니다.
          </>
        ) : (
          '페르소나 정보를 불러오는 중입니다...'
        )}
      </EmptyStateText>
    </EmptyState>
  );

  // 모드 전환 핸들러
  const handleSwitchToMode = (mode: 'interpretation' | 'proceed' | 'sentence') => {
    if (onSwitchConversationMode) {
      onSwitchConversationMode(mode);
    }
  };

  // 새로운 해석 생성 핸들러
  const handleGenerateNewInterpretation = async () => {
    if (!currentInterpretation?.personaId) return;
    
    try {
      // 새로운 해석을 생성하고 완료 콜백 호출
      onInterpretationComplete(currentInterpretation.personaId, '새로운 해석을 생성합니다...');
    } catch (error) {
      console.error('새로운 해석 생성 실패:', error);
    }
  };

  // 선택된 스레드 추출 (최신 데이터로 업데이트)
  const getSelectedThread = (conversationItem: string | null | undefined): TrainingThread | null => {
    if (!conversationItem || !conversationItem.includes('-thread-')) return null;
    
    const threadId = conversationItem.split('-thread-')[1];
    const foundThread = threads.find(thread => thread.id === threadId);
    
    if (foundThread) {
      console.log('스레드 발견:', {
        threadId: foundThread.id,
        threadType: foundThread.thread_type,
        messageCount: foundThread.messages?.length || 0
      });
    } else {
      console.warn('스레드를 찾을 수 없음:', threadId, '사용 가능한 스레드:', threads.map(t => t.id));
    }
    
    return foundThread || null;
  };

  // 스레드 새로고침 함수
  const handleRefreshThreads = async () => {
    if (!currentInterpretation?.personaId) return;
    
    try {
      console.log('=== 스레드 새로고침 시작 ===');
      console.log('personaId:', currentInterpretation.personaId);
      
      // 1. 스레드 정보 새로고침
      const threadsResponse = await chatApi.getPersonaThreads(currentInterpretation.personaId);
      if (threadsResponse.data) {
        const updatedThreads = threadsResponse.data;
        setThreads(updatedThreads);
        console.log('스레드 업데이트 완료:', updatedThreads.length, '개');
        
        // 콘텐츠 업데이트
        const proceedThread = updatedThreads.find(t => t.thread_type === 'proceed');
        const sentenceThread = updatedThreads.find(t => t.thread_type === 'sentence');
        
        if (proceedThread && proceedThread.messages.length > 0) {
          const firstProceedMessage = proceedThread.messages.find(m => m.role === 'assistant');
          if (firstProceedMessage) {
            setProceedContent(firstProceedMessage.content);
          }
        }
        
        if (sentenceThread && sentenceThread.messages.length > 0) {
          const firstSentenceMessage = sentenceThread.messages.find(m => m.role === 'assistant');
          if (firstSentenceMessage) {
            setSentenceContent(firstSentenceMessage.content);
          }
        }
      }
      
      // 2. 해석 내용도 새로고침 (중요!)
      try {
        console.log('해석 내용 새로고침 시작...');
        const interpretationResponse = await chatApi.getInterpretation(currentInterpretation.personaId);
        if (interpretationResponse.data) {
          console.log('해석 내용 업데이트:', interpretationResponse.data.interpretation.substring(0, 100) + '...');
          
          // 해석 내용 업데이트
          const updatedInterpretation = {
            ...currentInterpretation,
            content: interpretationResponse.data.interpretation,
          };
          
          if (onUpdateInterpretation) {
            onUpdateInterpretation(updatedInterpretation);
            console.log('해석 내용 업데이트 완료');
          }
        }
      } catch (interpretationError) {
        console.warn('해석 내용 새로고침 실패:', interpretationError);
      }
      
      // 3. 상호작용 기록도 새로고침 (해석 저장이 반영되도록)
      try {
        console.log('상호작용 기록 새로고침 시작...');
        const interactionResponse = await chatApi.getAllInteractionRecords();
        if (interactionResponse.data) {
          setInteractionRecords(interactionResponse.data);
          console.log('상호작용 기록 업데이트 완료:', interactionResponse.data.length, '개');
        }
      } catch (interactionError) {
        console.warn('상호작용 기록 새로고침 실패:', interactionError);
      }
      
      // 4. ConversationSidebar 새로고침
      if (onRefreshConversationSidebar) {
        console.log('ConversationSidebar 새로고침 트리거...');
        onRefreshConversationSidebar();
      }
      
      console.log('=== 스레드 새로고침 완료 ===');
    } catch (error) {
      console.error('스레드 새로고침 실패:', error);
    }
  };

  // 해석 뷰 렌더링
  const renderInterpretationView = () => {
    if (!currentInterpretation) return null;

    // 해석 스레드가 명시적으로 선택된 경우에만 해당 스레드의 데이터 사용
    const isInterpretationThread = selectedConversationItem?.startsWith('interpretation-thread-');
    let selectedThread = null;
    
    if (isInterpretationThread) {
      selectedThread = getSelectedThread(selectedConversationItem);
    } else if (!isInterpretationThread && threads?.length > 0) {
      // 해석 스레드가 명시적으로 선택되지 않았지만 해석 스레드가 존재하는 경우, 가장 최근 스레드를 사용
      const interpretationThreads = threads.filter(t => t.thread_type === 'interpretation');
      if (interpretationThreads.length > 0) {
        selectedThread = interpretationThreads[0]; // 첫 번째 스레드가 가장 최근 스레드
        console.log('자동 선택된 최근 해석 스레드:', selectedThread?.id);
      }
    }
    
    // 사용할 메시지들 결정: 스레드가 있으면 스레드 메시지, 없으면 현재 해석 메시지
    const messagesToShow = selectedThread && selectedThread.messages?.length > 0
      ? selectedThread.messages 
      : currentInterpretation.messages;
    
    // 사용할 해석 내용 결정: 스레드가 있으면 스레드 content, 없으면 현재 해석 content
    const interpretationContent = selectedThread 
      ? (selectedThread.content || (selectedThread.messages?.length > 0 ? selectedThread.messages[0].content : currentInterpretation.content))
      : currentInterpretation.content;

    console.log('해석 뷰 렌더링:', {
      isInterpretationThread,
      selectedThreadId: selectedThread?.id,
      selectedConversationItem,
      messageCount: messagesToShow.length,
      contentPreview: interpretationContent.substring(0, 100) + '...',
      hasInterpretationThreads: threads.filter(t => t.thread_type === 'interpretation').length || 0,
      autoSelectedThread: !isInterpretationThread && selectedThread ? true : false
    });

    return (
      <InterpretationView
        interpretation={interpretationContent}
        personaName={currentInterpretation.personaName}
        onSendMessage={() => Promise.resolve(true)}
        onEditMessage={handleEditMessage}
        messages={messagesToShow}
        onGenerateNewInterpretation={handleGenerateNewInterpretation}
        onSwitchToMode={handleSwitchToMode}
        personaId={currentInterpretation.personaId}
        onRefreshThreads={handleRefreshThreads}
        selectedThread={selectedThread}
      />
    );
  };

  // 나아가기 뷰 렌더링
  const renderProceedView = () => {
    if (!currentInterpretation) return null;

    const selectedThread = getSelectedThread(selectedConversationItem);

    return (
      <ProceedView
        personaId={currentInterpretation.personaId}
        personaName={currentInterpretation.personaName}
        proceedContent={proceedContent || '나아가기를 생성하고 있습니다...'}
        threads={threads}
        onSwitchToMode={handleSwitchToMode}
        onGenerateNewInterpretation={handleGenerateNewInterpretation}
        selectedThread={selectedThread}
        onRefreshThreads={handleRefreshThreads}
      />
    );
  };

  // 문장 뷰 렌더링
  const renderSentenceView = () => {
    if (!currentInterpretation) return null;

    const selectedThread = getSelectedThread(selectedConversationItem);

    return (
      <SentenceView
        personaId={currentInterpretation.personaId}
        personaName={currentInterpretation.personaName}
        sentenceContent={sentenceContent || '문장을 생성하고 있습니다...'}
        threads={threads}
        onSwitchToMode={handleSwitchToMode}
        onGenerateNewInterpretation={handleGenerateNewInterpretation}
        selectedThread={selectedThread}
        onRefreshThreads={handleRefreshThreads}
      />
    );
  };

  // 상호작용 기록 뷰 렌더링
  const renderInteractionHistoryView = () => {
    if (!currentInterpretation) return null;

    return (
      <InteractionHistoryView
        personaId={currentInterpretation.personaId}
        personaName={currentInterpretation.personaName}
        allInteractionRecords={interactionRecords}
        onThreadSelect={handleInteractionThreadSelect}
        onSwitchToMode={handleSwitchToMode}
        onGenerateNewInterpretation={handleGenerateNewInterpretation}
      />
    );
  };

  // 더 혼란스럽게 뷰 렌더링
  const renderConfusionView = () => {
    if (!currentInterpretation) return null;

    return (
      <ConfusionView
        personaId={currentInterpretation.personaId}
        personaName={currentInterpretation.personaName}
        onSwitchToMode={handleSwitchToMode}
        onGenerateNewInterpretation={handleGenerateNewInterpretation}
      />
    );
  };

  // 상호작용 기록에서 스레드 선택 핸들러
  const handleInteractionThreadSelect = (thread: TrainingThread) => {
    // 해당 스레드의 모드로 전환하고 스레드 선택
    if (onSwitchConversationMode) {
      onSwitchConversationMode(`${thread.thread_type}-thread-${thread.id}`);
    }
  };

  return (
    <MainArea>
      {selectedPersonaItem === 'recent' ? (
        <>
          {viewingRecentThread ? (
            <RecentInteractionHeader>
              <RecentInteractionTitle>
                {`${viewingRecentThread.persona_name} - ${getThreadTypeLabel(viewingRecentThread.thread_type)}`}
              </RecentInteractionTitle>
              <NavigateButton onClick={() => onNavigateToThread?.(viewingRecentThread.id, viewingRecentThread.thread_type)}>
                해당 대화로 이동
              </NavigateButton>
            </RecentInteractionHeader>
          ) : (
            <div style={{ height: '81px', borderBottom: '1px solid #ddd', background: 'white' }}>
              {/* Empty header to match height */}
          </div>
          )}

          <ChatContent ref={chatContentRef}>
            {isRecentThreadLoading ? (
              <LoadingMessage personaName="AI" personaColor="#666" />
            ) : viewingRecentThread ? (
              viewingRecentThread.messages.map((message, index) => (
                <Message
                  key={index}
                  message={{
                    ...message,
                    persona_id: message.role === 'assistant' ? viewingRecentThread.persona_id : undefined,
                    persona_name: message.role === 'assistant' ? viewingRecentThread.persona_name : undefined,
                  }}
                  personas={personas}
                  showActionButtons={false}
                />
              ))
            ) : (
              <EmptyState>
                <EmptyStateTitle>대화를 선택해주세요</EmptyStateTitle>
                <EmptyStateText>왼쪽 사이드바에서 보고 싶은 대화를 클릭하세요.</EmptyStateText>
              </EmptyState>
            )}
          </ChatContent>

          <MessageInput
            onSendMessage={async () => false}
            disabled={true}
            placeholder="이 대화는 읽기 전용입니다. 대화를 이어가려면 '해당 대화로 이동' 버튼을 클릭하세요."
          />
        </>
      ) : selectedPersonaItem === 'training' ? (
        <TrainingCategoryView
          personas={personas}
          onSelectPersona={onSelectPersona || (() => {})}
          onInterpretationComplete={onInterpretationComplete}
        />
      ) : selectedPersonaItem === 'verbalization' ? (
        // 언어화 모드일 때 VerbalizationView 표시
        <VerbalizationView
          selectedThread={verbalizationProps?.selectedThread || null}
          threads={verbalizationProps?.threads || []}
          onThreadUpdate={verbalizationProps?.onThreadUpdate || (() => {})}
          onCreateNewThread={verbalizationProps?.onCreateNewThread || (async () => {})}
        />
      ) : selectedPersonaItem === 'admin' ? (
        <PersonaAdminPanel 
          onClose={() => {
            // 관리 모드 종료 시 PersonaSidebar로 돌아가기
            if (onSelectPersona) {
              onSelectPersona(''); // 빈 값으로 설정하여 PersonaSidebar의 selectedItem을 null로 만듦
            }
          }}
        />
      ) :       currentInterpretation && (selectedConversationItem === 'proceed' || selectedConversationItem?.startsWith('proceed-thread-')) ? (
        // 나아가기 모드일 때 ProceedView 사용
        renderProceedView()
      ) : currentInterpretation && (selectedConversationItem === 'sentence' || selectedConversationItem?.startsWith('sentence-thread-')) ? (
        // 문장 모드일 때 SentenceView 사용
        renderSentenceView()
      ) : currentInterpretation && (selectedConversationItem === 'interpretation' || selectedConversationItem?.startsWith('interpretation-thread-')) ? (
        // 해석 모드일 때 InterpretationView 사용
        renderInterpretationView()
      ) : currentInterpretation && selectedConversationItem === 'confusion' ? (
        // 더 혼란스럽게 모드일 때 ConfusionView 사용
        renderConfusionView()
      ) : currentInterpretation && selectedConversationItem === 'interaction_history' ? (
        // 상호작용 기록 모드일 때 InteractionHistoryView 사용
        renderInteractionHistoryView()
      ) : (
        <>
      <ChatContent ref={chatContentRef}>
        {/* {error && (
          <ErrorMessage onClick={onClearError}>
            {error} (클릭하여 닫기)
          </ErrorMessage>
        )} */}

            {!selectedConversation && !currentInterpretation && globalMessages.length === 0 && renderEmptyState()}
            {!selectedConversation && !currentInterpretation && globalMessages.length > 0 && renderInitialResponses()}
        {selectedConversation && renderConversation()}

        {isLoading && (
          selectedConversation && currentConversation ? (
            <LoadingMessage 
              personaName={personas[currentConversation.persona_id]?.name}
              personaColor={personas[currentConversation.persona_id]?.color}
            />
          ) : (
            <LoadingMessage 
              personaName="AI"
              personaColor="#666"
            />
          )
        )}
      </ChatContent>

      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading || Object.keys(personas).length === 0}
        placeholder={
          selectedConversation && currentConversation
            ? `${personas[currentConversation.persona_id]?.name}에게 메시지를 보내세요...`
            : "모든 페르소나에게 질문해보세요..."
        }
      />
        </>
      )}
    </MainArea>
  );
};

export default ChatArea; 