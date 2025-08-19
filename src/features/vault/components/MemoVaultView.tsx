import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { sentenceApi, MemoVaultItem } from '../../training/api/sentenceApi';
import { Persona } from '../../shared/types';

interface MemoVaultViewProps {
  personas: Record<string, Persona>;
  onNavigateToThread: (threadId: string, threadType: string, interactionMessage?: string) => void;
}

interface ContextMenu {
  x: number;
  y: number;
  memo: MemoVaultItem;
}

interface ConfirmationModalData {
  type: 'interact' | 'delete';
  memo: MemoVaultItem;
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

const MemoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MemoItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const MemoContent = styled.div`
  width: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
    border-color: #adb5bd;
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  }
`;

const UserMemoContent = styled.div`
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  word-break: break-word;
  font-weight: 600;
`;

const SentenceContent = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #555;
  word-break: break-word;
  font-style: italic;
  
  &::before {
    content: "↘ ";
    color: #999;
    font-weight: bold;
    margin-right: 4px;
  }
`;

const MemoMeta = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 12px;
  color: #6c757d;
  gap: 8px;
`;

const ThreadTypeLabel = styled.span`
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

const MemoVaultView: React.FC<MemoVaultViewProps> = ({
  personas,
  onNavigateToThread
}) => {
  const [memos, setMemos] = useState<MemoVaultItem[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<MemoVaultItem[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>('전체');
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalData | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  const [filterOptions, setFilterOptions] = useState<string[]>(['전체', '해석', '나아가기', '문장', '언어화']);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);

  const loadMemos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sentenceApi.getVaultMemos();
      setMemos(data);
      
      const personaNames = Object.values(personas).map(p => p.name);
      setFilterOptions(['전체', '해석', '나아가기', '문장', '언어화', ...personaNames]);
    } catch (error) {
      console.error('메모 저장고 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [personas]);

  const applyFilter = useCallback(() => {
    let filtered = [...memos];

    if (currentFilter !== '전체') {
      if (currentFilter === '해석') {
        filtered = filtered.filter(m => m.source_thread_type === 'interpretation');
      } else if (currentFilter === '나아가기') {
        filtered = filtered.filter(m => m.source_thread_type === 'proceed');
      } else if (currentFilter === '문장') {
        filtered = filtered.filter(m => m.source_thread_type === 'sentence');
      } else if (currentFilter === '언어화') {
        filtered = filtered.filter(m => m.source_thread_type === 'verbalization');
      } else {
        const personaId = Object.keys(personas).find(id => personas[id].name === currentFilter);
        if (personaId) {
          filtered = filtered.filter(m => m.tags.includes(personaId) || m.source_message_id?.includes(personaId));
        }
      }
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredMemos(filtered);
  }, [memos, currentFilter, personas]);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  useEffect(() => {
    applyFilter();
  }, [memos, currentFilter, applyFilter]);

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

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

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

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const handleMemoClick = (e: React.MouseEvent, memo: MemoVaultItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      memo
    });
  };

  const handleContextMenuAction = async (action: 'interact' | 'delete', memo: MemoVaultItem) => {
    setContextMenu(null);
    
    if (action === 'interact') {
      setConfirmationModal({
        type: 'interact',
        memo
      });
    } else if (action === 'delete') {
      setConfirmationModal({
        type: 'delete',
        memo
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal) return;

    try {
      if (confirmationModal.type === 'interact') {
        const response = await sentenceApi.interactWithVaultMemo(confirmationModal.memo.id);
        
        if (response.success && response.source_thread_id && response.source_thread_type) {
          const formattedMessage = `[${confirmationModal.memo.sentence_content} - ${confirmationModal.memo.memo_content} 에 대해]`;
          
          onNavigateToThread(
            response.source_thread_id,
            response.source_thread_type,
            formattedMessage
          );
        }
      } else if (confirmationModal.type === 'delete') {
        await sentenceApi.deleteVaultMemo(confirmationModal.memo.id);
        await loadMemos();
      }
    } catch (error) {
      console.error('메모 액션 실패:', error);
    } finally {
      setConfirmationModal(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getThreadTypeLabel = (threadType?: string) => {
    switch (threadType) {
      case 'interpretation': return '해석';
      case 'proceed': return '나아가기';
      case 'sentence': return '문장';
      case 'verbalization': return '언어화';
      default: return threadType || '알수없음';
    }
  };

  const getPersonaName = (memo: MemoVaultItem) => {
    // source_message_id에서 페르소나 정보 추출
    if (memo.source_message_id) {
      const parts = memo.source_message_id.split('_');
      if (parts.length > 1) {
        let personaId = parts[1];
        
        // 정확한 페르소나 ID 매치
        if (personas[personaId]) {
          return personas[personaId].name;
        }
        
        // 부분 매치 (legacy 지원)
        const matchingPersonaId = Object.keys(personas).find(id => id.startsWith(personaId + '_'));
        if (matchingPersonaId) {
          return personas[matchingPersonaId].name;
        }
      }
    }
    
    // tags에서 페르소나 정보 추출 (source_message_id에서 찾지 못한 경우)
    const excludeTypes = ['interpretation', 'proceed', 'sentence', 'verbalization'];
    for (const tag of memo.tags) {
      if (!excludeTypes.includes(tag)) {
        // 정확한 페르소나 ID 매치
        if (personas[tag]) {
          return personas[tag].name;
        }
        
        // 부분 매치
        const matchingPersonaId = Object.keys(personas).find(id => id.startsWith(tag + '_'));
        if (matchingPersonaId) {
          return personas[matchingPersonaId].name;
        }
      }
    }
    
    // 특수 케이스: 언어화
    if (memo.source_message_id === 'verbalization_chat' || 
        memo.source_thread_type === 'verbalization' ||
        memo.tags.includes('verbalization')) {
      return '언어화';
    }
    
    return '알수없음';
  };

  const getFormattedSentences = (memo: MemoVaultItem) => {
    if (memo.metadata && memo.metadata.related_sentence_contents && Array.isArray(memo.metadata.related_sentence_contents)) {
      const relatedSentences = memo.metadata.related_sentence_contents;
      if (relatedSentences.length > 1) {
        const formattedSentences = relatedSentences.map((sentence: string) => `"${sentence}"`).join(', ');
        return `→ ${formattedSentences}`;
      }
    }
    
    return memo.sentence_content;
  };

  const getModalContent = () => {
    if (!confirmationModal) return null;
    
    const { type } = confirmationModal;
    
    const getSentencesForModal = (memo: MemoVaultItem) => {
      if (memo.metadata && memo.metadata.related_sentence_contents && Array.isArray(memo.metadata.related_sentence_contents)) {
        const relatedSentences = memo.metadata.related_sentence_contents;
        if (relatedSentences.length > 1) {
          const formattedSentences = relatedSentences.map((sentence: string) => `"${sentence}"`).join(', ');
          return formattedSentences;
        }
      }
      return confirmationModal.memo.sentence_content;
    };
    
    switch (type) {
      case 'interact':
        const sentences = getSentencesForModal(confirmationModal.memo);
        return {
          title: '메모 상호작용',
          message: `이 메모와 상호작용하시겠습니까? 원본 위치로 이동하여 "[${sentences} - ${confirmationModal.memo.memo_content} 에 대해]" 형식으로 입력창에 삽입됩니다.`,
          confirmText: '상호작용',
          cancelText: '취소'
        };
      case 'delete':
        return {
          title: '메모 삭제',
          message: '이 메모를 삭제하시겠습니까? 삭제된 메모는 복구할 수 없습니다.',
          confirmText: '삭제',
          cancelText: '취소'
        };
      default:
        return null;
    }
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
        {filteredMemos.length === 0 ? (
          <EmptyState>
            <div className="icon">📝</div>
            <div className="title">저장된 메모가 없습니다</div>
            <div className="description">
              훈습이나 언어화 페이지에서 메모를 생성하면 자동으로 저장됩니다
            </div>
          </EmptyState>
        ) : (
          <MemoGrid>
            {filteredMemos.map(memo => (
              <MemoItemWrapper key={memo.id}>
                <MemoContent onClick={(e) => handleMemoClick(e, memo)}>
                  <UserMemoContent>{memo.memo_content}</UserMemoContent>
                  <SentenceContent>{getFormattedSentences(memo)}</SentenceContent>
                </MemoContent>
                <MemoMeta>
                  <ThreadTypeLabel>
                    {getPersonaName(memo)} - {getThreadTypeLabel(memo.source_thread_type)}
                  </ThreadTypeLabel>
                  <DateLabel>
                    {formatDate(memo.created_at)}
                  </DateLabel>
                </MemoMeta>
              </MemoItemWrapper>
            ))}
          </MemoGrid>
        )}
      </ContentArea>

      {contextMenu && (
        <ContextMenuContainer $x={contextMenu.x} $y={contextMenu.y}>
          <ContextMenuItem
            onClick={() => handleContextMenuAction('interact', contextMenu.memo)}
          >
            상호작용 하기
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction('delete', contextMenu.memo)}
          >
            삭제
          </ContextMenuItem>
        </ContextMenuContainer>
      )}

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

export default MemoVaultView; 