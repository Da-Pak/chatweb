import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { sentenceApi, SentenceVaultItem } from '../../training/api/sentenceApi';

import { Persona } from '../../shared/types';

interface SentenceVaultViewProps {
  personas: Record<string, Persona>;
  onNavigateToPersona: (personaId: string, mode: 'sentence') => void;
  onNavigateToThread: (threadId: string, threadType: string, interactionMessage?: string) => void;
  onNavigateToPersonaWithSentence?: (personaId: string, mode: 'sentence', selectedSentence: string) => void;
}

interface ContextMenu {
  x: number;
  y: number;
  sentence: SentenceVaultItem;
}

interface ConfirmationModalData {
  type: 'interact' | 'delete';
  sentence: SentenceVaultItem;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

const FilterDropdownButton = styled.button<{ $isOpen: boolean }>`
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: space-between;
  
  &:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }
  
  .arrow {
    font-size: 12px;
    transition: transform 0.2s;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`;

const FilterDropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  margin-top: 4px;
  min-width: 150px;
`;

const FilterDropdownItem = styled.div<{ $isSelected: boolean }>`
  padding: 8px 16px;
  cursor: pointer;
  color: #333;
  background: ${props => props.$isSelected ? '#e9ecef' : 'transparent'};
  font-weight: ${props => props.$isSelected ? '500' : 'normal'};
  
  &:hover {
    background: #e9ecef;
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const FilterContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NavigationButton = styled.button`
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid #dee2e6;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #333;
  
  &:hover {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #ffffff;
`;

const SentenceGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SentenceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SentenceRow = styled.div<{ $isPinned: boolean; $isHighlighted?: boolean }>`
  width: 100%;
  background: ${props => props.$isHighlighted 
    ? 'linear-gradient(135deg, #fff9c4 0%, #ffeaa7 100%)' 
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
  };
  border: 1px solid ${props => props.$isHighlighted ? '#ffc107' : '#dee2e6'};
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  min-height: 60px;
  display: flex;
  align-items: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
    border-color: ${props => props.$isHighlighted ? '#ffb300' : '#adb5bd'};
    background: ${props => props.$isHighlighted
      ? 'linear-gradient(135deg, #fff3cd 0%, #ffd60a 100%)'
      : 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)'
    };
  }
  
  ${props => props.$isPinned && `
    background: ${props.$isHighlighted 
      ? 'linear-gradient(135deg, #fff9c4 0%, #ffeaa7 100%)' 
      : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
    };
    border-color: ${props.$isHighlighted ? '#ffc107' : '#dee2e6'};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: ${props.$isHighlighted
        ? 'linear-gradient(135deg, #fff3cd 0%, #ffd60a 100%)'
        : 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)'
      };
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: ${props.$isHighlighted ? '#ffb300' : '#adb5bd'};
    }
  `}
`;

const SentenceContent = styled.div`
  flex: 1;
  padding-bottom: ${props => 
    // 메모가 있으면 하단 여백 추가
    'var(--has-memo, 0px)'
  };
`;

const SentenceText = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
  font-weight: 500;
`;

const SentenceMetaExternal = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 12px;
  color: #6c757d;
  gap: 8px;
`;

const PersonaLabel = styled.span`
  background: #e9ecef;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
  color: #495057;
`;

const DateLabel = styled.span`
  font-style: italic;
  opacity: 0.8;
`;

const PinIcon = styled.div<{ $isPinned: boolean }>`
  position: absolute;
  top: 12px;
  right: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${props => props.$isPinned ? '#333' : 'transparent'};
  cursor: pointer;
  z-index: 2;
  border-radius: 50%;
  transition: all 0.2s ease;
  
  &:hover {
    color: #333;
    background: rgba(0, 0, 0, 0.1);
  }
  
  ${SentenceRow}:hover & {
    color: ${props => props.$isPinned ? '#333' : '#666'};
  }
  
  &::before {
    content: "📌";
    filter: grayscale(100%);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .title {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .description {
    font-size: 14px;
  }
`;

const ContextMenuContainer = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  top: ${props => props.$y}px;
  left: ${props => props.$x}px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
`;

const ContextMenuItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f1f3f4;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ModalMessage = styled.p`
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
`;

const ModalButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  
  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    color: #495057;
    border-color: #adb5bd;
    
    &:hover {
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
      border-color: #6c757d;
    }
  ` : `
    background: white;
    color: #6c757d;
    border-color: #dee2e6;
    
    &:hover {
      background: #f8f9fa;
    }
  `}
