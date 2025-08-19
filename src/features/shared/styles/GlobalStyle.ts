import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f5f5f5;
    color: #333;
    overflow: hidden;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: #f0f0f0;
  }

  ::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
`;

export const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
  gap: 0px;
  padding: 0px;
`;

export const Sidebar = styled.div<{ 
  width: string; 
  $isCollapsed?: boolean; 
  $variant?: 'conversation' | 'persona' 
}>`
  width: ${props => props.$isCollapsed ? '60px' : props.width};
  background-color: ${props => {
    if (props.$variant === 'conversation') return '#ffffff';
    if (props.$variant === 'persona') return '#ffffff';
    return '#ffffff';
  }};
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  box-shadow: none;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  z-index: ${props => props.$variant === 'conversation' ? 2 : 1};
`;

export const SidebarToggleButton = styled.button`
  position: absolute;
  top: 12px;
  right: 4px;
  width: 32px;
  height: 32px;
  border: none;
  background-color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #f8f8f8;
    color: #333;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &::before {
    content: '';
    width: 18px;
    height: 2px;
    background-color: currentColor;
    border-radius: 1px;
    box-shadow: 
      0 -5px 0 currentColor,
      0 5px 0 currentColor;
    transition: all 0.2s ease;
  }
`;

export const SidebarHeader = styled.div<{ $isCollapsed?: boolean }>`
  height: 80px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  opacity: ${props => props.$isCollapsed ? 0 : 1};
  transition: opacity 0.3s ease;
  ${props => props.$isCollapsed && `
    padding: 8px;
  `}
`;

export const SidebarTitle = styled.h2<{ $isCollapsed?: boolean }>`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
  ${props => props.$isCollapsed && `
    opacity: 0;
    pointer-events: none;
  `}
`;

export const SidebarSubtitle = styled.p<{ $isCollapsed?: boolean }>`
  font-size: 14px;
  color: #666;
  ${props => props.$isCollapsed && `
    opacity: 0;
    pointer-events: none;
  `}
`;

