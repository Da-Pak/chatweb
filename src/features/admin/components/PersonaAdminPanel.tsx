import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminApi } from '../api/adminApi';

interface PersonaAdminPanelProps {
  onClose: () => void;
}

const AdminContainer = styled.div`
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  background: #f8f9fa;
`;

const AdminHeader = styled.div`
  margin-bottom: 24px;
  text-align: center;
`;

const AdminTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
`;

const AdminSubtitle = styled.p`
  font-size: 14px;
  color: #666;
`;

const InfoCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const InfoTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const InfoItem = styled.div`
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  margin: 4px;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
          color: white;
          &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4); }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          color: white;
          &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4); }
        `;
      default:
        return `
          background: #f5f5f5;
          color: #666;
          &:hover { background: #e8e8e8; }
        `;
    }
  }}
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: inline-block;
  padding: 12px 20px;
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.4);
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  border-radius: 8px;
  margin: 12px 0;
  font-size: 14px;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `background: #d4edda; color: #155724; border: 1px solid #c3e6cb;`;
      case 'error':
        return `background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;`;
      default:
        return `background: #cce7ff; color: #004085; border: 1px solid #99d5ff;`;
    }
  }}
`;

const PersonaAdminPanel: React.FC<PersonaAdminPanelProps> = ({ onClose }) => {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadInfo = async () => {
    setLoading(true);
    const response = await adminApi.getPersonaInfo();
    if (response.data) {
      setInfo(response.data);
    } else {
      setMessage({ text: response.error || '정보 로딩 실패', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleReload = async () => {
    setLoading(true);
    setMessage({ text: '페르소나를 재로딩 중입니다...', type: 'info' });
    
    const response = await adminApi.reloadPersonas();
    if (response.data) {
      setMessage({ text: '페르소나가 성공적으로 재로딩되었습니다!', type: 'success' });
      await loadInfo();
    } else {
      setMessage({ text: response.error || '재로딩 실패', type: 'error' });
    }
    setLoading(false);
  };

  const handleDownload = () => {
    const url = adminApi.getDownloadUrl();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'personas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ text: 'CSV 파일만 업로드할 수 있습니다.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: 'CSV 파일을 업로드하고 페르소나를 재로딩 중입니다...', type: 'info' });

    const response = await adminApi.uploadPersonasCSV(file);
    if (response.data) {
      setMessage({ 
        text: `업로드 완료! ${response.data.uploaded_personas}개의 페르소나가 로딩되었습니다.`, 
        type: 'success' 
      });
      await loadInfo();
    } else {
      setMessage({ text: response.error || '업로드 실패', type: 'error' });
    }
    setLoading(false);
    
    // 파일 입력 초기화
    event.target.value = '';
  };

  return (
    <AdminContainer>
      <AdminHeader>
        <AdminTitle>🛠️ 페르소나 관리 도구</AdminTitle>
        <AdminSubtitle>CSV 파일을 통해 페르소나를 관리할 수 있습니다</AdminSubtitle>
      </AdminHeader>

      {message && (
        <StatusMessage type={message.type}>
          {message.text}
        </StatusMessage>
      )}

      {info && (
        <InfoCard>
          <InfoTitle>📊 현재 상태</InfoTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>전체 페르소나</InfoLabel>
              <InfoValue>{info.total_personas}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>활성 페르소나</InfoLabel>
              <InfoValue>{info.active_personas}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>비활성 페르소나</InfoLabel>
              <InfoValue>{info.inactive_personas}</InfoValue>
            </InfoItem>
          </InfoGrid>
          
          {info.categories && (
            <>
              <InfoLabel style={{ marginTop: '12px', marginBottom: '8px' }}>카테고리별 분포</InfoLabel>
              <InfoGrid>
                {Object.entries(info.categories).map(([category, count]) => (
                  <InfoItem key={category}>
                    <InfoLabel>{category}</InfoLabel>
                    <InfoValue>{String(count)}</InfoValue>
                  </InfoItem>
                ))}
              </InfoGrid>
            </>
          )}
        </InfoCard>
      )}

      <InfoCard>
        <InfoTitle>🔧 관리 작업</InfoTitle>
        
        <div style={{ marginBottom: '16px' }}>
          <ActionButton variant="secondary" onClick={handleDownload}>
            📥 CSV 다운로드
          </ActionButton>
          
          <FileInputLabel htmlFor="csvUpload">
            📤 CSV 업로드
          </FileInputLabel>
          <FileInput 
            id="csvUpload" 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
          />
          
          <ActionButton variant="primary" onClick={handleReload} disabled={loading}>
            🔄 재로딩
          </ActionButton>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '8px',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          <strong>💡 사용 방법:</strong><br />
          1. CSV 다운로드 → Excel에서 편집 → CSV로 저장 → 업로드<br />
          2. 또는 서버의 <code>data/personas.csv</code> 직접 수정 → 재로딩
        </div>
      </InfoCard>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <ActionButton variant="secondary" onClick={onClose}>
          ← 돌아가기
        </ActionButton>
      </div>
    </AdminContainer>
  );
};

export default PersonaAdminPanel; 