`;

const StatusIndicators = styled.div`
  position: absolute;
  top: 8px;
  right: 40px;
  display: flex;
  gap: 4px;
  z-index: 1;
`;

const StatusIndicator = styled.div<{ $type: 'highlight' | 'memo'; $color?: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  font-weight: bold;
  background: ${props => {
    if (props.$type === 'highlight') {
      return props.$color === 'yellow' ? '#ffc107' : 
             props.$color === 'green' ? '#28a745' :
             props.$color === 'blue' ? '#007bff' : '#ffc107';
    }
    return '#6c757d'; // 메모 색상
  }};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  
  &::before {
    content: ${props => props.$type === 'highlight' ? '"H"' : '"M"'};
  }
`;

const MemoPreview = styled.div`
  position: absolute;
  bottom: 8px;
  left: 20px;
  right: 60px;
  background: rgba(108, 117, 125, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #6c757d;
  font-style: italic;
  max-height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const SentenceVaultView: React.FC<SentenceVaultViewProps> = ({
  personas,
  onNavigateToPersona,
  onNavigateToThread,
  onNavigateToPersonaWithSentence
}) => {
  const [sentences, setSentences] = useState<SentenceVaultItem[]>([]);
  const [filteredSentences, setFilteredSentences] = useState<SentenceVaultItem[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>('전체');
  const [loading, setLoading] = useState(true);
  const [pinnedSentences, setPinnedSentences] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalData | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // 필터 옵션들
      const [filterOptions, setFilterOptions] = useState<string[]>(['전체', '언어화', '자극']);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 저장고 문장들 로드
      const sentenceData = await sentenceApi.getVaultSentences();
      console.log('저장고 데이터:', sentenceData);
      setSentences(sentenceData);

      // 필터 옵션에 페르소나들 추가 (props로 받은 personas 사용)
      const personaNames = Object.values(personas).map(p => p.name);
      setFilterOptions(['전체', '언어화', '자극', ...personaNames]);
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [personas]);

  const applyFilter = useCallback(() => {
    let filtered = [...sentences];

    if (currentFilter !== '전체') {
      if (currentFilter === '언어화') {
        filtered = filtered.filter(s => 
          s.tags.includes('verbalization') || 
          s.tags.includes('언어화') ||
          s.source_message_id?.includes('verbalization')
        );
      } else if (currentFilter === '자극') {
        filtered = filtered.filter(s => s.tags.includes('자극') || s.tags.includes('stimulus'));
      } else {
        // 페르소나 이름으로 필터링
        const personaId = Object.keys(personas).find(id => personas[id].name === currentFilter);
        if (personaId) {
          filtered = filtered.filter(s => s.tags.includes(personaId) || s.source_message_id.includes(personaId));
        }
      }
    }

    // 고정된 문장들을 맨 위로
    const pinned = filtered.filter(s => pinnedSentences.has(s.id));
    const unpinned = filtered.filter(s => !pinnedSentences.has(s.id));
    
    // 날짜순 정렬 (최신순)
    pinned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    unpinned.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredSentences([...pinned, ...unpinned]);
  }, [sentences, currentFilter, pinnedSentences, personas]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    applyFilter();
  }, [sentences, currentFilter, pinnedSentences, applyFilter]);

  // 컨텍스트 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = () => {
      console.log('외부 클릭 감지, 컨텍스트 메뉴 닫기');
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showFilterDropdown]);



  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
    setCurrentFilterIndex(filterOptions.indexOf(filter));
    setShowFilterDropdown(false);
  };

  const handleNavigateFilter = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentFilterIndex - 1)
      : Math.min(filterOptions.length - 1, currentFilterIndex + 1);
    
    setCurrentFilterIndex(newIndex);
    setCurrentFilter(filterOptions[newIndex]);
  };

  const handleSentenceClick = (event: React.MouseEvent, sentence: SentenceVaultItem) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('문장 클릭됨:', sentence.sentence.substring(0, 50));
    console.log('클릭 위치:', event.clientX, event.clientY);
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      sentence
    });
    
    console.log('컨텍스트 메뉴 설정됨');
  };

  const handleContextMenuAction = (action: string, sentence: SentenceVaultItem) => {
    console.log('컨텍스트 메뉴 액션:', action);
    setContextMenu(null);
    
    switch (action) {
      case 'interact':
      case 'delete':
        setConfirmationModal({ type: action as any, sentence });
        break;
      case 'pin':
        togglePin(sentence.id);
        break;
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal) return;
    
    const { type, sentence } = confirmationModal;
    
    try {
      switch (type) {
        case 'interact':
          console.log('=== 상호작용 하기 시작 ===');
          console.log('문장 데이터:', sentence);
          console.log('tags:', sentence.tags);
          console.log('source_message_id:', sentence.source_message_id);
          console.log('source_conversation_id:', sentence.source_conversation_id);
          console.log('source_thread_id:', sentence.source_thread_id);
          console.log('source_thread_type:', sentence.source_thread_type);
          console.log('사용 가능한 페르소나들:', Object.keys(personas));
          
          // 해당 문장의 출처 스레드로 이동하면서 입력창에 \"문장에 대해\" 형태로 설정
          if (sentence.tags.includes('verbalization') || sentence.tags.includes('언어화') || sentence.source_message_id?.includes('verbalization')) {
            console.log('언어화 문장으로 인식됨');
            // 언어화에서 온 문장인 경우 - 언어화 스레드로 이동
            if (sentence.source_conversation_id && sentence.source_conversation_id !== 'verbalization_chat') {
              console.log('언어화 스레드 ID가 있음:', sentence.source_conversation_id);
              sessionStorage.setItem('selectedSentenceForInput', `"${sentence.sentence}"에 대해 `);
              if (onNavigateToThread) {
                console.log('언어화 스레드로 이동 중...');
                onNavigateToThread(sentence.source_conversation_id, 'verbalization');
              }
            } else {
              console.log('언어화 스레드 ID가 없어서 언어화 모드로만 전환');
              // source_conversation_id가 없으면 언어화 모드로만 전환
              sessionStorage.setItem('selectedSentenceForInput', `"${sentence.sentence}"에 대해 `);
              if (onNavigateToPersona) {
                console.log('언어화 페르소나로 이동 중...');
                // 언어화는 verbalization ID 사용
                onNavigateToPersona('verbalization', 'sentence');
              }
            }
          } else {
            console.log('훈습 문장으로 인식됨');
            // 훈습에서 온 문장인 경우 - source_message_id에서 스레드 타입 식별
            let threadType = 'interpretation'; // 기본값
            
            if (sentence.source_message_id?.includes('sentence_') || sentence.tags.includes('sentence')) {
              threadType = 'sentence';
            } else if (sentence.source_message_id?.includes('proceed_') || sentence.tags.includes('proceed')) {
              threadType = 'proceed';
            } else if (sentence.source_message_id?.includes('interpretation_') || sentence.tags.includes('interpretation')) {
              threadType = 'interpretation';
            }
            
            console.log('식별된 스레드 타입:', threadType);
            
            // 스레드 ID 우선순위: source_thread_id > source_conversation_id
            const threadId = sentence.source_thread_id || sentence.source_conversation_id;
            
            if (threadId) {
              console.log('훈습 스레드 ID가 있음:', threadId, '(from:', sentence.source_thread_id ? 'source_thread_id' : 'source_conversation_id', ')');
              sessionStorage.setItem('selectedSentenceForInput', `"${sentence.sentence}"에 대해 `);
              if (onNavigateToThread) {
                console.log('훈습 스레드로 이동 중...');
                onNavigateToThread(threadId, threadType);
              }
            } else {
              console.log('훈습 스레드 ID가 없음, 페르소나 정보 찾는 중...');
              
              // 1단계: source_message_id에서 페르소나 ID 추출 시도
              let personaId = null;
              if (sentence.source_message_id) {
                const parts = sentence.source_message_id.split('_');
                if (parts.length > 1) {
                  const candidatePersonaId = parts[1];
                  if (personas[candidatePersonaId]) {
                    personaId = candidatePersonaId;
                    console.log('source_message_id에서 페르소나 발견:', personaId);
                  }
                }
              }
              
              // 2단계: tags에서 페르소나 ID 찾기
              if (!personaId) {
                personaId = sentence.tags.find(tag => 
                  tag !== threadType && 
                  tag !== 'sentence' && 
                  tag !== 'proceed' && 
                  tag !== 'interpretation' && 
                  tag !== 'verbalization' &&
                  tag !== 'letter' &&
                  personas[tag]
                );
                if (personaId) {
                  console.log('태그에서 페르소나 발견:', personaId);
                }
              }
              
              if (personaId && personas[personaId]) {
                console.log('페르소나로 이동 준비:', personaId, '타입:', threadType);
                sessionStorage.setItem('selectedSentenceForInput', `"${sentence.sentence}"에 대해 `);
                
                // 해석 타입인 경우 특별 표시를 sessionStorage에 저장하여 App.tsx에서 처리하도록 함
                if (threadType === 'interpretation') {
                  sessionStorage.setItem('navigateToInterpretationMode', 'true');
                }
                
                if (onNavigateToPersona) {
                  console.log('페르소나로 이동 실행:', personaId);
                  onNavigateToPersona(personaId, 'sentence');
                }
              } else {
                console.error('페르소나 정보도 찾을 수 없음');
                console.error('sentence.tags:', sentence.tags);
                console.error('sentence.source_message_id:', sentence.source_message_id);
                console.error('사용 가능한 페르소나들:', Object.keys(personas));
                alert('해당 문장의 원본 위치를 찾을 수 없습니다. 페르소나 정보를 확인할 수 없습니다.');
              }
            }
          }
          
          break;
        case 'delete':
          // 문장 삭제
          await sentenceApi.deleteVaultSentence(sentence.id);
          setSentences(prev => prev.filter(s => s.id !== sentence.id));
          break;
      }
    } catch (error) {
      console.error('액션 실행 실패:', error);
      alert('작업 실행 중 오류가 발생했습니다: ' + error);
    }
    
    setConfirmationModal(null);
  };

  const togglePin = (sentenceId: string) => {
    setPinnedSentences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sentenceId)) {
        newSet.delete(sentenceId);
      } else {
        newSet.add(sentenceId);
      }
      return newSet;
    });
  };



  const getPersonaName = (sentence: SentenceVaultItem): string => {
    // 언어화 태그 체크
    if (sentence.tags.includes('언어화') || 
        sentence.tags.includes('verbalization') ||
        sentence.source_message_id?.includes('verbalization')) {
      return '언어화';
    }
    
    // 자극 태그 체크
    if (sentence.tags.includes('자극') || sentence.tags.includes('stimulus')) {
      return '자극';
    }
    
    // source_message_id에서 페르소나 ID 추출 시도
    if (sentence.source_message_id) {
      const parts = sentence.source_message_id.split('_');
      if (parts.length > 1) {
        const personaId = parts[1];
        const persona = personas[personaId];
        if (persona) {
          return persona.name;
        }
      }
    }
    
    // tags에서 페르소나 이름 찾기 (thread_type이 아닌 것들만)
    const excludeTypes = ['interpretation', 'proceed', 'sentence', 'verbalization', '자극', 'stimulus'];
    for (const tag of sentence.tags) {
      if (!excludeTypes.includes(tag)) {
      const persona = personas[tag];
      if (persona) {
        return persona.name;
        }
      }
    }
    
    return '시스템';
  };

  const getThreadTypeLabel = (sentence: SentenceVaultItem): string => {
    // source_message_id나 tags에서 스레드 타입 추출
    if (sentence.source_message_id?.includes('interpretation_') || sentence.tags.includes('interpretation')) {
      return '해석';
    } else if (sentence.source_message_id?.includes('proceed_') || sentence.tags.includes('proceed')) {
      return '나아가기';
    } else if (sentence.source_message_id?.includes('sentence_') || sentence.tags.includes('sentence')) {
      return '문장';
    } else if (sentence.source_message_id?.includes('verbalization') || sentence.tags.includes('verbalization')) {
      return '언어화';
    }
    
    return '알수없음';
  };

  const getModalContent = () => {
    if (!confirmationModal) return null;
    
    const { type } = confirmationModal;
    
    switch (type) {
      case 'interact':
        return {
          title: '상호작용 하기',
          message: `해당 문장이 온 스레드로 이동하여 이 문장에 대해 상호작용을 시작하시겠습니까?`,
          confirmText: '상호작용',
          cancelText: '취소'
        };
      case 'delete':
        return {
          title: '문장 삭제',
          message: '이 문장을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
          confirmText: '삭제',
          cancelText: '취소'
        };
      default:
        return null;
    }
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  if (loading) {
    return (
      <Container>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          로딩 중...
        </div>
      </Container>
    );
  }

  const modalContent = getModalContent();

  return (
    <Container>
      <Header>
        <NavigationButton
          onClick={() => handleNavigateFilter('prev')}
          disabled={currentFilterIndex === 0}
        >
          ‹
        </NavigationButton>
        
        <FilterContainer className="filter-dropdown">
          <FilterDropdownButton
            $isOpen={showFilterDropdown}
            onClick={toggleFilterDropdown}
          >
            {currentFilter}
            <span className="arrow">▼</span>
          </FilterDropdownButton>
          <FilterDropdownMenu $isOpen={showFilterDropdown}>
            {filterOptions.map(option => (
              <FilterDropdownItem
                key={option}
                $isSelected={option === currentFilter}
                onClick={() => handleFilterChange(option)}
              >
                {option}
              </FilterDropdownItem>
            ))}
          </FilterDropdownMenu>
        </FilterContainer>
        
        <NavigationButton
          onClick={() => handleNavigateFilter('next')}
          disabled={currentFilterIndex === filterOptions.length - 1}
        >
          ›
        </NavigationButton>
      </Header>

      <ContentArea>
        {filteredSentences.length === 0 ? (
          <EmptyState>
            <div className="icon">📝</div>
            <div className="title">저장된 문장이 없습니다</div>
            <div className="description">
              훈습 페이지에서 문장을 저장고에 저장해보세요
            </div>
          </EmptyState>
        ) : (
          <SentenceGrid>
            {filteredSentences.map(sentence => (
              <SentenceContainer key={sentence.id}>
                <SentenceRow
                  $isPinned={pinnedSentences.has(sentence.id)}
                  $isHighlighted={sentence.is_highlighted}
                  onClick={(e) => handleSentenceClick(e, sentence)}
                  style={{
                    '--has-memo': sentence.memo_content ? '50px' : '0px'
                  } as any}
                >
                  <SentenceContent>
                    <SentenceText>{sentence.sentence}</SentenceText>
                    {sentence.memo_content && (
                      <MemoPreview>
                        📝 {sentence.memo_content}
                      </MemoPreview>
                    )}
                  </SentenceContent>
                  
                  <StatusIndicators>
                    {sentence.is_highlighted && (
                      <StatusIndicator 
                        $type="highlight" 
                        $color={sentence.highlight_color || 'yellow'}
                        title={`하이라이트 (${sentence.highlight_color || 'yellow'})`}
                      />
                    )}
                    {sentence.memo_content && (
                      <StatusIndicator 
                        $type="memo" 
                        title="메모 있음"
                      />
                    )}
                  </StatusIndicators>
                  
                  <PinIcon
                    $isPinned={pinnedSentences.has(sentence.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(sentence.id);
                    }}
                  />
                </SentenceRow>
                <SentenceMetaExternal>
                  <PersonaLabel>{getPersonaName(sentence)} - {getThreadTypeLabel(sentence)}</PersonaLabel>
                  <DateLabel>{new Date(sentence.created_at).toLocaleDateString('ko-KR')}</DateLabel>
                </SentenceMetaExternal>
              </SentenceContainer>
            ))}
          </SentenceGrid>
        )}
      </ContentArea>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <ContextMenuContainer $x={contextMenu.x} $y={contextMenu.y}>
          <ContextMenuItem onClick={() => handleContextMenuAction('interact', contextMenu.sentence)}>
            상호작용 하기
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenuAction('delete', contextMenu.sentence)}>
            삭제
          </ContextMenuItem>
        </ContextMenuContainer>
      )}

      {/* 확인 모달 */}
      {confirmationModal && modalContent && (
        <ModalOverlay onClick={() => setConfirmationModal(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{modalContent.title}</ModalTitle>
            <ModalMessage>{modalContent.message}</ModalMessage>
            <ModalButtons>
              <ModalButton 
                $variant="primary" 
                onClick={handleConfirmAction}
              >
                {modalContent.confirmText}
              </ModalButton>
              <ModalButton 
                $variant="secondary" 
                onClick={() => setConfirmationModal(null)}
              >
                {modalContent.cancelText}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default SentenceVaultView; 