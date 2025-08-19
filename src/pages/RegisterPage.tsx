import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { register } from '../features/auth/api/authApi';
import { UserCreate } from '../features/auth/types/authTypes';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  padding: 20px;
`;

const FormFrame = styled.div`
  background: white;
  padding: 3rem 2.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 2rem;
  text-align: center;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
  }
`;

const SignupButton = styled.button`
  width: 100%;
  background: #2d3748;
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
  
  &:hover:not(:disabled) {
    background: #1a202c;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
  }
`;

const SocialSection = styled.div`
  margin: 2rem 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e2e8f0;
  }
`;

const SocialLabel = styled.span`
  background: white;
  padding: 0 1rem;
  color: #718096;
  font-size: 0.875rem;
  position: relative;
`;

const SocialButton = styled.button<{ provider: 'google' | 'naver' | 'kakao' }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  ${({ provider }) => {
    switch (provider) {
      case 'google':
        return `
          background: white;
          color: #2d3748;
          &:hover {
            background: #f7fafc;
            border-color: #cbd5e0;
          }
        `;
      case 'naver':
        return `
          background: #03c75a;
          color: white;
          border-color: #03c75a;
          &:hover {
            background: #02b351;
          }
        `;
      case 'kakao':
        return `
          background: #fee500;
          color: #3c1e1e;
          border-color: #fee500;
          &:hover {
            background: #fdd835;
          }
        `;
    }
  }}
`;

const FooterText = styled.p`
  margin-top: 2rem;
  color: #718096;
  font-size: 0.9rem;
`;

const LoginLink = styled(Link)`
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  background: #f7fafc;
  color: #2d3748;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #e2e8f0;
`;

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (formData.username.length < 3) {
      setError('사용자명은 3자 이상이어야 합니다.');
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (formData.password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      
      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: 'google' | 'naver' | 'kakao') => {
    // TODO: 소셜 회원가입 구현
    alert(`${provider} 회원가입 기능은 준비 중입니다.`);
  };

  if (success) {
    return (
      <Container>
        <FormFrame>
          <Title>회원가입 완료!</Title>
          <SuccessMessage>
            회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...
          </SuccessMessage>
        </FormFrame>
      </Container>
    );
  }

  return (
    <Container>
      <FormFrame>
        <Title>회원가입</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>이메일 주소</Label>
            <Input
              type="email"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="이메일을 입력하세요"
              required
              autoFocus
            />
          </InputGroup>
          
          <InputGroup>
            <Label>비밀번호</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="6자 이상 입력하세요"
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Label>비밀번호 확인</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </InputGroup>
          
          <SignupButton type="submit" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입'}
          </SignupButton>
        </form>
        
        <SocialSection>
          <SocialLabel>또는</SocialLabel>
        </SocialSection>
        
        <SocialButton provider="google" onClick={() => handleSocialSignup('google')}>
          🔍 Google로 가입하기
        </SocialButton>
        
        <SocialButton provider="naver" onClick={() => handleSocialSignup('naver')}>
          N 네이버로 가입하기
        </SocialButton>
        
        <SocialButton provider="kakao" onClick={() => handleSocialSignup('kakao')}>
          💬 카카오로 가입하기
        </SocialButton>
        
        <FooterText>
          이미 계정이 있으신가요? <LoginLink to="/login">로그인</LoginLink>
        </FooterText>
      </FormFrame>
    </Container>
  );
};

export default RegisterPage; 