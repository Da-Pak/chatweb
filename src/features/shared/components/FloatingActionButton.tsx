import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface FloatingActionButtonProps {
  show: boolean;
  onMenuAction: (action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy') => void;
  personaId?: string;
  currentInterpretation?: string;
}

const FABContainer = styled.div<{ show: boolean }>`
  position: fixed;
  bottom: 30px; /* 입력창(80px) + 문장선택버튼 중앙(20px) = 문장선택 버튼 정중앙에 겹침 */
  right: 90px; /* 오른쪽여백(20px) + 버튼그룹너비절반(70px) = 문장선택 버튼 중앙 */
  z-index: 1000;
  transform: ${props => props.show ? 'scale(1)' : 'scale(0)'};
  transition: transform 0.3s ease;
`;

const FABButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: #333;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  
  &:hover {
    background: #555;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const MenuPopup = styled.div<{ show: boolean }>`
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 200px;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transform: ${props => props.show ? 'scale(1)' : 'scale(0)'};
  transform-origin: bottom right;
  transition: transform 0.2s ease;
`;

const MenuItem = styled.button<{ isDivider?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  border-bottom: ${props => props.isDivider ? '1px solid #ddd' : 'none'};
  
  &:hover {
    background: #e9ecef;
  }
  
  &:active {
    background: #dee2e6;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #ddd;
  margin: 4px 0;
`;

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  show,
  onMenuAction,
  personaId,
  currentInterpretation
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleFABClick = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuClick = (action: 'sendToInput' | 'saveToVault' | 'addMemo' | 'highlight' | 'copy') => {
    onMenuAction(action);
    setShowMenu(false);
  };

  // 메뉴 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // FAB가 숨겨질 때 메뉴도 닫기
  useEffect(() => {
    if (!show) {
      setShowMenu(false);
    }
  }, [show]);

  return (
    <FABContainer show={show} ref={menuRef}>
      <MenuPopup show={showMenu}>
        <MenuItem onClick={() => handleMenuClick('sendToInput')}>
          입력창으로 보내기
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuClick('saveToVault')}>
          저장고에 저장
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('addMemo')}>
          메모 남기기
        </MenuItem>
        <MenuItem onClick={() => handleMenuClick('highlight')}>
          하이라이트 색칠
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuClick('copy')}>
          복사
        </MenuItem>
      </MenuPopup>
      <FABButton onClick={handleFABClick}>
        문장옵션
      </FABButton>
    </FABContainer>
  );
};

export default FloatingActionButton; 