import { useState, useEffect, useCallback } from 'react';
import { ChatState, GlobalMessage, Conversation } from '../types';
import { chatApi } from '../api/chatApi';

const initialState: ChatState = {
  personas: {},
  globalMessages: [],
  conversations: {},
  selectedConversation: null,
  selectedPersona: null,
  isLoading: false,
};

export const useChat = () => {
  const [state, setState] = useState<ChatState>(initialState);
  const [error, setError] = useState<string | null>(null);

  // 페르소나 정보 로드
  const loadPersonas = useCallback(async () => {
    const result = await chatApi.getPersonas();
    if (result.data) {
      setState(prev => ({ ...prev, personas: result.data! }));
    } else {
      setError(result.error || '페르소나 정보를 불러올 수 없습니다.');
    }
  }, []);

  // 글로벌 메시지 로드
  const loadGlobalMessages = useCallback(async () => {
    const result = await chatApi.getGlobalMessages();
    if (result.data) {
      setState(prev => ({ ...prev, globalMessages: result.data! }));
    }
  }, []);

  // 대화 목록 로드
  const loadConversations = useCallback(async () => {
    const result = await chatApi.getAllConversations();
    if (result.data) {
      const conversationsMap = result.data!.reduce((acc, conv) => {
        acc[conv.id] = conv;
        return acc;
      }, {} as Record<string, Conversation>);
      setState(prev => ({ ...prev, conversations: conversationsMap }));
    }
  }, []);

  // 초기 메시지 전송 (모든 페르소나 응답)
  const sendInitialMessage = useCallback(async (content: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const result = await chatApi.sendInitialMessage(content);
      if (result.data) {
        // 글로벌 메시지 추가
        const newGlobalMessage: GlobalMessage = {
          id: result.data.message_id,
          user_message: content,
          responses: result.data.responses,
          timestamp: new Date().toISOString(),
        };

        setState(prev => ({
          ...prev,
          globalMessages: [...prev.globalMessages, newGlobalMessage],
          isLoading: false,
        }));

        // 각 페르소나에 대한 대화 생성
        result.data.responses.forEach(response => {
          const conversationId = `${result.data!.message_id}_${response.persona_id}`;
          const newConversation: Conversation = {
            id: conversationId,
            persona_id: response.persona_id,
            messages: [
              {
                role: 'user',
                content: content,
                timestamp: new Date().toISOString(),
              },
              {
                role: 'assistant',
                content: response.content,
                timestamp: response.timestamp,
                persona_id: response.persona_id,
                persona_name: response.persona_name,
              },
            ],
            created_at: new Date().toISOString(),
          };

          setState(prev => ({
            ...prev,
            conversations: {
              ...prev.conversations,
              [conversationId]: newConversation,
            },
          }));
        });

        return true;
      } else {
        setError(result.error || '메시지 전송에 실패했습니다.');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (err) {
      setError('메시지 전송 중 오류가 발생했습니다.');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  // 특정 페르소나와 대화 이어가기
  const continueConversation = useCallback(async (
    conversationId: string,
    message: string
  ) => {
    const conversation = state.conversations[conversationId];
    if (!conversation) {
      setError('대화를 찾을 수 없습니다.');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const result = await chatApi.continueConversation(
        conversation.persona_id,
        message,
        conversationId
      );

      if (result.data) {
        // 새 메시지들을 대화에 추가
        const userMessage: any = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };

        const assistantMessage: any = {
          role: 'assistant',
          content: result.data.content,
          timestamp: result.data.timestamp,
          persona_id: result.data.persona_id,
          persona_name: result.data.persona_name,
        };

        setState(prev => ({
          ...prev,
          conversations: {
            ...prev.conversations,
            [conversationId]: {
              ...prev.conversations[conversationId],
              messages: [
                ...prev.conversations[conversationId].messages,
                userMessage,
                assistantMessage,
              ],
            },
          },
          isLoading: false,
        }));

        return true;
      } else {
        setError(result.error || '대화 이어가기에 실패했습니다.');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (err) {
      setError('대화 이어가기 중 오류가 발생했습니다.');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.conversations]);

  // 대화 업데이트
  const updateConversation = useCallback((conversationId: string, updatedConversation: Conversation) => {
    setState(prev => ({
      ...prev,
      conversations: {
        ...prev.conversations,
        [conversationId]: updatedConversation,
      },
    }));
  }, []);

  // 대화 선택
  const selectConversation = useCallback((conversationId: string | null) => {
    setState(prev => ({ ...prev, selectedConversation: conversationId }));
  }, []);

  // 페르소나 선택
  const selectPersona = useCallback((personaId: string | null) => {
    setState(prev => ({ ...prev, selectedPersona: personaId }));
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 특정 페르소나의 대화 목록 가져오기
  const getPersonaConversations = useCallback((personaId: string) => {
    return Object.values(state.conversations).filter(
      conv => conv.persona_id === personaId
    );
  }, [state.conversations]);

  // 현재 선택된 대화 가져오기
  const getCurrentConversation = useCallback(() => {
    return state.selectedConversation 
      ? state.conversations[state.selectedConversation]
      : null;
  }, [state.selectedConversation, state.conversations]);

  // 초기 로드
  useEffect(() => {
    loadPersonas();
    loadGlobalMessages();
    loadConversations();
  }, [loadPersonas, loadGlobalMessages, loadConversations]);

  return {
    // State
    personas: state.personas,
    globalMessages: state.globalMessages,
    conversations: state.conversations,
    selectedConversation: state.selectedConversation,
    selectedPersona: state.selectedPersona,
    isLoading: state.isLoading,
    error,

    // Actions
    sendInitialMessage,
    continueConversation,
    updateConversation,
    selectConversation,
    selectPersona,
    clearError,
    loadPersonas,
    loadGlobalMessages,
    loadConversations,

    // Computed
    getPersonaConversations,
    getCurrentConversation,
  };
}; 