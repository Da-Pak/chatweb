import { useState } from 'react';
import { chatApi } from '../api/chatApi';
import { useToast } from './useToast';

export const useMessageEdit = () => {
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showCopyToast } = useToast();

  const handleStartEdit = (messageIndex: number) => {
    setEditingMessageIndex(messageIndex);
  };

  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
  };

  const handleEditMessage = async (
    threadId: string | undefined,
    messageIndex: number,
    newContent: string,
    onSuccess?: (updatedThread: any) => void
  ): Promise<boolean> => {
    if (!threadId) {
      showCopyToast('스레드가 선택되지 않았습니다');
      return false;
    }

    try {
      setIsLoading(true);
      
      // 백엔드 API 호출
      const response = await chatApi.editThreadMessage(threadId, messageIndex, newContent);
      
      if (response.data) {
        // 백엔드에서 TrainingThread 객체를 직접 반환
        const updatedThread = response.data as any; // TrainingThread
        
        if (onSuccess) {
          onSuccess(updatedThread);
        }
        
        setEditingMessageIndex(null);
        showCopyToast('메시지가 수정되고 새로운 응답이 생성되었습니다');
        return true;
      } else {
        console.error('메시지 수정 실패:', response.error);
        showCopyToast('메시지 수정에 실패했습니다');
        return false;
      }
    } catch (error) {
      console.error('메시지 수정 오류:', error);
      showCopyToast('메시지 수정 중 오류가 발생했습니다');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    editingMessageIndex,
    isLoading,
    handleStartEdit,
    handleCancelEdit,
    handleEditMessage
  };
}; 