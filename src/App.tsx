import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import QAPage from './features/qa/components/QAPage';
import MainLayout from './features/core/MainLayout';
import './App.css';

// 인증 상태 확인 함수
const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// QA 완료 상태 확인 함수
const hasCompletedQA = () => {
  // 기존 QA 시스템의 완료 상태 확인 로직 (향후 백엔드 API로 대체)
  return localStorage.getItem('qa_completed') === 'true';
};

// 보호된 라우트 컴포넌트
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/" replace />;
};

// QA 완료 후에만 접근 가능한 라우트
const QAProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  if (!hasCompletedQA()) {
    return <Navigate to="/qa" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/qa" 
            element={
              <ProtectedRoute>
                <QAPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/training/*" 
            element={
              <QAProtectedRoute>
                <MainLayout />
              </QAProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 