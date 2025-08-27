import React, { useState, useEffect } from 'react';
import { Persona } from '../../shared/types';
import styled from 'styled-components';
import InterpretationPopup from './InterpretationPopup';
import { chatApi } from '../../shared/api/chatApi';

interface TrainingCategoryViewProps {
  personas: Record<string, Persona>;
  onSelectPersona: (personaId: string) => void;
  onInterpretationComplete: (personaId: string, interpretation: string) => void;
}

const CategoryContainer = styled.div`
  padding: 20px;
  height: 100%;
  overflow-y: auto;
`;



const CategoryHeader = styled.div<{ $isExpanded: boolean }>`
  background: linear-gradient(135deg, #f0f0f0 0%, #d0d0d0 100%);
  color: #333;
  padding: 16px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, #e8e8e8 0%, #c8c8c8 100%);
  }
`;

const CategoryIcon = styled.span<{ $isExpanded: boolean }>`
  transform: ${props => props.$isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 0.3s ease;
  font-size: 16px;
`;

const SubcategoryContainer = styled.div<{ $isExpanded: boolean }>`
  overflow: hidden;
  transition: all 0.3s ease;
  max-height: ${props => props.$isExpanded ? '1000px' : '0'};
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: ${props => props.$isExpanded ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'};
`;





const PersonaCard = styled.div<{ $hasInterpretation: boolean }>`
  background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    border-color: #ccc;
    background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CheckIcon = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 16px;
  font-weight: bold;
`;

const PersonaName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const PersonaDescription = styled.p`
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 8px;
`;



// 직접 표시 카테고리용 스타일 (들여쓰기)
const DirectCategorySection = styled.div`
  margin-left: 24px;
  margin-bottom: 24px;
`;

const DirectCategoryTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #444;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 4px solid #ddd;
`;









const TrainingCategoryView: React.FC<TrainingCategoryViewProps> = ({
  personas,
  onSelectPersona,
  onInterpretationComplete,
}) => {
  const [selectedPersonaForInterpretation, setSelectedPersonaForInterpretation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [interpretationStatuses, setInterpretationStatuses] = useState<Record<string, boolean>>({});


  // 해석 상태 가져오기
  useEffect(() => {
    const fetchInterpretationStatus = async () => {
      const response = await chatApi.getInterpretationStatus();
      if (response.data) {
        const statusMap: Record<string, boolean> = {};
        response.data.forEach(status => {
          statusMap[status.persona_id] = status.has_interpretation;
        });
        setInterpretationStatuses(statusMap);
      }
    };

    fetchInterpretationStatus();
  }, []);

  // 카테고리별로 페르소나 그룹화
  const groupedPersonas = Object.entries(personas).reduce((acc, [id, persona]) => {
    if (!acc[persona.category]) {
      acc[persona.category] = {};
    }
    if (!acc[persona.category][persona.subcategory]) {
      acc[persona.category][persona.subcategory] = [];
    }
    acc[persona.category][persona.subcategory].push({ id, ...persona });
    return acc;
  }, {} as Record<string, Record<string, Array<{ id: string } & Persona>>>);

  // 최상위 카테고리들 (심리학, 철학)은 아코디언 없이 계속 표시
  const topLevelCategories = ['심리학', '철학'];
  
  // 하위 카테고리별 아코디언 상태 관리
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  const toggleSubcategory = (subcategory: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategory]: !prev[subcategory]
    }));
  };

  const handlePersonaClick = async (personaId: string, personaName: string) => {
    const hasInterpretation = interpretationStatuses[personaId];
    
    if (hasInterpretation) {
      // 해석이 있으면 바로 채팅 모드로
      const response = await chatApi.getInterpretation(personaId);
      if (response.data) {
        onInterpretationComplete(personaId, response.data.interpretation);
        onSelectPersona(personaId);
      }
    } else {
      // 해석이 없으면 생성 팝업 표시
      setSelectedPersonaForInterpretation({ id: personaId, name: personaName });
    }
  };

  const handleInterpretationConfirm = async () => {
    if (!selectedPersonaForInterpretation) return;
    
    // 백엔드에서 해석 생성 요청
    const response = await chatApi.generateInterpretation({
      persona_id: selectedPersonaForInterpretation.id,
      user_input: "기본 심리 해석 요청"
    });
    
    if (response.data) {
      // 해석 상태 업데이트
      setInterpretationStatuses(prev => ({
        ...prev,
        [selectedPersonaForInterpretation.id]: true
      }));
    }
  };

  const handleInterpretationCancel = () => {
    setSelectedPersonaForInterpretation(null);
  };

  const handleInterpretationComplete = (interpretation: string) => {
    if (selectedPersonaForInterpretation) {
      onInterpretationComplete(selectedPersonaForInterpretation.id, interpretation);
      onSelectPersona(selectedPersonaForInterpretation.id);
      setSelectedPersonaForInterpretation(null);
    }
  };



  return (
    <>
      <CategoryContainer>
        {/* 최상위 카테고리들 (심리학, 철학) - 계속 표시 */}
        {topLevelCategories.map(topCategory => {
          const subcategories = groupedPersonas[topCategory];
          if (!subcategories) return null;
          
          return (
            <DirectCategorySection key={topCategory}>
              <DirectCategoryTitle>{topCategory}</DirectCategoryTitle>
              
              {/* 하위 카테고리들 (정신분석, 인지행동 등) - 아코디언 */}
              {Object.entries(subcategories).map(([subcategory, personaList]) => (
                <div key={subcategory} style={{ marginBottom: '16px' }}>
                  <CategoryHeader
                    $isExpanded={expandedSubcategories[subcategory] || false}
                    onClick={() => toggleSubcategory(subcategory)}
                    style={{ marginLeft: '16px' }}
                  >
                    <span>{subcategory}</span>
                    <CategoryIcon $isExpanded={expandedSubcategories[subcategory] || false}>
                      ▶
                    </CategoryIcon>
                  </CategoryHeader>
                  
                  <SubcategoryContainer 
                    $isExpanded={expandedSubcategories[subcategory] || false}
                    style={{ marginLeft: '32px' }}
                  >
                    {personaList.map((persona) => (
                      <PersonaCard 
                        key={persona.id}
                        $hasInterpretation={interpretationStatuses[persona.id] || false}
                        onClick={() => handlePersonaClick(persona.id, persona.name)}
                      >
                        {interpretationStatuses[persona.id] && (
                          <CheckIcon>✓</CheckIcon>
                        )}
                        <PersonaName>{persona.name}</PersonaName>
                        <PersonaDescription 
                          dangerouslySetInnerHTML={{
                            __html: persona.description.replace(/•/g, '<span style="display: inline-block; width: 8px; height: 8px; background: #666; border-radius: 50%; margin-right: 8px; margin-bottom: 2px;"></span>')
                          }}
                        />
                      </PersonaCard>
                    ))}
                  </SubcategoryContainer>
                </div>
              ))}
            </DirectCategorySection>
          );
        })}
      </CategoryContainer>

      {selectedPersonaForInterpretation && (
        <InterpretationPopup
          isOpen={!!selectedPersonaForInterpretation}
          personaId={selectedPersonaForInterpretation.id}
          personaName={selectedPersonaForInterpretation.name}
          onConfirm={handleInterpretationConfirm}
          onCancel={handleInterpretationCancel}
          onComplete={handleInterpretationComplete}
        />
      )}
    </>
  );
};

export default TrainingCategoryView; 