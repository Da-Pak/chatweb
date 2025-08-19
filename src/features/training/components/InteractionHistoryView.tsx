import React from 'react';
import styled from 'styled-components';

interface InteractionHistoryViewProps {
  personaId: string;
  personaName: string;
  allInteractionRecords: any[];
  onThreadSelect: (thread: any) => void;
  onSwitchToMode?: (mode: 'interpretation' | 'proceed' | 'sentence') => void;
  onGenerateNewInterpretation?: () => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
`;

const InteractionHistoryView: React.FC<InteractionHistoryViewProps> = () => {
  return (
    <Container>
      {/* 빈 흰색창 */}
    </Container>
  );
};

export default InteractionHistoryView; 