import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { chatApi } from '../../shared/api/chatApi';

interface InterpretationPopupProps {
  isOpen: boolean;
  personaId: string;
  personaName: string;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: (interpretation: string) => void;
}

const PopupOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const PopupContainer = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const PopupTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
`;

const PopupDescription = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  
  ${props => props.$variant === 'primary' 
    ? `
      background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
      color: white;
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
      }
    `
    : `
      background: #f5f5f5;
      color: #666;
      &:hover {
        background: #e8e8e8;
      }
    `
  }
`;

const ProgressContainer = styled.div`
  margin: 24px 0;
`;

const ProgressText = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #6c757d;
  margin-bottom: 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #6c757d 0%, #5a6268 100%);
  width: ${props => props.$progress}%;
  transition: width 0.3s ease;
`;

const InterpretationPopup: React.FC<InterpretationPopupProps> = ({
  isOpen,
  personaId,
  personaName,
  onConfirm,
  onCancel,
  onComplete,
}) => {
  const [step, setStep] = useState<'confirm' | 'progress' | 'complete' | 'error'>('confirm');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const generateInterpretation = useCallback(async () => {
    try {
      setProgress(10);
      
      // 해석과 동시에 나아가기, 문장 자동 생성하는 새로운 API 호출
      const response = await chatApi.generateInterpretationWithExtras({
        persona_id: personaId,
        user_input: "기본 심리 해석 요청"
      });

      setProgress(30);

      if (response.data && response.data.interpretation) {
        setProgress(60);
        
        // 잠시 후 완료 처리
        setTimeout(() => {
          setProgress(100);
          setTimeout(() => {
            setStep('complete');
            onComplete(response.data!.interpretation.interpretation);
          }, 300);
        }, 500);
      } else {
        // API 호출 실패
        setErrorMessage(response.error || '해석 생성에 실패했습니다.');
        setStep('error');
      }
    } catch (error) {
      console.error('해석 생성 오류:', error);
      setErrorMessage('해석 생성 중 오류가 발생했습니다.');
      setStep('error');
    }
  }, [personaId, onComplete]);

  useEffect(() => {
    if (!isOpen) {
      setStep('confirm');
      setProgress(0);
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'progress') {
      // 실제 백엔드 API 호출
      generateInterpretation();
    }
  }, [step, personaId, generateInterpretation]);

  const handleConfirm = () => {
    setStep('progress');
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleRetry = () => {
    setStep('progress');
    setProgress(0);
    setErrorMessage('');
  };

  return (
    <PopupOverlay $isOpen={isOpen}>
      <PopupContainer>
        {step === 'confirm' && (
          <>
            <PopupTitle>해석 생성 진행</PopupTitle>
            <PopupDescription>
              해당 인물의 사상에 기반한 심리 해석을 진행합니다.
            </PopupDescription>
            <ButtonContainer>
              <Button $variant="primary" onClick={handleConfirm}>
                생성
              </Button>
              <Button $variant="secondary" onClick={handleCancel}>
                취소
              </Button>
            </ButtonContainer>
          </>
        )}

        {step === 'progress' && (
          <>
            <PopupTitle>해석 생성 진행</PopupTitle>
            <ProgressContainer>
              <ProgressText>{progress}%</ProgressText>
              <ProgressBar>
                <ProgressFill $progress={progress} />
              </ProgressBar>
            </ProgressContainer>
            <PopupDescription>
              AI가 {personaName}의 관점에서 해석을 생성하고 있습니다...
            </PopupDescription>
          </>
        )}

        {step === 'complete' && (
          <>
            <PopupTitle>해석 생성 완료</PopupTitle>
            <PopupDescription>
              {personaName}의 관점에서 해석이 성공적으로 생성되었습니다.
            </PopupDescription>
            <ButtonContainer>
              <Button $variant="primary" onClick={handleCancel}>
                확인
              </Button>
            </ButtonContainer>
          </>
        )}

        {step === 'error' && (
          <>
            <PopupTitle>해석 생성 실패</PopupTitle>
            <PopupDescription>
              {errorMessage}
            </PopupDescription>
            <ButtonContainer>
              <Button $variant="primary" onClick={handleRetry}>
                다시 시도
              </Button>
              <Button $variant="secondary" onClick={handleCancel}>
                취소
              </Button>
            </ButtonContainer>
          </>
        )}
      </PopupContainer>
    </PopupOverlay>
  );
};

export default InterpretationPopup; 