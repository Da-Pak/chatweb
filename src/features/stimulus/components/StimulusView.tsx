import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// 타입 정의
interface StimulusQuote {
  id: string;
  content: string;
  order: number;
}

interface StimulusQuoteSet {
  quotes: StimulusQuote[]; // 3개씩 묶인 격언들
}

interface PersonaInfo {
  name: string;
  theme: string;
  summary: string;
}

interface DailyStimulusItem {
  id: string;
  date: string;
  persona_name: string;
  main_theme: string;
  quote_sets: StimulusQuoteSet[]; // 3개의 세트 (총 9개 격언)
  summary_quote: string;
  persona_info?: PersonaInfo[]; // 각 세트별 심리학자 정보
  created_at: string;
}

interface StimulusViewProps {
  personas?: Record<string, any>;
}

// 스타일 컴포넌트들
const StimulusContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
`;

const StimulusCard = styled.div`
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 24px;
  padding: 80px 70px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 900px;
  width: 100%;
  position: relative;
  backdrop-filter: blur(10px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 50px;
  gap: 16px;
`;

const DateDisplay = styled.div`
  font-size: 18px;
  color: #666;
  font-weight: 500;
`;

const PersonaName = styled.div`
  font-size: 18px;
  color: #333;
  font-weight: 600;
`;

const MainThemeBox = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
`;

const MainTheme = styled.h1`
  font-size: 28px;
  font-weight: bold;
  color: #222;
  text-align: center;
  margin: 0;
  line-height: 1.4;
`;

const QuotesContainer = styled.div`
  position: relative;
  margin-bottom: 30px;
`;

const VerticalLine = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ddd;
  transform: translateX(-50%);
  z-index: 1;
`;

const QuoteSetContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const QuoteBox = styled.div<{ $isVisible: boolean; $isFirst?: boolean; $isLast?: boolean }>`
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  border-radius: ${props => {
    if (props.$isFirst) return '16px 16px 0 0';
    if (props.$isLast) return '0 0 16px 16px';
    return '0';
  }};
  padding: 24px 28px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: translateY(${props => props.$isVisible ? '0' : '20px'});
  border: 1px solid #e8e8e8;
  border-top: ${props => !props.$isFirst ? 'none' : '1px solid #e8e8e8'};
  
  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    .action-button {
      opacity: 1;
    }
  }
`;

const QuoteContent = styled.div`
  font-size: 18px;
  line-height: 1.6;
  color: #333;
  text-align: center;
  padding-right: 40px;
`;

const ActionButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #666;
  
  &:hover {
    border-color: #999;
    background: #f8f9fa;
  }
`;

const SummaryQuoteBox = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
  margin-top: 30px;
  
  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    .action-button {
      opacity: 1;
    }
  }
`;

const SummaryQuote = styled.div`
  font-size: 20px;
  font-weight: 500;
  line-height: 1.5;
  color: #333;
  text-align: center;
  padding-right: 40px;
`;

const NavigationContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 3;
`;

const NavigationButton = styled.button<{ $side: 'left' | 'right' }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #666;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: auto;
  margin: ${props => props.$side === 'left' ? '0 20px 0 -25px' : '0 -25px 0 20px'};
  
  &:hover {
    opacity: 1 !important;
    background: #f8f9fa;
    transform: scale(1.1);
  }
`;

const IndicatorContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PageIndicator = styled.div`
  display: flex;
  gap: 8px;
`;

const PageDot = styled.div<{ $isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
`;

const PageNumber = styled.span<{ $isActive: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.$isActive ? 'bold' : 'normal'};
  color: ${props => props.$isActive ? '#333' : '#999'};
`;

const PageBar = styled.div<{ $isActive: boolean }>`
  width: 24px;
  height: 3px;
  background: ${props => props.$isActive ? '#666' : '#ddd'};
  border-radius: 2px;
  transition: all 0.3s ease;
`;

const MenuButton = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  font-size: 16px;
  
  &:hover {
    background: #e0e0e0;
  }
`;

