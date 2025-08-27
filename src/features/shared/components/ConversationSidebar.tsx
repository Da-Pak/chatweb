import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarTitle,
  SidebarContent,
  SidebarMenuContent,
  SidebarToggleButton,
} from '../styles/GlobalStyle';
import { chatApi } from '../api/chatApi';
import { TrainingThread, InteractionRecord } from '../types';
import styled from 'styled-components';

interface ConversationSidebarProps {
  selectedItem: string | null;
  onSelectItem: (itemId: string | null) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
  selectedPersonaName?: string;
  selectedPersonaId?: string;
  refreshTrigger?: number;
  mode?: 'persona' | 'recent' | 'verbalization';
  personas?: Record<string, any>;
  verbalizationThreads?: TrainingThread[];
  onSelectVerbalizationThread?: (thread: TrainingThread | null) => void;
  onRefreshTrigger?: () => void;
}

const AccordionContainer = styled.div`
  width: 100%;
`;

const AccordionItem = styled.div`
  border-bottom: 1px solid #f0f0f0;
`;

const AccordionHeader = styled.div<{ $isSelected: boolean; $isExpanded: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  background: ${props => props.$isSelected ? 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)' : 'transparent'};
  color: ${props => props.$isSelected ? 'white' : '#333'};
  font-weight: ${props => props.$isSelected ? '600' : '500'};
  border-radius: ${props => props.$isSelected ? '8px' : '0'};
  margin: ${props => props.$isSelected ? '4px 8px' : '0'};
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background: ${props => props.$isSelected ? 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)' : '#f8f9fa'};
  }
