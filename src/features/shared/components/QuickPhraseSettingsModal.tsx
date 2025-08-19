import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { QuickPhrase, quickPhraseApi } from '../api/quickPhraseApi';

interface QuickPhraseSettingsModalProps {
  quickPhrases: QuickPhrase[];
  onClose: () => void;
  onUpdate: () => void;
}

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

const ModalContainer = styled.div`
  background: #F2F2F2;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  
  &:hover {
    color: #333;
  }
`;

const PhraseList = styled.div`
  margin-bottom: 20px;
`;

const PhraseItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border: 1px solid #ddd;
  border-bottom: none;
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-bottom: 1px solid #ddd;
    border-radius: 0 0 8px 8px;
  }
  
  &:only-child {
    border-radius: 8px;
    border-bottom: 1px solid #ddd;
  }
`;

const PhraseText = styled.span`
  flex: 1;
  font-size: 14px;
  color: #333;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  padding: 4px 8px;
  
  &:hover {
    color: #ff4444;
  }
`;

const AddPhraseContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
`;

const AddInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  
  &::placeholder {
    color: #999;
  }
`;

const AddButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #007bff;
  background: #007bff;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  
  &:hover {
    background: #0056b3;
    border-color: #0056b3;
  }
  
  &:disabled {
    background: #ccc;
    border-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 12px;
  margin-top: 8px;
`;

const QuickPhraseSettingsModal: React.FC<QuickPhraseSettingsModalProps> = ({
  quickPhrases,
  onClose,
  onUpdate
}) => {
  const [localPhrases, setLocalPhrases] = useState<QuickPhrase[]>(quickPhrases);
  const [newPhraseText, setNewPhraseText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLocalPhrases(quickPhrases);
  }, [quickPhrases]);

  const handleAddPhrase = async () => {
    if (!newPhraseText.trim()) return;
    if (newPhraseText.length > 50) {
      setError('문장은 50자 이하로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await quickPhraseApi.createQuickPhrase({
        text: newPhraseText.trim()
      });

      if (response.success && response.phrase) {
        // 로컬 상태 업데이트 (optimistic update)
        setLocalPhrases(prev => [...prev, response.phrase!].sort((a, b) => a.order - b.order));
        setNewPhraseText('');
        onUpdate(); // 부모 컴포넌트에 업데이트 알림
      }
    } catch (error) {
      console.error('자주쓰는 문장 추가 실패:', error);
      setError('문장 추가에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhrase = async (phraseId: string) => {
    setIsLoading(true);
    setError('');

    try {
      await quickPhraseApi.deleteQuickPhrase(phraseId);
      
      // 로컬 상태 업데이트 (optimistic update)
      setLocalPhrases(prev => prev.filter(p => p.id !== phraseId));
      onUpdate(); // 부모 컴포넌트에 업데이트 알림
    } catch (error) {
      console.error('자주쓰는 문장 삭제 실패:', error);
      setError('문장 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleAddPhrase();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>자주쓰는 문장 편집</ModalTitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <PhraseList>
          {localPhrases.map((phrase) => (
            <PhraseItem key={phrase.id}>
              <PhraseText>{phrase.text}</PhraseText>
              <DeleteButton 
                onClick={() => handleDeletePhrase(phrase.id)}
                disabled={isLoading}
                title="삭제"
              >
                🗑️
              </DeleteButton>
            </PhraseItem>
          ))}
        </PhraseList>

        <AddPhraseContainer>
          <AddInput
            type="text"
            placeholder="새로 입력"
            value={newPhraseText}
            onChange={(e) => setNewPhraseText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            maxLength={50}
          />
          <AddButton 
            onClick={handleAddPhrase}
            disabled={isLoading || !newPhraseText.trim()}
            title="추가"
          >
            +
          </AddButton>
        </AddPhraseContainer>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default QuickPhraseSettingsModal; 