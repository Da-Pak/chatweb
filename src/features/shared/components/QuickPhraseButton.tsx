import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { QuickPhrase } from '../api/quickPhraseApi';
import QuickPhraseSettingsModal from './QuickPhraseSettingsModal';

interface QuickPhraseButtonProps {
  quickPhrases: QuickPhrase[];
  onPhraseSelect: (text: string) => void;
  onPhrasesUpdate: () => void;
  currentInterpretation?: string;
  personaId?: string;
  onGenerateProceed?: (messageContent: string) => Promise<void>;
  onGenerateSentence?: (messageContent: string) => Promise<void>;
  currentChatMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  currentChatContext?: string;
  onRefreshThreads?: () => void;
}

const QuickPhraseContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const QuickPhraseBtn = styled.button`
  width: 100%;
  height: 40px;
  border-radius: 16px; /* 문장선택 버튼과 동일한 라운딩 */
  border: 1px solid #ccc;
  background: linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%); /* 왼쪽에서 오른쪽으로 흰색→연한회색 */
  color: #333;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 살짝의 음영 처리 */
  
  &:hover {
    background: linear-gradient(90deg, #f8f8f8 0%, #e8e8e8 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const DropdownMenu = styled.div<{ $show: boolean }>`
  position: absolute;
  bottom: 50px;
  right: 0; /* 오른쪽에서 시작하여 왼쪽으로 확장 */
  width: 250px; /* 200px에서 250px로 확대 */
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 1000;
  max-height: 450px; /* 400px에서 450px로 확대 */
  overflow-y: auto;
  transform: ${props => props.$show ? 'scale(1)' : 'scale(0)'};
  transform-origin: bottom right; /* 꼭지점을 오른쪽 아래로 설정 */
  transition: transform 0.2s ease;
`;

const MenuItem = styled.button<{ $isTodo?: boolean; $isSettings?: boolean }>`
  width: 100%;
  padding: 14px 18px; /* 12px 16px에서 14px 18px로 확대 */
  border: none;
  background: transparent;
  text-align: left;
  cursor: ${props => props.$isTodo ? 'not-allowed' : 'pointer'};
  font-size: 14px; /* 14px에서 12px로 폰트 크기 축소 */
  color: ${props => props.$isTodo ? '#999' : '#333'};
  border-bottom: none;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.$isTodo ? 'transparent' : '#e9ecef'};
  }
  
  &:active {
    background: ${props => props.$isTodo ? 'transparent' : '#dee2e6'};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #ddd;
  margin: 4px 0;
`;

const QuickPhraseButton: React.FC<QuickPhraseButtonProps> = ({
  quickPhrases,
  onPhraseSelect,
  onPhrasesUpdate,
  currentInterpretation,
  personaId,
  onGenerateProceed,
  onGenerateSentence,
  currentChatMessages,
  currentChatContext,
  onRefreshThreads
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleButtonClick = () => {
    setShowMenu(!showMenu);
  };

  const handlePhraseClick = (text: string, isTodo: boolean = false) => {
    if (isTodo) return; // TODO 항목은 클릭 불가
    
    onPhraseSelect(text);
    setShowMenu(false);
  };

  const handleGenerateProceed = async () => {
    const proceedPrompt = "좋아. 너의 답변에 근거하여, 내가 나아가야 할 방향은?";
    onPhraseSelect(proceedPrompt);
      setShowMenu(false);
  };

  const handleGenerateSentence = async () => {
    const sentencePrompt = "네 답변을 세 문장으로 통찰적, 명제형, 핵심적으로 짧게 요약 (in bullet style)";
    onPhraseSelect(sentencePrompt);
      setShowMenu(false);
  };

  const isGenerationAvailable = true; // 프롬프트 텍스트 삽입이므로 항상 사용 가능

  const handleSettingsClick = () => {
    setShowMenu(false);
    setShowSettingsModal(true);
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

  return (
    <>
      <QuickPhraseContainer ref={menuRef}>
        <QuickPhraseBtn onClick={handleButtonClick}>
          자주<br/>쓰는
        </QuickPhraseBtn>
        
        <DropdownMenu $show={showMenu}>
          {/* 나아가기, 문장 생성 항목들 */}
          <MenuItem 
            onClick={handleGenerateProceed}
          >
            [나아가기] 생성
          </MenuItem>
          <MenuItem 
            onClick={handleGenerateSentence}
          >
            [문장] 생성
          </MenuItem>
          
          <Divider />
          
          {/* 실제 자주쓰는 문장들 */}
          {quickPhrases.map((phrase) => (
            <MenuItem 
              key={phrase.id}
              onClick={() => handlePhraseClick(phrase.text)}
            >
              {phrase.text}
            </MenuItem>
          ))}
          
          <Divider />
          
          {/* 설정 메뉴 */}
          <MenuItem $isSettings onClick={handleSettingsClick}>
            설정 (편집 창 호출)
          </MenuItem>
        </DropdownMenu>
      </QuickPhraseContainer>

      {/* 설정 모달 */}
      {showSettingsModal && (
        <QuickPhraseSettingsModal
          quickPhrases={quickPhrases}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={onPhrasesUpdate}
        />
      )}
    </>
  );
};

export default QuickPhraseButton; 