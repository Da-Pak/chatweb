import React, { useState } from 'react';
import { register } from '../api/authApi';
import { UserCreate } from '../types/authTypes';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState<UserCreate>({
        username: '',
        password: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // 에러 초기화
        if (error) setError(null);
    };

    const handleRegister = async (e: React.FormEvent) => {
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
            const user = await register(formData);
            setSuccess(true);
            console.log('회원가입 성공:', user);
            
            // 2초 후 로그인 페이지로 이동 (실제로는 라우터 사용)
            setTimeout(() => {
                alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                // 실제로는 navigate('/login') 사용
            }, 2000);
        } catch (err: any) {
            console.error('회원가입 실패:', err);
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('회원가입 중 오류가 발생했습니다.');
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
        backgroundColor: isLoading ? '#ccc' : '#007bff',
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

    const successStyle: React.CSSProperties = {
        color: '#155724',
        fontSize: '0.875rem',
        marginTop: '0.5rem',
        padding: '0.5rem',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
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
                회원가입
            </h1>
            
            {success ? (
                <div style={successStyle}>
                    회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...
                </div>
            ) : (
                <form onSubmit={handleRegister}>
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
                            placeholder="3자 이상 입력하세요"
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
                            placeholder="6자 이상 입력하세요"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label htmlFor="confirmPassword" style={labelStyle}>
                            비밀번호 확인:
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (error) setError(null);
                            }}
                            style={inputStyle}
                            placeholder="비밀번호를 다시 입력하세요"
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
                        {isLoading ? '회원가입 중...' : '회원가입'}
                    </button>
                </form>
            )}

            <div style={linkStyle}>
                이미 계정이 있으신가요? 
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
                        // 실제로는 navigate('/login') 사용
                        alert('로그인 페이지로 이동');
                    }}
                >
                    로그인
                </button>
            </div>
        </div>
    );
};

export default RegisterPage;