import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const Header = styled.div`
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserName = styled.span`
  color: #4a5568;
  font-weight: 500;
`;

const LogoutButton = styled.button`
  background: #e53e3e;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease;
  
  &:hover {
    background: #c53030;
  }
`;

const Content = styled.div`
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  text-align: center;
`;

const WelcomeTitle = styled.h2`
  font-size: 2rem;
  color: #2d3748;
  margin-bottom: 1rem;
`;

const WelcomeText = styled.p`
  color: #718096;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FeatureCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.3rem;
  color: #2d3748;
  margin-bottom: 1rem;
`;

const FeatureDescription = styled.p`
  color: #718096;
  line-height: 1.6;
`;

interface User {
  id: number;
  username: string;
  has_completed_qa: boolean;
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('사용자 데이터 파싱 오류:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return (
      <Container>
        <Content>
          <WelcomeCard>
            <WelcomeText>로딩 중...</WelcomeText>
          </WelcomeCard>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Logo>Confusion Living</Logo>
        <UserInfo>
          <UserName>환영합니다, {user.username}님!</UserName>
          <LogoutButton onClick={handleLogout}>
            로그아웃
          </LogoutButton>
        </UserInfo>
      </Header>

      <Content>
        <WelcomeCard>
          <WelcomeTitle>🎉 로그인 성공!</WelcomeTitle>
          <WelcomeText>
            Working Through에 오신 것을 환영합니다. <br />
            다양한 기능을 통해 더 나은 경험을 만들어보세요.
          </WelcomeText>
        </WelcomeCard>

        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>💬</FeatureIcon>
            <FeatureTitle>다중 페르소나 채팅</FeatureTitle>
            <FeatureDescription>
              다양한 AI 페르소나와 대화하며 새로운 관점을 얻어보세요. 
              각 페르소나는 고유한 성격과 전문성을 가지고 있습니다.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>📚</FeatureIcon>
            <FeatureTitle>개인화된 학습</FeatureTitle>
            <FeatureDescription>
              당신의 학습 스타일에 맞춘 개인화된 콘텐츠와 
              진도를 제공합니다.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>📊</FeatureIcon>
            <FeatureTitle>진행 상황 추적</FeatureTitle>
            <FeatureDescription>
              학습 진행 상황을 시각적으로 확인하고 
              목표 달성을 위한 인사이트를 얻으세요.
            </FeatureDescription>
          </FeatureCard>

          <FeatureCard>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>보안 및 개인정보</FeatureTitle>
            <FeatureDescription>
              최고 수준의 보안으로 당신의 데이터와 
              개인정보를 안전하게 보호합니다.
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>
      </Content>
    </Container>
  );
};

export default DashboardPage; 