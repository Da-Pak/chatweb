import styled from 'styled-components';

// 토스트 스타일
export const Toast = styled.div<{ $show: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #333;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: opacity 0.3s ease-in-out;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};
`;

// 컨테이너 스타일
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
`;

// 헤더 섹션
export const HeaderSection = styled.div`
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
`;

// 채팅 섹션
export const ChatSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ChatInputSection = styled.div`
  border-top: 1px solid #e0e0e0;
  padding: 20px;
  background: #fff;
`;

// 빈 상태 스타일
export const EmptyChat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  gap: 20px;
`;

export const EmptyIcon = styled.div`
  font-size: 48px;
  opacity: 0.5;
`;

// 버튼 스타일
export const ActionButton = styled.button`
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled(ActionButton)`
  background-color: #6c757d;

  &:hover {
    background-color: #545b62;
  }
`;

// 스레드 관련 스타일
export const ThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

export const ThreadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
`;

export const ThreadTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
`;

// 로딩 상태
export const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`; 