`;

const ThreadsList = styled.div<{ $isExpanded: boolean }>`
  max-height: ${props => props.$isExpanded ? '300px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: #f8f9fa;
`;

const ResizableContainer = styled.div<{ $isExpanded: boolean; $height: number }>`
  position: relative;
  height: ${props => props.$isExpanded ? `${props.$height}px` : '0'};
  min-height: ${props => props.$isExpanded ? '100px' : '0'};
  overflow: hidden;
  transition: height 0.3s ease;
  background: #f8f9fa;
  border-bottom: ${props => props.$isExpanded ? '2px solid #ddd' : 'none'};
  
  &:hover {
    border-bottom-color: ${props => props.$isExpanded ? '#6c757d' : 'transparent'};
  }
`;

const InteractionRecordsList = styled.div<{ $isExpanded: boolean }>`
  height: calc(100% - 6px);
  overflow-y: auto;
  padding: 8px;
  padding-bottom: 14px; /* resize handle을 위한 여유 공간 */
`;

const ResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  background: rgba(108, 117, 125, 0.3);
  z-index: 10;
  border-top: 1px solid #ddd;
  
  &:hover {
    background: #6c757d;
    border-top-color: #5a6268;
  }
  
  &:active {
    background: #5a6268;
    border-top-color: #495057;
  }
  
  /* 더 넓은 클릭 영역을 위한 가상 요소 */
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 0;
    right: 0;
    height: 12px;
    cursor: ns-resize;
  }
`;

const RecordThreadItem = styled.div<{ $isSelected: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  color: ${props => props.$isSelected ? '#6c757d' : '#666'};
  font-size: 13px;
  border-left: 2px solid ${props => props.$isSelected ? '#6c757d' : 'transparent'};
  background: ${props => props.$isSelected ? '#f0f0f0' : 'transparent'};
  transition: all 0.2s ease;
  margin: 2px 0;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  
  &:hover {
    background: #f0f0f0;
    color: #6c757d;
    border-color: #6c757d;
  }
`;

const ThreadTypeTag = styled.span<{ type: string }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  margin-right: 6px;
  background-color: #6c757d;
  color: white;
`;

const ThreadItem = styled.div<{ $isSelected: boolean }>`
  padding: 8px 32px 8px 32px;
  cursor: pointer;
  color: ${props => props.$isSelected ? '#6c757d' : '#666'};
  font-size: 14px;
  border-left: 3px solid ${props => props.$isSelected ? '#6c757d' : 'transparent'};
  background: ${props => props.$isSelected ? '#f8f9fa' : 'transparent'};
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background: #f8f9fa;
    color: #6c757d;
  }
`;

const ThreadItemContent = styled.div`
  flex: 1;
`;

const DeleteThreadButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e9ecef;
    color: #dc3545;
  }

  ${ThreadItem}:hover & {
    opacity: 1;
  }
`;

const ThreadTitle = styled.div`
  font-weight: 500;
  margin-bottom: 2px;
`;

const ThreadTime = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  selectedItem,
  onSelectItem,
  isCollapsed = false,
  onToggle,
  selectedPersonaName,
  selectedPersonaId,
  refreshTrigger,
  mode,
  personas,
  verbalizationThreads,
  onSelectVerbalizationThread,
  onRefreshTrigger,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<Record<string, TrainingThread[]>>({
    interpretation: [],
    proceed: [],
    sentence: []
  });
  const [interactionRecords, setInteractionRecords] = useState<InteractionRecord[]>([]);
  const [allRecentThreads, setAllRecentThreads] = useState<Array<TrainingThread & { persona_id: string; persona_name: string }>>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [interactionHeight, setInteractionHeight] = useState(300);
  const [, setIsResizing] = useState(false);

  const menuItems = mode === 'recent' 
    ? [] // 최근 상호작용 모드에서는 메뉴 아이템 없음
    : [
    { id: 'interpretation', name: '해석' },
    { id: 'proceed', name: '나아가기' },
    { id: 'sentence', name: '문장' },
    { id: 'confusion', name: '더 혼란스럽게' },
    { id: 'interaction_history', name: '상호작용 기록' },
  ];

  useEffect(() => {
    const loadData = async () => {
      if (mode === 'recent' && personas) {
        // 최근 상호작용 모드: 모든 페르소나의 스레드 + 언어화 스레드 로드
        try {
          const allPersonaThreads: Array<TrainingThread & { persona_id: string; persona_name: string }> = [];
          
          // 일반 페르소나 스레드 로드
          for (const [personaId, persona] of Object.entries(personas)) {
            try {
              const response = await chatApi.getPersonaThreads(personaId);
              if (response.data) {
                const threadsWithPersonaInfo = response.data.map((thread: TrainingThread) => ({
                  ...thread,
                  persona_id: personaId,
                  persona_name: persona.name,
                }));
                allPersonaThreads.push(...threadsWithPersonaInfo);
              }
            } catch (error) {
              console.error(`페르소나 ${personaId} 스레드 로드 실패:`, error);
            }
          }
          
          // 언어화 스레드 로드
          try {
            const verbalizationResponse = await chatApi.getVerbalizationThreads();
            if (verbalizationResponse.data) {
              const verbalizationThreadsWithInfo = verbalizationResponse.data.map((thread: TrainingThread) => ({
                ...thread,
                persona_id: "verbalization",
                persona_name: "언어화",
              }));
              allPersonaThreads.push(...verbalizationThreadsWithInfo);
            }
          } catch (error) {
            console.error('언어화 스레드 로드 실패:', error);
          }
          
          // 최신순으로 정렬 (updated_at이 있으면 우선, 없으면 created_at 사용)
          const sortedThreads = allPersonaThreads.sort((a, b) => {
            const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
            const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
            return timeB - timeA;
          });
          
          setAllRecentThreads(sortedThreads);
        } catch (error) {
          console.error('전체 스레드 로드 실패:', error);
        }
        return;
      }

      if (!selectedPersonaId) return;

      try {
        // 기존 페르소나 모드 로직
        const threadsResponse = await chatApi.getPersonaThreads(selectedPersonaId);
        if (threadsResponse.data) {
          const threadsByType = {
            interpretation: threadsResponse.data
              .filter((t: any) => t.thread_type === 'interpretation')
              .sort((a: any, b: any) => {
                const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
                const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
                return timeB - timeA;
              }),
            proceed: threadsResponse.data
              .filter((t: any) => t.thread_type === 'proceed')
              .sort((a: any, b: any) => {
                const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
                const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
                return timeB - timeA;
              }),
            sentence: threadsResponse.data
              .filter((t: any) => t.thread_type === 'sentence')
              .sort((a: any, b: any) => {
                const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
                const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
                return timeB - timeA;
              })
          };
          setThreads(threadsByType);
        }

        // 상호작용 기록 로드
        const recordsResponse = await chatApi.getAllInteractionRecords();
        if (recordsResponse.data) {
          const sortedRecords = recordsResponse.data.map((record: any) => ({
            ...record,
            threads: record.threads.sort((a: any, b: any) => {
              const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
              const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
              return timeB - timeA;
            })
          }));
          setInteractionRecords(sortedRecords);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      }
    };

    loadData();
  }, [selectedPersonaId, refreshTrigger, mode, personas]);

  const handleAccordionToggle = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
    
    if (itemId === 'interaction_history') {
      onSelectItem(itemId);
    } else if (itemId === 'confusion') {
      // 더 혼란스럽게는 스레드 없이 바로 선택
      onSelectItem(itemId);
    } else {
      const itemThreads = threads[itemId as keyof typeof threads] || [];
      if (itemThreads.length === 0) {
        onSelectItem(itemId);
      } else {
        const latestThread = itemThreads[0];
        setSelectedThreadId(latestThread.id);
        onSelectItem(`${itemId}-thread-${latestThread.id}`);
      }
    }
  };

  const handleRecordThreadSelect = (thread: TrainingThread) => {
    setSelectedThreadId(thread.id);
    onSelectItem(`${thread.thread_type}-thread-${thread.id}`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = interactionHeight;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(100, Math.min(600, startHeight + deltaY));
      setInteractionHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const handleThreadSelect = async (threadId: string, itemType: string) => {
    console.log('=== 스레드 선택 시작 ===');
    console.log('선택된 스레드 ID:', threadId);
    console.log('스레드 타입:', itemType);
    
    setSelectedThreadId(threadId);
    
    // 스레드 선택 시 최신 데이터로 새로고침
    try {
      if (selectedPersonaId) {
        console.log('스레드 선택으로 인한 데이터 새로고침');
        const threadsResponse = await chatApi.getPersonaThreads(selectedPersonaId);
        if (threadsResponse.data) {
          const updatedThreads = threadsResponse.data;
          
          // 스레드 데이터 업데이트
          const threadsByType = {
            interpretation: updatedThreads.filter(t => t.thread_type === 'interpretation'),
            proceed: updatedThreads.filter(t => t.thread_type === 'proceed'),
            sentence: updatedThreads.filter(t => t.thread_type === 'sentence')
          };
          
          setThreads(threadsByType);
          console.log('스레드 데이터 업데이트 완료:', {
            interpretation: threadsByType.interpretation.length,
            proceed: threadsByType.proceed.length,
            sentence: threadsByType.sentence.length
          });
          
          // 선택된 스레드의 최신 상태 확인
          const selectedThread = updatedThreads.find(t => t.id === threadId);
          if (selectedThread) {
            console.log('선택된 스레드 최신 상태:', {
              messageCount: selectedThread.messages?.length || 0,
              lastUpdate: selectedThread.updated_at
            });
          }
        }
      }
    } catch (error) {
      console.error('스레드 선택 시 데이터 새로고침 실패:', error);
    }
    
    // 선택 완료
    onSelectItem(`${itemType}-thread-${threadId}`);
    console.log('=== 스레드 선택 완료 ===');
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 스레드를 삭제하시겠습니까?')) {
      try {
        console.log('=== 스레드 삭제 시작 ===');
        console.log('삭제할 threadId:', threadId);
        console.log('현재 mode:', mode);
        
        const result = await chatApi.deleteThread(threadId);
        console.log('API 응답:', result);
        console.log('result.data:', result.data);
        console.log('result.error:', result.error);
        
        if (result.data && result.data.success) {
          console.log('삭제 성공');
          if (mode === 'verbalization') {
            // 언어화 모드인 경우: 부모 컴포넌트에 업데이트 요청
            // verbalizationThreads는 props로 받아오므로 직접 수정하지 않고 부모에게 알림
            // 삭제된 스레드가 현재 선택된 스레드인 경우 선택 해제
            if (selectedThreadId === threadId) {
              setSelectedThreadId(null);
              if (onSelectVerbalizationThread) {
                onSelectVerbalizationThread(null);
              }
            }
            // refreshTrigger를 통해 부모 컴포넌트에 업데이트 요청
            // (App.tsx에서 verbalizationThreads를 다시 로드하게 됨)
            if (onRefreshTrigger) {
              onRefreshTrigger();
            }
          } else {
            // 일반 페르소나 모드인 경우: 기존 로직 유지
          const updatedThreads = { ...threads };
          Object.keys(updatedThreads).forEach(key => {
              updatedThreads[key as keyof typeof threads] = updatedThreads[key as keyof typeof threads].filter((t: any) => t.id !== threadId);
          });
          setThreads(updatedThreads);
          
          if (selectedThreadId === threadId) {
            setSelectedThreadId(null);
          }
          }
          console.log('UI 업데이트 완료');
        } else {
          console.error('삭제 실패:', result.error || result.data?.message);
          let errorMessage = '스레드 삭제에 실패했습니다';
          
          if (result.error) {
            if (result.error.includes('네트워크 오류') || result.error.includes('Failed to fetch')) {
              errorMessage += ': 백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
            } else {
              errorMessage += ': ' + result.error;
            }
          } else if (result.data?.message) {
            errorMessage += ': ' + result.data.message;
          }
          
          alert(errorMessage);
        }
      } catch (error) {
        console.error('스레드 삭제 실패:', error);
        alert('스레드 삭제 중 예상치 못한 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  const getThreadTypeLabel = (type: string) => {
    switch (type) {
      case 'interpretation': return '해석';
      case 'proceed': return '나아가기';
      case 'sentence': return '문장';
      case 'verbalization': return '언어화';
      default: return type;
    }
  };

  const getThreadContent = (thread: TrainingThread) => {
    if (thread.messages && thread.messages.length > 0) {
      const firstMessage = thread.messages[0];
      return firstMessage.content.length > 30 
        ? firstMessage.content.substring(0, 30) + '...' 
        : firstMessage.content;
    }
    return thread.content?.length > 30 
      ? thread.content.substring(0, 30) + '...' 
      : thread.content || '내용 없음';
  };

  const renderThreads = (itemId: string) => {
    const itemThreads = threads[itemId as keyof typeof threads] || [];
    const isExpanded = expandedItems.has(itemId);

    return (
      <ThreadsList $isExpanded={isExpanded}>
        {itemThreads.map((thread: any, index: number) => (
          <ThreadItem
            key={thread.id}
            $isSelected={selectedThreadId === thread.id}
            onClick={() => handleThreadSelect(thread.id, itemId)}
          >
            <ThreadItemContent>
              <ThreadTitle>
                {itemId === 'interpretation' && `해석 #${itemThreads.length - index}`}
                {itemId === 'proceed' && `나아가기 #${itemThreads.length - index}`}
                {itemId === 'sentence' && `문장 #${itemThreads.length - index}`}
              </ThreadTitle>
              <ThreadTime>
                {formatTime(thread.created_at)} • {thread.messages.length}개 메시지
              </ThreadTime>
            </ThreadItemContent>
            <DeleteThreadButton
              onClick={(e) => handleDeleteThread(thread.id, e)}
              title="스레드 삭제"
            >
              🗑️
            </DeleteThreadButton>
          </ThreadItem>
        ))}
        {itemThreads.length === 0 && (
          <div style={{ padding: '16px 32px', fontSize: '14px', color: '#999' }}>
            스레드가 없습니다
          </div>
        )}
      </ThreadsList>
    );
  };

  const renderInteractionRecords = () => {
    const isExpanded = expandedItems.has('interaction_history');
    
    // 현재 선택된 페르소나의 기록만 필터링
    const currentPersonaRecord = interactionRecords.find(
      record => record.persona_id === selectedPersonaId
    );

    return (
      <ResizableContainer 
        $isExpanded={isExpanded}
        $height={interactionHeight}
      >
        {isExpanded && (
          <>
            <InteractionRecordsList $isExpanded={isExpanded}>
              {currentPersonaRecord ? (
                currentPersonaRecord.threads.map((thread) => (
                  <RecordThreadItem
                    key={thread.id}
                    $isSelected={selectedThreadId === thread.id}
                    onClick={() => handleRecordThreadSelect(thread)}
                  >
                    <div>
                      <ThreadTypeTag type={thread.thread_type}>
                        {getThreadTypeLabel(thread.thread_type)}
                      </ThreadTypeTag>
                      {getThreadContent(thread)}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                      {formatTime(thread.created_at)}
                    </div>
                  </RecordThreadItem>
                ))
              ) : (
                <div style={{ padding: '16px', fontSize: '14px', color: '#999', textAlign: 'center' }}>
                  이 페르소나의 상호작용 기록이 없습니다
                </div>
              )}
            </InteractionRecordsList>
            <ResizeHandle onMouseDown={handleMouseDown} />
          </>
        )}
      </ResizableContainer>
    );
  };

  const getThreadTitle = (thread: TrainingThread) => {
    let content = '';
    
    if (thread.messages && thread.messages.length > 0) {
      const firstUserMessage = thread.messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        content = firstUserMessage.content;
      } else if (thread.messages[0]) {
        content = thread.messages[0].content;
      }
    } else if (thread.content) {
      content = thread.content;
    }
    
    if (content.length > 50) {
      return content.substring(0, 50) + '...';
    }
    return content || '내용 없음';
  };

  return (
    <Sidebar width="250px" $isCollapsed={isCollapsed} $variant="conversation">
      {onToggle && (
        <SidebarToggleButton onClick={onToggle}>
        </SidebarToggleButton>
      )}

      <SidebarHeader $isCollapsed={isCollapsed}>
        {mode === 'recent' ? (
          <SidebarTitle $isCollapsed={isCollapsed}>
            전체 상호작용
          </SidebarTitle>
        ) : mode === 'verbalization' ? (
          <SidebarTitle $isCollapsed={isCollapsed}>
            언어화 대화
          </SidebarTitle>
        ) : selectedPersonaName ? (
          <SidebarTitle $isCollapsed={isCollapsed}>
            {selectedPersonaName}
          </SidebarTitle>
        ) : null}
      </SidebarHeader>

      <SidebarContent $isCollapsed={isCollapsed}>
        <SidebarMenuContent $variant="conversation">
          {mode === 'recent' ? (
            // 최근 상호작용 모드: 스레드 목록 직접 표시
            <div style={{ padding: '16px 0' }}>
              {allRecentThreads.map((thread) => (
                <ThreadItem
                  key={`${thread.persona_id}-${thread.id}`}
                  $isSelected={selectedThreadId === thread.id}
                  onClick={() => {
                    setSelectedThreadId(thread.id);
                    onSelectItem(`recent-thread::${thread.id}::${thread.persona_id}`);
                  }}
                >
                  <ThreadItemContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        padding: '2px 6px',
                        background: '#ffffff',
                        color: '#000000',
                        border: '1px solid #000000',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                      }}>
                        {thread.persona_name}
                      </span>
                      <ThreadTypeTag type={thread.thread_type}>
                        {getThreadTypeLabel(thread.thread_type)}
                      </ThreadTypeTag>
                    </div>
                    <ThreadTitle>
                      {getThreadTitle(thread)}
                    </ThreadTitle>
                    <ThreadTime>
                      {formatTime(thread.created_at)} • {thread.messages?.length || 0}개 메시지
                    </ThreadTime>
                  </ThreadItemContent>
                </ThreadItem>
              ))}
              {allRecentThreads.length === 0 && (
                <div style={{ padding: '16px 32px', fontSize: '14px', color: '#999', textAlign: 'center' }}>
                  상호작용 기록이 없습니다
                </div>
              )}
            </div>
          ) : mode === 'verbalization' ? (
            // 언어화 모드: 언어화 스레드 목록 표시
            <div style={{ padding: '16px 0' }}>
              {verbalizationThreads && [...verbalizationThreads]
                .sort((a, b) => {
                  const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
                  const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
                  return timeB - timeA;
                })
                .map((thread, index) => (
                <ThreadItem
                  key={thread.id}
                  $isSelected={selectedThreadId === thread.id}
                  onClick={() => {
                    setSelectedThreadId(thread.id);
                    if (onSelectVerbalizationThread) {
                      onSelectVerbalizationThread(thread);
                    }
                  }}
                >
                  <ThreadItemContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        padding: '2px 6px',
                        background: '#ffffff',
                        color: '#000000',
                        border: '1px solid #000000',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                      }}>
                        언어화
                      </span>
                    </div>
                    <ThreadTitle>
                      언어화 #{verbalizationThreads.length - index}
                    </ThreadTitle>
                    <ThreadTime>
                      {formatTime(thread.created_at)} • {thread.messages?.length || 0}개 메시지
                    </ThreadTime>
                  </ThreadItemContent>
                  <DeleteThreadButton
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    title="스레드 삭제"
                  >
                    🗑️
                  </DeleteThreadButton>
                </ThreadItem>
              ))}
              {(!verbalizationThreads || verbalizationThreads.length === 0) && (
                <div style={{ padding: '16px 32px', fontSize: '14px', color: '#999', textAlign: 'center' }}>
                  언어화 대화가 없습니다.<br />
                  새 대화를 시작해보세요!
                </div>
              )}
            </div>
          ) : (
            // 기존 페르소나 모드: 아코디언 메뉴
          <AccordionContainer>
            {menuItems.map((item) => (
              <AccordionItem key={item.id}>
                <AccordionHeader
                    $isSelected={selectedItem === item.id}
                    $isExpanded={expandedItems.has(item.id)}
                  onClick={() => handleAccordionToggle(item.id)}
                >
                    <span>{item.name}</span>
                </AccordionHeader>
                
                  {item.id === 'interaction_history' 
                    ? renderInteractionRecords()
                    : item.id === 'confusion' 
                    ? null // 더 혼란스럽게는 스레드 목록을 표시하지 않음
                    : renderThreads(item.id)
                  }
              </AccordionItem>
            ))}
          </AccordionContainer>
          )}
        </SidebarMenuContent>
      </SidebarContent>
    </Sidebar>
  );
};

export default ConversationSidebar; 