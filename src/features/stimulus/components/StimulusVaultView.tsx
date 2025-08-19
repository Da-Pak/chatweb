import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// 타입 정의
interface StimulusQuote {
  id: string;
  content: string;
  order: number;
}

interface StimulusQuoteSet {
  quotes: StimulusQuote[];
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
  quote_sets: StimulusQuoteSet[];
  summary_quote: string;
  persona_info?: PersonaInfo[];
  created_at: string;
}

interface StimulusVaultItem {
  id: string;
  original_stimulus_id: string;
  saved_content: string;
  content_type: 'quote' | 'summary' | 'theme' | 'current_set' | 'all_sets';
  source_date: string;
  persona_name: string;
  saved_at: string;
  tags: string[];
  saved_page?: number;  // 저장된 페이지 번호
  original_stimulus?: DailyStimulusItem;
}

interface StimulusVaultViewProps {
  personas?: Record<string, any>;
}

// StimulusView와 동일한 스타일 컴포넌트들
const VaultContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
`;

const VaultHeader = styled.div`
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VaultTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
`;

const VaultStats = styled.div`
  font-size: 16px;
  color: #666;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
  text-align: center;
  
  .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
`;

// 메인 컴포넌트
const StimulusVaultView: React.FC<StimulusVaultViewProps> = ({ personas }) => {
  const [items, setItems] = useState<StimulusVaultItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // 데이터 로드
  useEffect(() => {
    loadStimulusVault();
  }, []);

  const loadStimulusVault = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/vault/stimulus');
      const data = await response.json();
      
      if (data.success) {
        // 원본 stimulus가 있는 항목들만 필터링
        const validItems = (data.items || []).filter((item: StimulusVaultItem) => item.original_stimulus);
        setItems(validItems);
      } else {
        setError('데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('자극 저장고 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 보고 있는 아이템
  const currentItem = items[currentItemIndex];

  // 페이지 변경
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= 3) {
      setCurrentPage(page);
    }
  };

  // 좌우 네비게이션 (아이템 간 이동)
  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentItemIndex(currentItemIndex === 0 ? items.length - 1 : currentItemIndex - 1);
    } else {
      setCurrentItemIndex(currentItemIndex === items.length - 1 ? 0 : currentItemIndex + 1);
    }
    setCurrentPage(1); // 새로운 아이템으로 이동할 때는 첫 번째 페이지로
  };

  // 아이템 삭제
  const handleDelete = async () => {
    if (!currentItem || !window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/vault/stimulus/${currentItem.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        const newItems = items.filter(item => item.id !== currentItem.id);
        setItems(newItems);
        
        // 삭제 후 인덱스 조정
        if (newItems.length === 0) {
          setCurrentItemIndex(0);
        } else if (currentItemIndex >= newItems.length) {
          setCurrentItemIndex(newItems.length - 1);
        }
        setCurrentPage(1);
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      alert('삭제에 실패했습니다.');
    }
    
    setIsMenuOpen(false);
  };

  // 상호작용 버튼 클릭
  const handleInteraction = (quoteId: string, quoteContent: string) => {
    navigator.clipboard.writeText(quoteContent);
    alert('클립보드에 복사되었습니다!');
  };

  // 컨텐츠 렌더링
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState>저장된 자극을 불러오는 중...</LoadingState>;
    }
    
    if (error) {
      return (
        <ErrorState>
          <div>{error}</div>
          <button onClick={loadStimulusVault}>다시 시도</button>
        </ErrorState>
      );
    }
    
    if (items.length === 0) {
      return (
        <EmptyState>
          <div className="icon">⚡</div>
          <div>저장된 자극이 없습니다</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
            자극 페이지에서 격언을 저장해보세요
          </div>
        </EmptyState>
      );
    }

    if (!currentItem || !currentItem.original_stimulus) {
      return <LoadingState>자극 데이터를 처리하는 중...</LoadingState>;
    }

    const stimulus = currentItem.original_stimulus;

    // 현재 페이지에 해당하는 심리학자 정보 가져오기
    const getCurrentPersonaInfo = () => {
      // current_set 타입인 경우 저장된 페이지 사용
      const pageToUse = currentItem.content_type === 'current_set' && currentItem.saved_page 
        ? currentItem.saved_page 
        : currentPage;
        
      if (stimulus.persona_info && stimulus.persona_info[pageToUse - 1]) {
        return stimulus.persona_info[pageToUse - 1];
      }
      return null;
    };

    const currentPersona = getCurrentPersonaInfo();

    return (
      <StimulusCard>
        <Header>
          <DateDisplay>{stimulus.date} 저장됨</DateDisplay>
          <PersonaName>
            {currentPersona ? currentPersona.name : stimulus.persona_name}
          </PersonaName>
        </Header>

        <MainThemeBox>
          <MainTheme>
            {currentPersona ? currentPersona.theme : stimulus.main_theme}
          </MainTheme>
          <ActionButton className="action-button" onClick={() => handleInteraction('theme', currentPersona ? currentPersona.theme : stimulus.main_theme)}>
            ⋯
          </ActionButton>
        </MainThemeBox>

        {/* 저장된 내용 표시 */}
        {currentItem.content_type === 'quote' ? (
          // 개별 격언인 경우만 단순하게 표시
          <QuotesContainer>
            <QuoteSetContainer>
              <QuoteBox $isVisible={true} $isFirst={true} $isLast={true}>
                <QuoteContent>{currentItem.saved_content}</QuoteContent>
              </QuoteBox>
            </QuoteSetContainer>
          </QuotesContainer>
        ) : (
          // current_set 포함한 다른 모든 타입은 원본 UI 유지
          <QuotesContainer>
            <VerticalLine />
            
            {/* 현재 페이지의 격언 세트 표시 */}
            {(() => {
              // current_set 타입인 경우 저장된 페이지 사용
              const pageToUse = currentItem.content_type === 'current_set' && currentItem.saved_page 
                ? currentItem.saved_page 
                : currentPage;
              
              return pageToUse <= 3 && stimulus.quote_sets && stimulus.quote_sets[pageToUse - 1] && (
                <QuoteSetContainer>
                  {stimulus.quote_sets[pageToUse - 1].quotes.map((quote, index) => (
                  <QuoteBox 
                    key={quote.id}
                    $isVisible={true}
                    $isFirst={index === 0}
                    $isLast={index === stimulus.quote_sets[pageToUse - 1].quotes.length - 1}
                  >
                    <QuoteContent>{quote.content}</QuoteContent>
                    <ActionButton 
                      className="action-button" 
                      onClick={() => handleInteraction(quote.id, quote.content)}
                    >
                      ⋯
                    </ActionButton>
                  </QuoteBox>
                  ))}
                </QuoteSetContainer>
              );
            })()}
          </QuotesContainer>
        )}

        {/* 개별 격언인 경우에만 요약 표시하지 않음 */}
        {currentItem.content_type !== 'quote' && (
          <SummaryQuoteBox>
            <SummaryQuote>
              {currentPersona ? currentPersona.summary : stimulus.summary_quote}
            </SummaryQuote>
            <ActionButton className="action-button" onClick={() => handleInteraction('summary', currentPersona ? currentPersona.summary : stimulus.summary_quote)}>
              ⋯
            </ActionButton>
          </SummaryQuoteBox>
        )}

        {/* 네비게이션 버튼 (아이템 간 이동) */}
        {items.length > 1 && (
          <NavigationContainer 
            onMouseEnter={(e) => {
              const buttons = e.currentTarget.querySelectorAll('button');
              buttons.forEach(btn => (btn as HTMLElement).style.opacity = '0.7');
            }}
            onMouseLeave={(e) => {
              const buttons = e.currentTarget.querySelectorAll('button');
              buttons.forEach(btn => (btn as HTMLElement).style.opacity = '0');
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
        )}

        {/* 메뉴 - current_set 타입인 경우에만 페이지네이션 숨김 */}
        <IndicatorContainer>
          {currentItem.content_type !== 'current_set' && (
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
          )}
          
          {/* current_set 타입이 아닌 경우에만 메뉴 표시 */}
          {currentItem.content_type !== 'current_set' && (
            <div style={{ position: 'relative' }}>
              <MenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                📄
              </MenuButton>
              <DropdownMenu $isVisible={isMenuOpen}>
                <MenuOption onClick={() => navigator.clipboard.writeText(currentItem.content_type === 'quote' ? currentItem.saved_content : (currentPersona ? currentPersona.summary : stimulus.summary_quote))}>
                  {currentItem.content_type === 'quote' ? '격언 복사' : '요약 복사'}
                </MenuOption>
                <MenuOption onClick={handleDelete}>
                  삭제하기
                </MenuOption>
              </DropdownMenu>
            </div>
          )}
        </IndicatorContainer>
      </StimulusCard>
    );
  };

  return (
    <VaultContainer>
      <VaultHeader>
        <VaultTitle>자극 저장고</VaultTitle>
        <VaultStats>
          {items.length > 0 && (
            <>
              {currentItemIndex + 1} / {items.length} 
              {items.length > 1 && ' (← → 키로 이동)'}
            </>
          )}
        </VaultStats>
      </VaultHeader>
      
      <ContentArea>
        {renderContent()}
      </ContentArea>
    </VaultContainer>
  );
};

export default StimulusVaultView;