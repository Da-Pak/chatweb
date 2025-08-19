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

interface SentenceViewProps {
  personaId: string;
  personaName: string;
  sentenceContent: string;
  threads: TrainingThread[];
  onSwitchToMode: (mode: 'interpretation' | 'proceed' | 'sentence') => void;
  onGenerateNewInterpretation: () => void;
  selectedThread: TrainingThread | null;
  onRefreshThreads?: () => void;
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

const SentenceView: React.FC<SentenceViewProps> = ({
  personaId,
  personaName,
  sentenceContent,
  threads,
  onSwitchToMode,
  onGenerateNewInterpretation,
  selectedThread,
  onRefreshThreads,
}) => {
  const [activeThread, setActiveThread] = useState<TrainingThread | null>(selectedThread || null);
  const [isLoading, setIsLoading] = useState(false);
  const [localThreads, setLocalThreads] = useState<TrainingThread[]>(threads);
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

  // 문장 타입의 스레드만 필터링
  const sentenceThreads = localThreads.filter(thread => thread.thread_type === 'sentence');

  useEffect(() => {
    setLocalThreads(threads);
  }, [threads]);

  // 선택된 스레드 변경 시 처리
  useEffect(() => {
    if (selectedThread) {
      console.log('선택된 스레드 변경:', selectedThread.id);
      setActiveThread(selectedThread);
      
      // 스레드별 문장 데이터 로딩
      loadThreadSentenceData(selectedThread.id);
    }
  }, [selectedThread]);

  // 스레드별 문장 데이터 로딩 (백엔드 API만 사용)
  const loadThreadSentenceData = async (threadId: string) => {
    try {
      console.log('=== 문장 스레드 데이터 로딩 시작 ===');
      console.log('스레드 ID:', threadId);
      
      // 백엔드에서 스레드 데이터 로딩
      const data = await sentenceApi.getThreadSentenceData(threadId);
      
      console.log('로딩된 메모:', Object.keys(data.memos).length, '개');
      console.log('로딩된 하이라이트:', data.highlights.length, '개');
      
      // 백엔드 데이터로 상태 설정
      setMemos(data.memos);
      setHighlightedSentences(new Set(data.highlights));
      
      console.log('=== 문장 스레드 데이터 로딩 완료 ===');
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
  }, [activeThread?.messages]);

  const handleSendMessage = async (message: string): Promise<boolean> => {
    // 선택된 스레드가 없으면 기본 스레드 생성
    let currentThread = activeThread;
    if (!currentThread) {
      // 문장 타입의 첫 번째 스레드를 찾거나 기본 스레드 생성
      const sentenceThread = sentenceThreads[0];
      if (sentenceThread) {
        currentThread = sentenceThread;
        setActiveThread(currentThread);
      } else {
        // 기본 스레드 생성 (UI용)
        const defaultThread: TrainingThread = {
          id: `sentence_default_${personaId}`,
          persona_id: personaId,
          thread_type: 'sentence',
          content: sentenceContent,
          messages: [{
            role: 'assistant',
            content: sentenceContent,
            timestamp: new Date().toISOString(),
            persona_id: personaId,
            persona_name: personaName
          }],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        currentThread = defaultThread;
        setActiveThread(currentThread);
        
        // 로컬 스레드 목록에도 추가
        const updatedThreads = [...localThreads, defaultThread];
        setLocalThreads(updatedThreads);
        onRefreshThreads?.();
      }
    }
    
    // 1. 사용자 메시지를 즉시 UI에 추가
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    const updatedThread = {
      ...currentThread,
      messages: [...currentThread.messages, userMessage],
      updated_at: new Date().toISOString()
    };
    
    setActiveThread(updatedThread);
    
    // 2. 로딩 상태 시작
    setIsLoading(true);
    
    try {
      // 3. 백엔드 API 호출
      const response = await chatApi.chatWithThread({
        thread_id: currentThread.id,
        user_message: message
      });

      if (response.data && response.data.success) {
        // 4. AI 응답을 UI에 추가
        const assistantMessage = {
          role: 'assistant' as const,
          content: response.data.new_response.content,
          timestamp: response.data.new_response.timestamp,
          persona_id: response.data.new_response.persona_id || personaId,
          persona_name: response.data.new_response.persona_name || personaName
        };

        const finalUpdatedThread = {
          ...response.data.thread,
          messages: [...response.data.thread.messages, assistantMessage],
        };
        
        setActiveThread(finalUpdatedThread);
        
        // 5. 로컬 스레드 목록도 업데이트
        const updatedThreads = localThreads.map(t => 
          t.id === currentThread!.id ? finalUpdatedThread : t
        );
        setLocalThreads(updatedThreads);
        onRefreshThreads?.();
        
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
    if (!activeThread?.id) {
      showCopyToast('스레드가 선택되지 않았습니다');
      return false;
    }

    try {
      setIsLoading(true);
      
      // 백엔드 API 호출
      const response = await chatApi.editThreadMessage(activeThread.id, messageIndex, newContent);
      
      if (response.data?.success && response.data.updated_thread) {
        // 스레드 업데이트
        setActiveThread(response.data.updated_thread);
        
        // 로컬 스레드 목록도 업데이트
        const updatedThreads = localThreads.map(t => 
          t.id === activeThread.id ? response.data!.updated_thread! : t
        );
        setLocalThreads(updatedThreads);
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
    if (activeThread?.messages) {
      const message = activeThread.messages.find(m => m.timestamp === timestamp);
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
        thread_id: activeThread?.id,
        thread_type: 'sentence',
        content: memo,
        sentence_content: sentenceContent,
        source_message_id: `sentence_${personaId}`,
        // 백엔드 자동 저장을 위한 추가 정보
        persona_id: personaId,
        tags: ['sentence', ...(personaId ? [personaId] : [])],
        source_conversation_id: activeThread?.id,
        source_thread_id: activeThread?.id,
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
  const sentenceMenuActions = useSentenceMenu({
    personaId: personaId || '',
    threadType: 'sentence',
    selectedThread: activeThread,
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
      const response = await chatApi.saveCurrentAsInterpretation(personaId, messageContent);
      
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
      const response = await chatApi.saveCurrentAsProceed(personaId, messageContent);
      
      if (response.data) {
        // 스레드 새로고침 (나아가기 모드로 전환하지 않고 백그라운드에서만 저장)
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
      const response = await chatApi.saveCurrentAsSentence(personaId, messageContent);

      if (response.data) {
        // 스레드 새로고침
        onRefreshThreads?.();
        showCopyToast('메시지가 문장 스레드에 저장되었습니다');
      } else {
        showCopyToast('문장 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('문장 저장 중 오류:', error);
      showCopyToast('문장 저장에 실패했습니다');
    }
  };
          
  // 스레드 새로고침 함수
  const handleRefreshThreads = async () => {
          try {
            const threadsResponse = await chatApi.getPersonaThreads(personaId);
            if (threadsResponse.data) {
              const updatedThreads = threadsResponse.data;
              setLocalThreads(updatedThreads);
              onRefreshThreads?.();
              
              // 새로 생성된 문장 스레드 선택
              const newSentenceThread = updatedThreads
                .filter(t => t.thread_type === 'sentence')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              
        if (newSentenceThread && (!activeThread || newSentenceThread.id !== activeThread.id)) {
                setActiveThread(newSentenceThread);
          showCopyToast('새로운 문장이 생성되었습니다');
        }
      }
    } catch (error) {
      console.error('스레드 새로고침 실패:', error);
    }
  };

  // FloatingActionButton 메뉴 액션 처리
  const handleMenuAction = async (action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy') => {
    const selectedIds = Array.from(selectedSentences);
    const selectedTexts = selectedIds.map(id => {
      // sentenceId에서 실제 문장 텍스트를 찾아내는 로직
      const [timestamp, , sentenceIndex] = id.split('_');
      const message = activeThread?.messages.find(m => m.timestamp === timestamp);
      if (message) {
        const sentences = message.content.split(/[\n.]+/).map(s => s.trim()).filter(s => s.length > 0);
        return sentences[parseInt(sentenceIndex)] || '';
      }
      return '';
    }).filter(text => text.length > 0);

    switch (action) {
      case 'sendToInput':
        if (messageInputRef.current && selectedTexts.length > 0) {
          const formattedText = selectedTexts.map(text => `"${text}"`).join(', ');
          messageInputRef.current.insertText(formattedText);
        }
        break;
      
      case 'saveToVault':
        try {
          // 선택된 문장들의 하이라이트/메모 상태 수집
          const highlightStates: boolean[] = [];
          const highlightColors: (string | null)[] = [];
          const memoContents: (string | null)[] = [];
          
          for (const sentenceId of selectedIds) {
            const isHighlighted = highlightedSentences.has(sentenceId);
            const memoContent = memos[sentenceId] || null;
            
            highlightStates.push(isHighlighted);
            highlightColors.push(isHighlighted ? 'yellow' : null);
            memoContents.push(memoContent);
          }

          await sentenceApi.saveSentencesToVault({
            sentences: selectedTexts,
            source_message_id: `sentence_${personaId}`,
            source_conversation_id: activeThread?.id,
            source_thread_id: activeThread?.id,
            source_thread_type: 'sentence',
            source_sentence_ids: selectedIds,
            tags: ['sentence', personaId],
            highlight_states: highlightStates,
            highlight_colors: highlightColors,
            memo_contents: memoContents
          });
          
          // 백엔드에 하이라이트도 저장 (기존 로직 유지)
          if (activeThread?.id) {
            for (const sentenceId of selectedIds) {
              await sentenceApi.createHighlight({
                sentence_id: sentenceId,
                thread_id: activeThread.id,
                thread_type: 'sentence'
              });
            }
          }
          
          // 성공 시 로컬 상태 업데이트
          setHighlightedSentences(prev => new Set([...Array.from(prev), ...selectedIds]));
          
          showCopyToast('저장고에 저장되었습니다 (하이라이트/메모 정보 포함)');
        } catch (error) {
          console.error('저장고 저장 실패:', error);
          showCopyToast('저장고 저장에 실패했습니다');
        }
        break;
      
      case 'addMemo':
        // 새로운 통합된 메뉴 액션 사용
        await sentenceMenuActions.handleAddMemo(selectedIds, selectedTexts);
        break;
      
      case 'highlight':
        if (selectedIds.length > 0 && activeThread?.id) {
          try {
            console.log('하이라이트 토글 시작:', selectedIds);
            
            // 현재 하이라이트된 문장들과 선택된 문장들을 비교
            const currentlyHighlighted = selectedIds.filter(id => highlightedSentences.has(id));
            const notHighlighted = selectedIds.filter(id => !highlightedSentences.has(id));
            
            console.log('현재 하이라이트된 문장들:', currentlyHighlighted);
            console.log('아직 하이라이트되지 않은 문장들:', notHighlighted);
            
            if (currentlyHighlighted.length > 0) {
              // 일부가 하이라이트되어 있으면 모두 제거
              console.log('기존 하이라이트 제거 중...');
              
              // 로컬 상태에서 하이라이트 제거
              setHighlightedSentences(prev => {
                const newSet = new Set(prev);
                selectedIds.forEach(id => newSet.delete(id));
                return newSet;
              });
              
              // 백엔드에서 하이라이트 삭제
              for (const sentenceId of selectedIds) {
                try {
                  await sentenceApi.deleteHighlight(sentenceId);
                } catch (error) {
                  console.warn('백엔드 하이라이트 삭제 실패:', error);
                }
              }
              
              showCopyToast('하이라이트가 제거되었습니다');
            } else {
              // 모두 하이라이트되지 않았으면 모두 추가
              console.log('새 하이라이트 추가 중...');
              
              // 로컬 상태에 하이라이트 추가
              setHighlightedSentences(prev => new Set([...Array.from(prev), ...selectedIds]));
              
              // 백엔드에 하이라이트 저장
              for (const sentenceId of selectedIds) {
                try {
                  await sentenceApi.createHighlight({
                    sentence_id: sentenceId,
                    thread_id: activeThread.id,
                    thread_type: 'sentence'
                  });
                } catch (error) {
                  console.warn('백엔드 하이라이트 저장 실패:', error);
                }
              }
              
              showCopyToast('하이라이트가 추가되었습니다');
            }
          } catch (error) {
            console.error('하이라이트 토글 실패:', error);
            showCopyToast('하이라이트 처리에 실패했습니다');
          }
        }
        break;
      
      case 'copy':
        if (selectedTexts.length > 0) {
          await copyToClipboard(selectedTexts.join(' '), '선택된 문장이 복사되었습니다');
        }
        break;
    }

    // 모든 선택 해제
    setSelectedSentences(new Set());
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
          {!activeThread || activeThread.messages.length === 0 ? (
            <EmptyChat>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
              <div>문장에 대해 더 자세히 질문해보세요</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                {personaName}와 대화를 나눌 수 있습니다
              </div>
            </EmptyChat>
          ) : (
            activeThread.messages.map((message, index) => 
              message.role === 'user' ? (
                <Message
                  key={`sentence_${index}`}
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
                  key={`sentence_${index}`}
                  message={{
                    ...message,
                    persona_id: 'current_persona',
                    persona_name: personaName,
                  }}
                  personas={{
                    current_persona: {
                      name: personaName,
                      description: '',
                      color: '#4caf50',
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
            )
          )}
          
          {isLoading && (
            <LoadingMessage 
              personaName={personaName}
              personaColor="#4caf50"
              customMessage="응답 생성중..."
            />
          )}
        </ChatMessages>

        <ChatInputSection>
          <MessageInput
            ref={messageInputRef}
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder={`${personaName}에게 문장에 대해 질문해보세요...`}
            onToggleSentenceMode={handleToggleSentenceMode}
            isSentenceModeActive={isSentenceModeActive}
            hasSelectedSentences={selectedSentences.size > 0}
            currentInterpretation={activeThread?.content || sentenceContent}
            personaId={personaId}
            onGenerateProceed={handlePersonAction}
            onGenerateSentence={handleDocumentAction}
            currentChatMessages={activeThread?.messages}
            onRefreshThreads={handleRefreshThreads}
          />
        </ChatInputSection>
      </ChatSection>
      
      <FloatingActionButton
        show={isSentenceModeActive && selectedSentences.size > 0}
        onMenuAction={handleMenuAction}
        personaId={personaId}
        currentInterpretation={sentenceContent}
      />
    </Container>
  );
};

export default SentenceView; 