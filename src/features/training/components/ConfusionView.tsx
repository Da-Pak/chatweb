import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import DetailChatView from './DetailChatView';

interface ConfusionViewProps {
  personaId: string;
  personaName: string;
  onSwitchToMode?: (mode: 'interpretation' | 'proceed' | 'sentence') => void;
  onGenerateNewInterpretation?: () => void;
}

interface ConfusionSection {
  title: string;
  content: string;
  type: 'background' | 'theoretical' | 'insightful';
  sub_items: Array<{
    id: string;
    title: string;
    content: string;
    sub_sub_items?: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  }>;
}

interface ConfusionAnalysis {
  persona_id: string;
  persona_name: string;
  sections: ConfusionSection[];
  timestamp: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
`;



const ContentSection = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const SectionContainer = styled.div`
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const SectionHeader = styled.div<{ $isExpanded: boolean }>`
  padding: 16px 20px;
  background: ${props => props.$isExpanded ? '#ffffff' : '#f8f9fa'};
  color: #333;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  border-bottom: ${props => props.$isExpanded ? 'none' : '1px solid #e9ecef'};
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: ${props => props.$isExpanded ? '#ffffff' : '#e9ecef'};
  }
`;

const ToggleIcon = styled.span<{ $isExpanded: boolean }>`
  transform: ${props => props.$isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 0.3s ease;
  font-size: 14px;
`;

const SectionContent = styled.div<{ $isExpanded: boolean }>`
  max-height: ${props => props.$isExpanded ? '2000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: white;
`;

const MainContent = styled.div`
  padding: 20px;
  line-height: 1.6;
  color: #444;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
`;

const SubItemsContainer = styled.div`
  padding: 0 20px 20px;
`;

const SubItem = styled.div<{ $isExpanded: boolean }>`
  margin-bottom: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
`;

const SubItemHeader = styled.div<{ $isExpanded: boolean }>`
  padding: 12px 16px;
  background: ${props => props.$isExpanded ? '#f8f9fa' : '#ffffff'};
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  color: #333;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e9ecef;

  &:hover {
    background: #f5f5f5;
    border-color: #ddd;
  }
`;

const SubItemContent = styled.div<{ $isExpanded: boolean }>`
  max-height: ${props => props.$isExpanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${props => props.$isExpanded ? '12px 16px' : '0 16px'};
  background: #fafafa;
  font-size: 13px;
  line-height: 1.5;
  color: #666;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  gap: 16px;
`;

const ErrorContainer = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 16px;
  margin: 20px;
  color: #856404;
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #666;
`;

const ConfusionView: React.FC<ConfusionViewProps> = ({
  personaId,
  personaName,
  onSwitchToMode,
  onGenerateNewInterpretation,
}) => {
  const [analysis, setAnalysis] = useState<ConfusionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSubItems, setExpandedSubItems] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    type: 'theoretical' | 'insightful';
  } | null>(null);
  
  const generateDemoAnalysis = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // 데모용 로딩 시뮬레이션
    setTimeout(() => {
      const demoAnalysis: ConfusionAnalysis = {
        persona_id: personaId,
        persona_name: personaName,
        sections: [
          {
            title: "0. 배경 설명",
            type: 'background',
            content: `${personaName}의 이론적 관점에서 볼 때, 인간의 심리는 복잡한 층위로 구성되어 있습니다. 이 분석은 개인의 내적 갈등과 성장 가능성을 동시에 탐구하여, 표면적으로 드러나지 않는 심층적 역동을 이해하고자 합니다.`,
            sub_items: []
          },
          {
            title: "1. 이론적 해석",
            type: 'theoretical',
            content: `${personaName}의 핵심 이론을 바탕으로 당신의 심리적 구조를 체계적으로 분석해보겠습니다. 각 요소들이 서로 어떻게 상호작용하며 현재의 심리적 상태를 형성하고 있는지 살펴보겠습니다.`,
            sub_items: [
              {
                id: "theoretical_1",
                title: "[1] 핵심 갈등 요소",
                content: "당신 내면에는 성취욕구와 완벽주의 사이의 미묘한 긴장이 존재합니다. 개발자로서의 논리적 사고와 창의적 표현 욕구가 때로는 상충하며, 이는 지적 만족과 감정적 충족 사이의 균형을 찾아가는 과정에서 나타나는 자연스러운 현상입니다."
              },
              {
                id: "theoretical_2",
                title: "[2] 심리적 방어기제",
                content: "기술적 문제 해결에 집중함으로써 복잡한 감정적 이슈들을 우회하는 경향이 있습니다. 이는 합리화와 지적화의 방어기제로, 불확실한 상황에서 통제감을 유지하려는 적응적 전략이면서도 때로는 깊은 감정적 연결을 방해할 수 있습니다."
              },
              {
                id: "theoretical_3",
                title: "[3] 발달 단계적 특성",
                content: "30대는 생성감 대 침체감의 발달 과제를 마주하는 시기입니다. 기술적 전문성을 통해 사회에 기여하고자 하는 욕구와 개인적 관계에서의 깊이 있는 연결을 추구하는 양면적 욕구가 공존하며, 이는 정체성 통합의 중요한 과정입니다."
              },
              {
                id: "theoretical_4",
                title: "[4] 무의식적 동기",
                content: "코딩과 문제 해결 과정에서 창조의 기쁨을 경험하며, 이는 무의식적으로 완전한 통제와 완벽한 질서에 대한 원초적 욕구를 충족시킵니다. 동시에 끊임없이 새로운 기술을 학습하려는 충동은 성장과 변화에 대한 근본적 욕구를 반영합니다."
              }
            ]
          },
          {
            title: "2. 통찰적 해석",
            type: 'insightful',
            content: "표면적 분석을 넘어서, 당신의 숨겨진 가능성과 미래 성장 방향을 탐구해보겠습니다. 현재의 도전이 어떻게 새로운 기회의 문이 될 수 있는지 살펴보겠습니다.",
            sub_items: [
              {
                id: "insightful_1",
                title: "[1] 잠재된 가능성",
                content: "기술적 사고와 인문학적 통찰을 연결할 수 있는 독특한 능력을 지니고 있습니다. 이는 단순한 기능 구현을 넘어 사용자 경험과 인간의 본질적 욕구를 이해하는 제품을 만들어낼 잠재력을 의미하며, 기술과 인간성을 연결하는 가교 역할을 할 수 있습니다.",
                sub_sub_items: [
                  {
                    id: "insightful_1_1",
                    title: "[11] 기술-인문학 융합적 사고",
                    content: "복잡한 기술적 문제를 해결하면서도 사용자의 감정과 경험을 동시에 고려하는 능력이 있습니다."
                  },
                  {
                    id: "insightful_1_2",
                    title: "[12] 직관적 인터페이스 설계 감각",
                    content: "사용자의 무의식적 욕구를 파악하여 자연스러운 상호작용을 만들어내는 잠재력을 지니고 있습니다."
                  },
                  {
                    id: "insightful_1_3",
                    title: "[13] 시스템적 사고와 창의성의 결합",
                    content: "논리적 구조 안에서 예상치 못한 창작적 해결책을 찾아내는 독특한 능력을 보여줍니다."
                  }
                ]
              },
              {
                id: "insightful_2",
                title: "[2] 숨겨진 욕구",
                content: "논리적 완벽함 뒤에는 깊은 이해받고 싶은 욕구와 진정한 연결에 대한 갈망이 숨어있습니다. 코드의 우아함을 추구하는 것은 단순한 기술적 완성도를 넘어 아름다움과 조화에 대한 근본적 추구이며, 이는 예술적 감성의 또 다른 표현입니다.",
                sub_sub_items: [
                  {
                    id: "insightful_2_1",
                    title: "[21] 완벽함 뒤의 취약성",
                    content: "완벽한 코드를 추구하는 것은 실제로는 실패에 대한 두려움과 승인받고 싶은 욕구의 표현입니다."
                  },
                  {
                    id: "insightful_2_2",
                    title: "[22] 아름다움에 대한 갈망",
                    content: "기능적 효율성을 넘어서 우아한 솔루션을 추구하는 것은 예술적 창조욕구의 다른 형태입니다."
                  },
                  {
                    id: "insightful_2_3",
                    title: "[23] 깊은 이해에 대한 갈증",
                    content: "표면적 문제 해결을 넘어 근본적 원리와 본질을 이해하고자 하는 철학적 욕구가 있습니다."
                  }
                ]
              },
              {
                id: "insightful_3",
                title: "[3] 창조적 에너지",
                content: "문제 해결 과정에서 발현되는 창조적 에너지는 기술 영역을 넘어 다양한 분야로 확장될 가능성을 내포하고 있습니다. 특히 복잡한 시스템을 단순하고 직관적으로 만드는 능력은 소통과 교육, 심지어 예술적 표현에서도 강력한 도구가 될 수 있습니다.",
                sub_sub_items: [
                  {
                    id: "insightful_3_1",
                    title: "[31] 복잡성의 단순화 능력",
                    content: "어려운 개념을 직관적으로 설명하고 구현할 수 있는 탁월한 추상화 능력을 지니고 있습니다."
                  },
                  {
                    id: "insightful_3_2",
                    title: "[32] 혁신적 문제 해결 접근법",
                    content: "기존의 틀을 벗어나 새로운 관점에서 문제를 바라보고 해결하려는 창의적 충동이 있습니다."
                  },
                  {
                    id: "insightful_3_3",
                    title: "[33] 다학제적 연결 능력",
                    content: "서로 다른 분야의 지식과 방법론을 연결하여 새로운 통찰을 만들어내는 잠재력을 가지고 있습니다."
                  }
                ]
              },
              {
                id: "insightful_4",
                title: "[4] 변화의 징후",
                content: "최근 기술적 호기심을 넘어 인간의 심리와 행동에 대한 관심이 증가하는 것은 내적 성장의 신호입니다. 이는 단순한 기능 구현자에서 인간 경험의 설계자로 발전하려는 무의식적 욕구의 표현이며, 보다 의미 있는 작업에 대한 갈망을 나타냅니다.",
                sub_sub_items: [
                  {
                    id: "insightful_4_1",
                    title: "[41] 인간 중심적 사고로의 전환",
                    content: "기술 자체보다는 기술이 인간에게 미치는 영향과 의미에 더 많은 관심을 보이기 시작했습니다."
                  },
                  {
                    id: "insightful_4_2",
                    title: "[42] 더 깊은 목적 의식 추구",
                    content: "단순한 과업 수행을 넘어서 자신의 작업이 가지는 더 큰 의미와 가치를 찾고자 합니다."
                  },
                  {
                    id: "insightful_4_3",
                    title: "[43] 통합적 자아 정체성 형성",
                    content: "개발자로서의 정체성과 한 인간으로서의 정체성을 통합하려는 성숙한 발달 과정을 보여줍니다."
                  }
                ]
              }
            ]
          }
        ],
        timestamp: new Date().toISOString()
      };
      
      setAnalysis(demoAnalysis);
      setIsLoading(false);
    }, 1500); // 1.5초 로딩 시뮬레이션
  }, [personaId, personaName]);
  
  useEffect(() => {
    if (personaId) {
      generateDemoAnalysis();
    }
  }, [personaId, generateDemoAnalysis]);

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  const toggleSubItem = (subItemKey: string) => {
    const newExpanded = new Set(expandedSubItems);
    if (newExpanded.has(subItemKey)) {
      newExpanded.delete(subItemKey);
    } else {
      newExpanded.add(subItemKey);
    }
    setExpandedSubItems(newExpanded);
  };

  const handleSubItemClick = (subItem: any, sectionType: 'theoretical' | 'insightful') => {
    if (sectionType === 'theoretical') {
      // 이론적 해석의 하위항목은 바로 상세 뷰로 이동
      setSelectedItem({
        id: subItem.id,
        title: subItem.title,
        type: 'theoretical'
      });
      setCurrentView('detail');
    } else if (sectionType === 'insightful') {
      // 통찰적 해석의 하위항목은 토글 (sub_sub_items가 있는 경우)
      if (subItem.sub_sub_items && subItem.sub_sub_items.length > 0) {
        toggleSubItem(subItem.id);
      } else {
        setSelectedItem({
          id: subItem.id,
          title: subItem.title,
          type: 'insightful'
        });
        setCurrentView('detail');
      }
    }
  };

  const handleSubSubItemClick = (subSubItem: any) => {
    setSelectedItem({
      id: subSubItem.id,
      title: subSubItem.title,
      type: 'insightful'
    });
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedItem(null);
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🌀</div>
          <div style={{ fontSize: '18px', color: '#666' }}>생성중...</div>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <div>{error}</div>
          <button 
            onClick={generateDemoAnalysis}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            다시 시도
          </button>
        </ErrorContainer>
      </Container>
    );
  }

  if (!analysis) {
    return (
      <Container>
        <EmptyState>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌀</div>
          <div>분석을 생성하고 있습니다...</div>
        </EmptyState>
      </Container>
    );
  }

  // 상세 뷰 표시
  if (currentView === 'detail' && selectedItem) {
    return (
      <DetailChatView
        personaId={personaId}
        itemId={selectedItem.id}
        itemTitle={selectedItem.title}
        itemType={selectedItem.type}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <Container>
      <ContentSection style={{ padding: '20px 20px 20px 20px' }}>
        {analysis.sections.map((section, index) => {
          const isExpanded = expandedSections.has(section.title);
          
          return (
            <SectionContainer key={section.title}>
              <SectionHeader 
                $isExpanded={isExpanded}
                onClick={() => toggleSection(section.title)}
              >
                <span>{section.title}</span>
                <ToggleIcon $isExpanded={isExpanded}>▶</ToggleIcon>
              </SectionHeader>
              
              <SectionContent $isExpanded={isExpanded}>
                {section.content && (
                  <MainContent>
                    {section.content}
                  </MainContent>
                )}
                
                {section.sub_items && section.sub_items.length > 0 && (
                  <SubItemsContainer>
                    {section.sub_items.map((subItem, subIndex) => {
                      const isSubExpanded = expandedSubItems.has(subItem.id);
                      const hasSubSubItems = subItem.sub_sub_items && subItem.sub_sub_items.length > 0;
                      const isInsightfulSection = section.type === 'insightful';
                      
                      return (
                        <div key={subItem.id}>
                          <SubItem $isExpanded={true}>
                            <SubItemHeader
                              $isExpanded={true}
                              onClick={() => section.type !== 'background' && handleSubItemClick(subItem, section.type as 'theoretical' | 'insightful')}
                              style={{ 
                                cursor: 'pointer',
                                background: '#ffffff',
                                border: '1px solid #ddd'
                              }}
                            >
                              <span>{subItem.title}</span>
                              {isInsightfulSection && hasSubSubItems && (
                                <ToggleIcon $isExpanded={isSubExpanded}>▶</ToggleIcon>
                              )}
                            </SubItemHeader>
                            <SubItemContent $isExpanded={true}>
                              {subItem.content}
                            </SubItemContent>
                          </SubItem>
                          
                          {/* 통찰적 해석의 세부 항목들 ([11], [12], [13] 등) */}
                          {isInsightfulSection && hasSubSubItems && isSubExpanded && (
                            <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                              {subItem.sub_sub_items!.map((subSubItem) => (
                                <SubItem key={subSubItem.id} $isExpanded={true} style={{ marginBottom: '8px' }}>
                                  <SubItemHeader
                                    $isExpanded={true}
                                    onClick={() => handleSubSubItemClick(subSubItem)}
                                                                         style={{ 
                                       cursor: 'pointer',
                                       background: '#f8f9fa',
                                       fontSize: '13px',
                                       padding: '10px 14px',
                                       border: '1px solid #e0e0e0'
                                     }}
                                  >
                                    <span>{subSubItem.title}</span>
                                  </SubItemHeader>
                                  <SubItemContent $isExpanded={true} style={{ fontSize: '12px' }}>
                                    {subSubItem.content}
                                  </SubItemContent>
                                </SubItem>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </SubItemsContainer>
                )}
              </SectionContent>
            </SectionContainer>
          );
        })}
      </ContentSection>
    </Container>
  );
};

export default ConfusionView; 