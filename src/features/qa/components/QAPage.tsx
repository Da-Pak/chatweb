import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { qaApi, QAQuestion, QASubmission } from '../api/qaApi';
import { useVoiceToText, RecordingStatus } from '../hooks/useVoiceToText';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: #f0f2f5;
  padding: 20px;
  animation: ${fadeIn} 0.8s ease-out;
`;

const QAContainer = styled.div`
  width: 100%;
  max-width: 700px;
  height: 100%;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const QuestionBox = styled.div`
  padding: 40px;
  border-radius: 20px;
  background: linear-gradient(to bottom, #ffffff, #e9ecef);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.5s ease-out forwards;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #343a40;
    line-height: 1.6;
  }
`;

const InputSection = styled.div`
  width: 100%;
`;

const InputBox = styled.div`
  position: relative;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(to bottom, #ffffff, #e9ecef);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  height: 150px;
  border: none;
  background-color: transparent;
  resize: none;
  font-size: 1rem;
  font-family: inherit;
  color: #495057;
  padding-right: 50px; // for microphone button

  &:focus {
    outline: none;
  }
`;

const MicButton = styled.button<{ status: RecordingStatus }>`
  position: absolute;
  right: 20px;
  bottom: 65px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #868e96;
  transition: color 0.2s;

  &:hover {
    color: #495057;
  }

  // 녹음 상태에 따른 동적 스타일
  ${({ status }) => status === "recording" && css`
    color: #fff;
    background-color: #e03131; // 빨간색 배경
    animation: ${pulse} 1.5s infinite;
  `}
`;

const BottomBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding: 0 10px;
`;

const CharCounter = styled.span<{ hasError: boolean }>`
  font-size: 0.9rem;
  color: ${props => props.hasError ? '#e03131' : '#868e96'};
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  border: 1px solid #343a40;
  border-radius: 50px;
  background-color: #fff;
  color: #343a40;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #343a40;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressTracker = styled.div`
  margin-top: 20px;
  font-size: 1rem;
  font-weight: 500;
  color: #495057;
`;

const CompletionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const CompletionPopup = styled.div`
  background-color: #ffffff;
  border: 2px solid #d1d5db;
  border-radius: 16px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #000000;
    margin: 0 0 20px 0;
  }

  p {
    font-size: 1rem;
    color: #000000;
    line-height: 1.6;
    margin: 0 0 30px 0;
  }
`;

const ConfirmButton = styled.button`
  background-color: #ffffff;
  border: 2px solid #000000;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" 
          fill="currentColor" stroke="currentColor" strokeWidth="1"/>
    <path d="M19 10V12C19 16.97 15.84 21.19 11 21.91V24H13V26H11H9V24H11V21.91C6.16 21.19 3 16.97 3 12V10H5V12C5 15.87 8.13 19 12 19S19 15.87 19 12V10H21Z" 
          fill="none" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const QAPage: React.FC = () => {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [allAnswers, setAllAnswers] = useState<QASubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsComplete] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await qaApi.getQuestions();
        setQuestions(data);
      } catch (error) {
        console.error("질문을 가져오는 데 실패했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleTranscript = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setCurrentAnswer(prev => prev + transcript + ' ');
      setInterimTranscript('');
    } else {
      setInterimTranscript(transcript);
    }
  };

  const { status, toggleRecording } = useVoiceToText(handleTranscript);

  const handleNextQuestion = async () => {
    const newAnswer: QASubmission = {
      question_id: questions[currentQuestionIndex].question_id,
      answer: currentAnswer
    };
    const updatedAnswers = [...allAnswers, newAnswer];
    setAllAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 마지막 질문, 답변 제출
      try {
        await qaApi.submitAnswers(updatedAnswers);
        setIsComplete(true); // API 호출이 성공한 후에 완료 상태로 변경
        setShowCompletionPopup(true); // 완료 팝업 표시
      } catch (error: any) {
        console.error("답변 제출에 실패했습니다.", error);
        console.error("Error details:", error.response?.data);
        // 사용자에게 에러 알림 (예: alert 또는 토스트 메시지)
        const errorMessage = error.response?.data?.detail || "답변 제출 중 오류가 발생했습니다. 다시 시도해주세요.";
        alert(errorMessage);
        setIsComplete(false); // 오류 발생 시 완료 상태로 넘어가지 않음
      }
    }
  };

  const MIN_CHARS = 100;
  const isSubmitDisabled = currentAnswer.length < MIN_CHARS;

  // 확인 버튼 클릭 시 training 페이지로 이동
  const handleNavigateToTraining = () => {
    // QA 완료 상태 저장
    localStorage.setItem('qa_completed', 'true');
    navigate('/training');
  };

  if (isLoading) {
    return <PageContainer>질문을 불러오는 중입니다...</PageContainer>;
  }

  if (questions.length === 0) {
    return <PageContainer>표시할 질문이 없습니다.</PageContainer>;
        }

  const currentQuestion = questions[currentQuestionIndex];

  // 팝업 렌더링을 별도로 처리

  return (
    <PageContainer>
      <QAContainer>
        <QuestionBox key={currentQuestion.question_id}>
          <h2>{currentQuestion.question_text}</h2>
        </QuestionBox>
        
        <InputSection>
          <InputBox>
            <StyledTextarea
              placeholder="답변을 입력해주세요..."
              value={currentAnswer + interimTranscript}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              maxLength={500}
            />
            <MicButton status={status} onClick={toggleRecording} title="음성으로 입력하기">
              <MicIcon />
            </MicButton>
          </InputBox>
          <BottomBar>
            <CharCounter hasError={currentAnswer.length < MIN_CHARS}>
              {currentAnswer.length} / {MIN_CHARS}자 이상
            </CharCounter>
            <SubmitButton onClick={handleNextQuestion} disabled={isSubmitDisabled}>
              {currentQuestionIndex === questions.length - 1 ? '모든 답변 완료' : '답변 완료'}
            </SubmitButton>
          </BottomBar>
        </InputSection>
      </QAContainer>
      <ProgressTracker>
        {currentQuestionIndex + 1} / {questions.length}
      </ProgressTracker>
      
      {/* QA 완료 팝업 */}
      {showCompletionPopup && (
        <CompletionOverlay>
          <CompletionPopup>
            <h1>QA 완료</h1>
            <p>QA(질문-답변) 작업을 모두 완료하였습니다. 이제 메인페이지로 이동하겠습니다</p>
            <ConfirmButton onClick={handleNavigateToTraining}>
              확인
            </ConfirmButton>
          </CompletionPopup>
        </CompletionOverlay>
      )}
    </PageContainer>
    );
};

export default QAPage;
