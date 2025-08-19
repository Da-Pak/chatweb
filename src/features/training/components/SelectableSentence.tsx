import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

interface SelectableSentenceProps {
  sentence: string;
  sentenceId: string;
  isSelected: boolean;
  isHighlighted: boolean;
  hasMemo: boolean;
  memo?: string;
  showSelector?: boolean;
  onToggleSelect: (sentenceId: string) => void;
  onMemoChange?: (sentenceId: string, memo: string) => void;
  onDeleteMemo?: (sentenceId: string) => void;
}

const SentenceContainer = styled.div<{ $hasSelector: boolean; $isHoverable: boolean }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: ${props => props.$hasSelector ? '8px' : '0'};
  margin: 4px 0;
  cursor: ${props => props.$isHoverable ? 'pointer' : 'default'};
  padding: 2px 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  ㅇㅇ
  ${props => props.$isHoverable && `
    &:hover {
      background-color: #f0f8ff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const SelectButton = styled.button<{ $isSelected: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: ${props => props.$isSelected ? '#333' : 'white'};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
  
  &:hover {
    border-color: #666;
  }
  
  &:before {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
`;

const SentenceText = styled.span<{ $isHighlighted: boolean; $isClickable: boolean }>`
  background: ${props => props.$isHighlighted ? '#ffff00' : 'transparent'};
  padding: ${props => props.$isHighlighted ? '2px 4px' : '0'};
  border-radius: 4px;
  transition: all 0.2s ease;
  line-height: 1.6;
  flex: 1;
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  
  ${props => props.$isClickable && `
    &:hover {
      background: ${props.$isHighlighted ? '#ffff99' : '#f0f8ff'};
    }
  `}
`;

const MemoBox = styled.div<{ $isEditing: boolean }>`
  position: absolute;
  left: calc(100% + 20px);
  top: 0;
  width: 220px;
  background: ${props => props.$isEditing ? 'white' : '#f5f5f5'};
  border: 2px solid ${props => props.$isEditing ? '#ddd' : '#ccc'};
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: all 0.2s ease;
  
  /* 화면 오른쪽을 벗어나지 않도록 조정 */
  @media (max-width: 768px) {
    left: auto;
    right: -10px;
    width: 180px;
  }
`;

const MemoTextarea = styled.textarea<{ $isEditing: boolean }>`
  width: calc(100% - 10px);
  height: 60px;
  border: none;
  outline: none;
  resize: none;
  font-size: 12px;
  line-height: 1.4;
  padding: 4px;
  background: ${props => props.$isEditing ? 'white' : '#f5f5f5'};
  color: ${props => props.$isEditing ? '#333' : '#666'};
  cursor: ${props => props.$isEditing ? 'text' : 'pointer'};
  
  &:focus {
    background: white;
    color: #333;
  }
`;

const DeleteMemoButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #999;
  
  &:hover {
    color: #f00;
  }
`;

const SaveMemoButton = styled.button`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 50px;
  height: 20px;
  border: none;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  cursor: pointer;
  font-size: 9px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  }
  
  &:disabled {
    background: #6c757d;
    color: white;
    cursor: not-allowed;
  }
`;

const SelectableSentence: React.FC<SelectableSentenceProps> = ({
  sentence,
  sentenceId,
  isSelected,
  isHighlighted,
  hasMemo,
  memo = '',
  showSelector = true,
  onToggleSelect,
  onMemoChange,
  onDeleteMemo
}) => {
  const [localMemo, setLocalMemo] = useState(memo);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!memo); // 메모가 없으면 편집 모드로 시작
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 외부에서 전달된 memo가 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalMemo(memo);
  }, [memo]);

  const handleMemoInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalMemo(event.target.value);
  };

  const handleSaveMemo = async () => {
    if (!onMemoChange || !localMemo.trim()) return;
    
    setIsSaving(true);
    try {
      await onMemoChange(sentenceId, localMemo);
      setIsEditing(false); // 저장 후 편집 모드 종료
      
      // 텍스트 영역에서 포커스 제거
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    } catch (error) {
      console.error('메모 저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMemo = () => {
    if (onDeleteMemo) {
      setLocalMemo(''); // 로컬 상태도 초기화
      setIsEditing(true); // 삭제 후 편집 모드로 전환
      onDeleteMemo(sentenceId);
    }
  };

  const handleContainerClick = () => {
    if (showSelector) {
      onToggleSelect(sentenceId);
    }
  };

  const handleSelectButtonClick = (event: React.MouseEvent) => {
    // 이벤트 전파 방지 (컨테이너 클릭과 중복 실행 방지)
    event.stopPropagation();
    onToggleSelect(sentenceId);
  };

  const handleMemoBoxClick = (event: React.MouseEvent) => {
    // 메모박스 클릭 시 이벤트 전파 방지
    event.stopPropagation();
  };

  const handleDeleteMemoClick = (event: React.MouseEvent) => {
    // 삭제 버튼 클릭 시 이벤트 전파 방지
    event.stopPropagation();
    handleDeleteMemo();
  };

  return (
    <SentenceContainer 
      $hasSelector={showSelector} 
      $isHoverable={showSelector}
      onClick={handleContainerClick}
    >
      {showSelector && (
        <SelectButton 
          $isSelected={isSelected}
          onClick={handleSelectButtonClick}
        />
      )}
      <SentenceText $isHighlighted={isHighlighted} $isClickable={showSelector}>
        {sentence}
      </SentenceText>
      {hasMemo && (
        <MemoBox $isEditing={isEditing} onClick={handleMemoBoxClick}>
          <DeleteMemoButton onClick={handleDeleteMemoClick}>
            🗑
          </DeleteMemoButton>
          <MemoTextarea
            ref={textareaRef}
            $isEditing={isEditing}
            value={localMemo || ''}
            onChange={handleMemoInputChange}
            placeholder="메모를 입력하세요..."
            autoFocus={isEditing}
            readOnly={!isEditing}
            onClick={() => setIsEditing(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveMemo();
              }
            }}
          />
          {isEditing && (
            <SaveMemoButton onClick={handleSaveMemo} disabled={isSaving}>저장</SaveMemoButton>
          )}
        </MemoBox>
      )}
    </SentenceContainer>
  );
};

export default SelectableSentence; 