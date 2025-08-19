import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { SentenceVaultItem } from '../../training/api/sentenceApi';

interface SentenceCardProps {
  sentence: SentenceVaultItem;
  personaName: string;
  isPinned: boolean;
  onAction: (action: 'interact' | 'navigate' | 'pin' | 'delete') => void;
}

const CardContainer = styled.div<{ $isPinned: boolean }>`
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  ${props => props.$isPinned && `
    border-color: #ffc107;
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
  `}
`;

const PinIcon = styled.div<{ $isPinned: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${props => props.$isPinned ? '#ffc107' : 'transparent'};
  cursor: pointer;
  z-index: 2;
  
  &:hover {
    color: #ffc107;
  }
`;

const SentenceText = styled.div`
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 12px;
  word-break: break-word;
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6c757d;
`;

const PersonaLabel = styled.span`
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
`;

const DateLabel = styled.span`
  font-style: italic;
`;

const ContextMenu = styled.div<{ $isOpen: boolean; $x: number; $y: number }>`
  position: fixed;
  top: ${props => props.$y}px;
  left: ${props => props.$x}px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  min-width: 150px;
`;

const MenuItem = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  &.delete {
    color: #dc3545;
    border-top: 1px solid #dee2e6;
  }
`;

const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  personaName,
  isPinned,
  onAction
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCardClick = (event: React.MouseEvent) => {
    event.preventDefault();
    
    // 컨텍스트 메뉴 위치 계산
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.min(event.clientX, window.innerWidth - 200);
      const y = Math.min(event.clientY, window.innerHeight - 200);
      setMenuPosition({ x, y });
    }
    
    setShowContextMenu(true);
  };

  const handleMenuAction = (action: 'interact' | 'navigate' | 'pin' | 'delete') => {
    setShowContextMenu(false);
    onAction(action);
  };

  const handlePinClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onAction('pin');
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

  return (
    <>
      <CardContainer
        ref={cardRef}
        $isPinned={isPinned}
        onClick={handleCardClick}
      >
        <PinIcon
          $isPinned={isPinned}
          onClick={handlePinClick}
        >
          📌
        </PinIcon>
        
        <SentenceText>
          {sentence.sentence}
        </SentenceText>
        
        <MetaInfo>
          <PersonaLabel>{personaName}</PersonaLabel>
          <DateLabel>{formatDate(sentence.created_at)}</DateLabel>
        </MetaInfo>
      </CardContainer>

      <ContextMenu
        $isOpen={showContextMenu}
        $x={menuPosition.x}
        $y={menuPosition.y}
      >
        <MenuItem onClick={() => handleMenuAction('interact')}>
          상호작용 하기
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('navigate')}>
          해당 기록으로 이동
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('pin')}>
          {isPinned ? '고정 해제' : '맨 위에 고정'}
        </MenuItem>
        <MenuItem className="delete" onClick={() => handleMenuAction('delete')}>
          삭제
        </MenuItem>
      </ContextMenu>
    </>
  );
};

export default SentenceCard; 