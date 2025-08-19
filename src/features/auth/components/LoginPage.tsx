import React, { useState } from 'react';
import { login } from '../api/authApi';
import { UserCreate } from '../types/authTypes';

const LoginPage: React.FC = () => {
    const [formData, setFormData] = useState<UserCreate>({
        username: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // 에러 초기화
        if (error) setError(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 유효성 검사
        if (!formData.username.trim()) {
            setError('사용자명을 입력하세요.');
            return;
        }

        if (!formData.password.trim()) {
            setError('비밀번호를 입력하세요.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await login(formData);
            console.log('로그인 성공:', response);
            
            // 토큰 저장 (임시로 localStorage 사용)
            if (response.access_token) {
                localStorage.setItem('access_token', response.access_token);
                localStorage.setItem('token_type', response.token_type);
            }
            
            alert(`로그인 성공! ${formData.username}님 환영합니다.`);
            // 실제로는 메인 페이지로 라우팅
            
        } catch (err: any) {
            console.error('로그인 실패:', err);
            if (err.response?.status === 401) {
                setError('사용자명 또는 비밀번호가 올바르지 않습니다.');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('로그인 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const containerStyle: React.CSSProperties = {
        maxWidth: '400px',
        margin: '2rem auto',
        padding: '2rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: '#fff'
    };

    const formGroupStyle: React.CSSProperties = {
        marginBottom: '1rem'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 'bold',
        color: '#333'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        boxSizing: 'border-box'
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        backgroundColor: isLoading ? '#ccc' : '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1rem',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s'
    };

    const errorStyle: React.CSSProperties = {
        color: '#dc3545',
        fontSize: '0.875rem',
        marginTop: '0.5rem',
        padding: '0.5rem',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px'
    };

    const linkStyle: React.CSSProperties = {
        textAlign: 'center',
        marginTop: '1rem',
        fontSize: '0.875rem'
    };

    return (
        <div style={containerStyle}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
                로그인
            </h1>
            
            <form onSubmit={handleLogin}>
                <div style={formGroupStyle}>
                    <label htmlFor="username" style={labelStyle}>
                        사용자명:
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleInputChange}
                        style={inputStyle}
                        placeholder="사용자명을 입력하세요"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div style={formGroupStyle}>
                    <label htmlFor="password" style={labelStyle}>
                        비밀번호:
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        style={inputStyle}
                        placeholder="비밀번호를 입력하세요"
                        required
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <div style={errorStyle}>
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    style={buttonStyle}
                    disabled={isLoading}
                >
                    {isLoading ? '로그인 중...' : '로그인'}
                </button>
            </form>

            <div style={linkStyle}>
                계정이 없으신가요? 
                <button 
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#007bff', 
                        cursor: 'pointer', 
                        textDecoration: 'underline',
                        marginLeft: '0.25rem'
                    }}
                    onClick={() => {
                        // 실제로는 navigate('/register') 사용
                        alert('회원가입 페이지로 이동');
                    }}
                >
                    회원가입
                </button>
            </div>
        </div>
    );
};

export default LoginPage;