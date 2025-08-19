import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarTitle,
  SidebarContent,
  SidebarMenuContent,
  SidebarToggleButton,
  ConversationMenuItem,
} from '../../shared/styles/GlobalStyle';

interface VaultSidebarProps {
  selectedItem: string | null;
  onSelectItem: (itemId: string | null) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const VaultSidebar: React.FC<VaultSidebarProps> = ({
  selectedItem,
  onSelectItem,
  isCollapsed,
  onToggle
}) => {
  const menuItems = [
    { id: 'sentences', label: '문장' },
    { id: 'memos', label: '메모' },
    { id: 'stimulus', label: '자극' },
    { id: 'qa-updates', label: 'QA 업데이트' },
  ];

  return (
    <Sidebar width="280px" $isCollapsed={isCollapsed} $variant="conversation">
      <SidebarHeader>
        <SidebarTitle $isCollapsed={isCollapsed}>저장고</SidebarTitle>
        <SidebarToggleButton onClick={onToggle}>
        </SidebarToggleButton>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenuContent>
          {menuItems.map(item => (
            <ConversationMenuItem
              key={item.id}
              $isSelected={selectedItem === item.id}
              onClick={() => onSelectItem(item.id)}
            >
              <span className="text" style={{ display: isCollapsed ? 'none' : 'inline' }}>
                {item.label}
              </span>
            </ConversationMenuItem>
          ))}
        </SidebarMenuContent>
      </SidebarContent>
    </Sidebar>
  );
};

export default VaultSidebar; 