const DropdownMenu = styled.div<{ $isVisible: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transform: translateY(${props => props.$isVisible ? '8px' : '0'});
  opacity: ${props => props.$isVisible ? 1 : 0};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  z-index: 10;
`;

const MenuOption = styled.div`
  padding: 12px 16px;
  background: #f8f9fa;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #e9ecef;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  font-size: 18px;
  color: #666;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #d32f2f;
  text-align: center;
  
  button {
    margin-top: 16px;
    padding: 8px 16px;
    background: #d32f2f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;

// 메인 컴포넌트
const StimulusView: React.FC<StimulusViewProps> = ({ personas }) => {
  const [currentStimulus, setCurrentStimulus] = useState<DailyStimulusItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // 오늘의 자극 로드
  useEffect(() => {
    loadTodayStimulus();
  }, []);

  const loadTodayStimulus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/stimulus/today');
      const data = await response.json();
      
      if (data.success && data.stimulus) {
        setCurrentStimulus(data.stimulus);
      } else {
        setError('자극을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('자극 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= 3) {
      setCurrentPage(page);
    }
  };

  // 좌우 네비게이션
  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentPage(currentPage === 1 ? 3 : currentPage - 1);
    } else {
      setCurrentPage(currentPage === 3 ? 1 : currentPage + 1);
    }
  };



  // 현재 화면의 자극 저장 - 현재 페이지의 격언들 + 요약
  const handleSaveCurrentStimulus = async () => {
    if (!currentStimulus) return;
    
    try {
      console.log('=== 현재 자극 저장 시작 ===');
      console.log('자극 ID:', currentStimulus.id);
      console.log('현재 페이지:', currentPage);
      
      const requestData = {
        stimulus_id: currentStimulus.id,
        save_type: 'current_set',  // 현재 세트 저장
        current_page: currentPage  // 현재 페이지 번호 전송
      };
      
      console.log('요청 데이터:', requestData);
      
      const response = await fetch('/stimulus/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      console.log('응답 상태:', response.status);
      const data = await response.json();
      console.log('응답 데이터:', data);
      
      if (data.success) {
        alert(`자극이 저장되었습니다.`);
      } else {
        alert('저장에 실패했습니다: ' + (data.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('자극 저장 오류:', err);
      alert('저장에 실패했습니다.');
    }
    
    setIsMenuOpen(false);
  };

  // 컨텐츠 렌더링
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState>오늘의 자극을 불러오는 중...</LoadingState>;
    }
    
    if (error) {
      return (
        <ErrorState>
          <div>{error}</div>
          <button onClick={loadTodayStimulus}>다시 시도</button>
        </ErrorState>
      );
    }
    
    if (!currentStimulus) {
      return <LoadingState>자극이 없습니다.</LoadingState>;
    }

    // 현재 페이지에 해당하는 심리학자 정보 가져오기
    const getCurrentPersonaInfo = () => {
      if (currentStimulus.persona_info && currentStimulus.persona_info[currentPage - 1]) {
        return currentStimulus.persona_info[currentPage - 1];
      }
      return null;
    };

    const currentPersona = getCurrentPersonaInfo();

    return (
      <StimulusCard>
        <Header>
          <DateDisplay>{currentStimulus.date}</DateDisplay>
          <PersonaName>
            {currentPersona ? currentPersona.name : currentStimulus.persona_name}
          </PersonaName>
        </Header>

        <MainThemeBox>
          <MainTheme>
            {currentPersona ? currentPersona.theme : currentStimulus.main_theme}
          </MainTheme>
          <ActionButton className="action-button" onClick={() => alert('테마 상호작용 (추후 구현)')}>
            ⋯
          </ActionButton>
        </MainThemeBox>

        <QuotesContainer>
          <VerticalLine />
          
          {/* 현재 페이지의 격언 세트 표시 */}
          {currentPage <= 3 && currentStimulus.quote_sets && currentStimulus.quote_sets[currentPage - 1] && (
            <QuoteSetContainer>
              {currentStimulus.quote_sets[currentPage - 1].quotes.map((quote, index) => (
                <QuoteBox 
                  key={quote.id}
                  $isVisible={true}
                  $isFirst={index === 0}
                  $isLast={index === currentStimulus.quote_sets[currentPage - 1].quotes.length - 1}
                >
                  <QuoteContent>{quote.content}</QuoteContent>
                  <ActionButton 
                    className="action-button" 
                    onClick={() => alert('격언 상호작용 (추후 구현)')}
                  >
                    ⋯
                  </ActionButton>
                </QuoteBox>
              ))}
            </QuoteSetContainer>
          )}
          
          {/* 호환성을 위한 fallback - 오래된 데이터 구조 처리 */}
          {(!currentStimulus.quote_sets && (currentStimulus as any).quotes) && (
            <QuoteSetContainer>
              <QuoteBox $isVisible={true} $isFirst={true} $isLast={true}>
                <QuoteContent>{(currentStimulus as any).quotes[currentPage - 1]?.content}</QuoteContent>
                <ActionButton 
                  className="action-button" 
                  onClick={() => alert('레거시 격언 상호작용 (추후 구현)')}
                >
                  ⋯
                </ActionButton>
              </QuoteBox>
            </QuoteSetContainer>
          )}
        </QuotesContainer>

        <SummaryQuoteBox>
          <SummaryQuote>
            {currentPersona ? currentPersona.summary : currentStimulus.summary_quote}
          </SummaryQuote>
          <ActionButton className="action-button" onClick={() => alert('요약 상호작용 (추후 구현)')}>
            ⋯
          </ActionButton>
        </SummaryQuoteBox>

        {/* 네비게이션 버튼 */}
        <NavigationContainer 
          onMouseEnter={(e) => {
            const buttons = e.currentTarget.querySelectorAll('button');
            buttons.forEach(btn => btn.style.opacity = '0.7');
          }}
          onMouseLeave={(e) => {
            const buttons = e.currentTarget.querySelectorAll('button');
            buttons.forEach(btn => btn.style.opacity = '0');
          }}
        >
          <NavigationButton 
            $side="left" 
            onClick={() => handleNavigation('prev')}
          >
            ←
          </NavigationButton>
          <NavigationButton 
            $side="right" 
            onClick={() => handleNavigation('next')}
          >
            →
          </NavigationButton>
        </NavigationContainer>

        {/* 페이지 인디케이터 및 저장 메뉴 */}
        <IndicatorContainer>
          <PageIndicator>
            {[1, 2, 3].map(page => (
              <PageDot 
                key={page} 
                $isActive={currentPage === page}
                onClick={() => handlePageChange(page)}
              >
                <PageNumber $isActive={currentPage === page}>{page}</PageNumber>
                <PageBar $isActive={currentPage === page} />
              </PageDot>
            ))}
          </PageIndicator>
          
          <div style={{ position: 'relative' }}>
            <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
              📄
            </MenuButton>
            <DropdownMenu $isVisible={isMenuOpen}>
              <MenuOption onClick={handleSaveCurrentStimulus}>
                저장하기
              </MenuOption>
            </DropdownMenu>
          </div>
        </IndicatorContainer>
      </StimulusCard>
    );
  };

  return (
    <StimulusContainer>
      <ContentArea>
        {renderContent()}
      </ContentArea>
    </StimulusContainer>
  );
};

export default StimulusView;