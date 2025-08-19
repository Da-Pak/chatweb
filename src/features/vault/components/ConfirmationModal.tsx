import React from 'react';
import styled from 'styled-components';
import { SentenceVaultItem } from '../../training/api/sentenceApi';

interface ConfirmationModalProps {
  show: boolean;
  type: 'interact' | 'navigate' | 'delete';
  sentence?: SentenceVaultItem;
  personaName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalOverlay = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContainer = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
`;

const ModalContent = styled.div`
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: space-between;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    color: #495057;
    border: 1px solid #adb5bd;
    
    &:hover {
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
      border-color: #6c757d;
    }
  ` : `
    background: #f8f9fa;
    color: #333;
    border: 1px solid #dee2e6;
    
    &:hover {
      background: #e9ecef;
    }
  `}
`;

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  type,
  sentence,
  personaName,
  onConfirm,
  onCancel
}) => {
  const getModalContent = () => {
    switch (type) {
      case 'interact':
        return {
          title: '상호작용 하기',
          content: `${personaName}의 페이지에서 상호작용을 하시겠습니까?`,
          confirmText: '상호작용',
          cancelText: '취소'
        };
      case 'navigate':
        return {
          title: '해당 기록으로 이동',
          content: '해당 기록으로 이동하시겠습니까?',
          confirmText: '이동',
          cancelText: '취소'
        };
      case 'delete':
        return {
          title: '문장 삭제',
          content: '이 문장을 저장고에서 삭제하시겠습니까?\n삭제된 문장은 복구할 수 없습니다.',
          confirmText: '삭제',
          cancelText: '취소'
        };
      default:
        return {
          title: '',
          content: '',
          confirmText: '확인',
          cancelText: '취소'
        };
    }
  };

  const { title, content, confirmText, cancelText } = getModalContent();

  return (
    <ModalOverlay $show={show}>
      <ModalContainer>
        <ModalTitle>{title}</ModalTitle>
        <ModalContent>
          {content.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </ModalContent>
        <ButtonGroup>
          <Button $variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
          <Button $variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ConfirmationModal; 