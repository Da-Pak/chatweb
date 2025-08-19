import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 3rem;
  text-align: center;
  letter-spacing: -0.02em;
`;

const LoginButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 14px 32px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: white;
    color: #2d3748;
    border: 2px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <Container>
      <Title>Confusion Living</Title>
      <LoginButton onClick={handleLoginClick}>
        Login
      </LoginButton>
    </Container>
  );
};

export default LandingPage; 