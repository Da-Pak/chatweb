import React, { useState } from 'react';
import styled from 'styled-components';
import VaultSidebar from './VaultSidebar';
import SentenceVaultView from './SentenceVaultView';
import MemoVaultView from './MemoVaultView';
import StimulusVaultView from '../../stimulus/components/StimulusVaultView';

interface Persona {
  name: string;
  description: string;
  color: string;
  prompt: string;
  category: string;
  subcategory: string;
}

interface VaultViewProps {
  personas: Record<string, Persona>;
  onNavigateToPersona: (personaId: string, mode: 'sentence') => void;
  onNavigateToThread: (threadId: string, threadType: string, interactionMessage?: string) => void;
  onNavigateToPersonaWithSentence?: (personaId: string, mode: 'sentence', selectedSentence: string) => void;
}

const VaultContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100vh;
`;

const ContentArea = styled.div`
  flex: 1;
  background: #fff;
  overflow: hidden;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
  font-size: 16px;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const VaultView: React.FC<VaultViewProps> = ({
  personas,
  onNavigateToPersona,
  onNavigateToThread,
  onNavigateToPersonaWithSentence
}) => {
  const [selectedVaultItem, setSelectedVaultItem] = useState<string | null>('sentences');
  const [isVaultSidebarCollapsed, setIsVaultSidebarCollapsed] = useState(false);

  const handleSelectVaultItem = (itemId: string | null) => {
    setSelectedVaultItem(itemId);
  };

  const toggleVaultSidebar = () => {
    setIsVaultSidebarCollapsed(!isVaultSidebarCollapsed);
  };

  const renderContent = () => {
    switch (selectedVaultItem) {
      case 'sentences':
        return (
          <SentenceVaultView
            personas={personas}
            onNavigateToPersona={onNavigateToPersona}
            onNavigateToThread={onNavigateToThread}
            onNavigateToPersonaWithSentence={onNavigateToPersonaWithSentence}
          />
        );
      case 'memos':
        return (
          <MemoVaultView
            personas={personas}
            onNavigateToThread={onNavigateToThread}
          />
        );
      case 'stimulus':
        return (
          <StimulusVaultView
            personas={personas}
          />
        );
      case 'qa-updates':
        return (
          <EmptyState>
            <EmptyIcon>🔄</EmptyIcon>
            <div>QA 업데이트 기능은 준비 중입니다</div>
          </EmptyState>
        );
      default:
        return (
          <EmptyState>
            <EmptyIcon>📦</EmptyIcon>
            <div>저장고 항목을 선택해주세요</div>
          </EmptyState>
        );
    }
  };

  return (
    <VaultContainer>
      <VaultSidebar
        selectedItem={selectedVaultItem}
        onSelectItem={handleSelectVaultItem}
        isCollapsed={isVaultSidebarCollapsed}
        onToggle={toggleVaultSidebar}
      />
      <ContentArea>
        {renderContent()}
      </ContentArea>
    </VaultContainer>
  );
};

export default VaultView; 