export const SidebarContent = styled.div<{ $isCollapsed?: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  opacity: ${props => props.$isCollapsed ? 0 : 1};
  transition: opacity 0.3s ease;
  ${props => props.$isCollapsed && `
    pointer-events: none;
  `}
`;

export const SidebarMenuContent = styled.div<{ $variant?: 'conversation' | 'persona' }>`
  flex: 1;
  overflow-y: auto;
  background-color: transparent;
  padding: 16px 0;
  ${props => props.$variant === 'conversation' && `
    border-right: 1px solid #000000;
  `}
  ${props => props.$variant === 'persona' && `
    border-right: 1px solid #000000;
  `}
`;

export const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 0;
  border: none;
  overflow: hidden;
`;

export const ChatHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #ddd;
  background-color: #f8f8f8;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ChatHeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #333;
`;

export const ChatContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const MessageContainer = styled.div<{ $isUser?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 16px;
`;

export const MessageBubble = styled.div<{ $isUser?: boolean; $personaColor?: string }>`
  max-width: 70%;
  padding: 16px 20px;
  border-radius: ${props => props.$isUser ? '20px' : '0px'};
  background: ${props => 
    props.$isUser 
      ? 'linear-gradient(135deg, #ffffff 0%, #e8e8e8 100%)' 
      : '#ffffff'
  };
  color: #333;
  font-size: 15px;
  line-height: 1.4;
  box-shadow: ${props => props.$isUser ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
  white-space: pre-wrap;
  word-wrap: break-word;
  border: none;
`;

export const MessageInfo = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const InputContainer = styled.div`
  padding: 20px;
  border-top: none;
  background-color: #ffffff;
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: stretch;
  max-width: 100%;
  position: relative;
  gap: 12px;
`;

export const MessageInputContainer = styled.div`
  flex: 1;
  position: relative;
  max-width: calc(100% - 160px); /* 버튼들을 위한 공간 확보 */
`;

export const MessageInput = styled.textarea`
  width: 100%;
  min-height: 88px; /* 2배로 증가 */
  max-height: 200px;
  padding: 16px 50px 16px 16px; /* 상하 패딩 증가 */
  border: 1px solid #ddd;
  border-radius: 22px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  outline: none;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  overflow-y: auto;
  
  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE, Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }
  
  &:focus {
    border-color: #666;
    box-shadow: 0 0 0 3px rgba(102, 102, 102, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

export const SendButton = styled.button<{ disabled?: boolean }>`
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 36px;
  height: 36px;
  background-color: ${props => props.disabled ? '#f5f5f5' : 'white'};
  color: ${props => props.disabled ? '#999' : '#333'};
  border: 2px solid ${props => props.disabled ? '#ddd' : '#333'};
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${props => props.disabled ? '#f5f5f5' : '#f8f8f8'};
    border-color: ${props => props.disabled ? '#ddd' : '#000'};
    transform: ${props => props.disabled ? 'none' : 'scale(1.05)'};
  }
  
  &:active {
    transform: ${props => props.disabled ? 'none' : 'scale(0.95)'};
    background-color: ${props => props.disabled ? '#f5f5f5' : '#f0f0f0'};
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 88px; /* 입력창과 같은 높이 */
  min-width: 140px; /* 버튼들의 최소 너비 */
`;

export const QuickPhraseButton = styled.button`
  width: 100%;
  height: 40px; /* 입력창 높이의 절반보다 약간 작게 */
  border-radius: 16px; /* 문장선택 버튼과 동일한 라운딩 */
  border: 1px solid #ccc;
  background: linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%); /* 왼쪽에서 오른쪽으로 흰색→연한회색 */
  color: #333;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.2;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 살짝의 음영 처리 */
  
  &:hover {
    background: linear-gradient(90deg, #f8f8f8 0%, #e8e8e8 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

export const SentenceModeButton = styled.button<{ $isActive?: boolean; $hasSelected?: boolean }>`
  width: 100%;
  height: 40px; /* 입력창 높이의 절반보다 약간 작게 */
  background: ${props => {
    if (props.$hasSelected) return 'white'; /* 활성화 시 흰 배경 */
    return props.$isActive ? '#333' : '#333'; /* 기본: 검은색 배경 */
  }};
  color: ${props => {
    if (props.$hasSelected) return '#333'; /* 활성화 시 검은 글씨 */
    return props.$isActive ? 'white' : 'white'; /* 기본: 흰 글씨 */
  }};
  border: 2px solid ${props => props.$hasSelected ? '#333' : '#333'}; /* 항상 검은 테두리 */
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  &:hover {
    background: ${props => {
      if (props.$hasSelected) return '#f8f8f8';
      return props.$isActive ? '#555' : '#555';
    }};
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

export const PersonaItem = styled.div<{ $isSelected?: boolean; $personaColor?: string }>`
  padding: 16px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.$isSelected ? '#555' : 'transparent'};
  background-color: ${props => props.$isSelected ? '#f5f5f5' : '#fafafa'};
  
  &:hover {
    background-color: ${props => props.$isSelected ? '#efefef' : '#f0f0f0'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

export const PersonaName = styled.div<{ $personaColor?: string }>`
  font-weight: 600;
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
`;

export const PersonaDescription = styled.div`
  font-size: 14px;
  color: #666;
  line-height: 1.3;
`;

export const ConversationItem = styled.div<{ $isSelected?: boolean }>`
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.$isSelected ? '#efefef' : 'transparent'};
  border-left: 3px solid ${props => props.$isSelected ? '#555' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$isSelected ? '#efefef' : '#f5f5f5'};
  }
`;

export const ConversationPreview = styled.div`
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ConversationTime = styled.div`
  font-size: 12px;
  color: #666;
`;

export const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  
  &::after {
    content: '';
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #666;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ErrorMessage = styled.div`
  padding: 12px 16px;
  background-color: #f8f8f8;
  border: 1px solid #ccc;
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  margin: 16px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px;
  text-align: center;
  color: #666;
`;

export const EmptyStateTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 8px;
  color: #333;
`;

export const EmptyStateText = styled.p`
  font-size: 14px;
  line-height: 1.5;
`;

export const ConversationMenuItem = styled.div<{ $isSelected?: boolean }>`
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => 
    props.$isSelected 
      ? 'linear-gradient(to right, #ffffff 0%, #e0e0e0 100%)'
      : 'transparent'
  };
  color: #333;
  font-size: 16px;
  font-weight: 500;
  
  &:hover {
    background: ${props => 
      props.$isSelected 
        ? 'linear-gradient(to right, #ffffff 0%, #e0e0e0 100%)'
        : '#e0e0e0'
    };
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const PersonaMenuItem = styled.div<{ $isSelected?: boolean }>`
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => 
    props.$isSelected 
      ? 'linear-gradient(to right, #ffffff 0%, #e0e0e0 100%)'
      : 'transparent'
  };
  color: #333;
  font-size: 16px;
  font-weight: 500;
  
  &:hover {
    background: ${props => 
      props.$isSelected 
        ? 'linear-gradient(to right, #ffffff 0%, #e0e0e0 100%)'
        : '#e0e0e0'
    };
  }

  &:last-child {
    border-bottom: none;
  }
`; 