import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenuContent,
  SidebarToggleButton,
  PersonaMenuItem,
} from '../styles/GlobalStyle';

interface PersonaSidebarProps {
  selectedItem: string | null;
  onSelectItem: (itemId: string | null) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const PersonaSidebar: React.FC<PersonaSidebarProps> = ({
  selectedItem,
  onSelectItem,
  isCollapsed = false,
  onToggle,
}) => {
  const menuItems = [
    { id: 'training', name: '훈습' },
    { id: 'verbalization', name: '언어화' },
    { id: 'stimulus', name: '자극' },
    { id: 'vault', name: '저장고' },
    { id: 'recent', name: '최근 상호작용' },
    { id: 'admin', name: '관리' },
  ];

  // "저장고"가 선택되었을 때는 접기 버튼을 숨깁니다.
  const shouldShowToggleButton = selectedItem !== 'vault' && onToggle;

  return (
    <Sidebar width="200px" $isCollapsed={isCollapsed} $variant="persona">
      {shouldShowToggleButton && (
        <SidebarToggleButton onClick={onToggle}>
        </SidebarToggleButton>
      )}
      
      {/* 헤더 영역 (빈 공간) */}
      <SidebarHeader $isCollapsed={isCollapsed}>
        {/* 빈 공간 - 두번째 사이드바와 높이 맞춤 */}
      </SidebarHeader>

      <SidebarContent $isCollapsed={isCollapsed}>
        <SidebarMenuContent $variant="persona">
          {menuItems.map((item) => (
            <PersonaMenuItem
              key={item.id}
              $isSelected={selectedItem === item.id}
              onClick={() => onSelectItem(item.id)}
            >
              {item.name}
            </PersonaMenuItem>
          ))}
        </SidebarMenuContent>
      </SidebarContent>
    </Sidebar>
  );
};

export default PersonaSidebar; 