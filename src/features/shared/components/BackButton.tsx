import React from 'react';
import styled from 'styled-components';

const BackButtonContainer = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  
  display: flex;
  align-items: center;
  gap: 6px;
  
  font-size: 14px;
  color: #495057;
  
  backdrop-filter: blur(10px);
  
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: #adb5bd;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const BackIcon = styled.span`
  font-size: 16px;
  line-height: 1;
`;

interface BackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  disabled = false,
  className 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      onClick();
    }
  };

  return (
    <BackButtonContainer
      onClick={handleClick}
      disabled={disabled}
      className={className}
      title="뒤로가기"
    >
      <BackIcon>←</BackIcon>
      <span>뒤로</span>
    </BackButtonContainer>
  );
};

export default BackButton; 