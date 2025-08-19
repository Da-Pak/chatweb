import { chatApi } from '../api/chatApi';
import { useToast } from './useToast';

export type ThreadActionType = 'interpretation' | 'proceed' | 'sentence';

export const useThreadActions = (personaId: string, onRefreshThreads?: () => void) => {
  const { showCopyToast } = useToast();

  const saveToThread = async (
    actionType: ThreadActionType, 
    messageContent: string
  ): Promise<boolean> => {
    if (!personaId) {
      showCopyToast('페르소나 ID를 찾을 수 없습니다');
      return false;
    }

    if (!messageContent) {
      showCopyToast('저장할 메시지 내용이 없습니다');
      return false;
    }

    try {
      let response;
      let successMessage;

      switch (actionType) {
        case 'interpretation':
          response = await chatApi.saveCurrentAsInterpretation(personaId, messageContent);
          successMessage = '메시지가 해석 스레드에 저장되었습니다';
          break;
        case 'proceed':
          response = await chatApi.saveCurrentAsProceed(personaId, messageContent);
          successMessage = '메시지가 나아가기 스레드에 저장되었습니다';
          break;
        case 'sentence':
          response = await chatApi.saveCurrentAsSentence(personaId, messageContent);
          successMessage = '메시지가 문장 스레드에 저장되었습니다';
          break;
        default:
          throw new Error(`알 수 없는 액션 타입: ${actionType}`);
      }

      if (response.data) {
        // 스레드 새로고침
        if (onRefreshThreads) {
          onRefreshThreads();
        }
        showCopyToast(successMessage);
        return true;
      } else {
        showCopyToast(`${actionType} 저장에 실패했습니다`);
        return false;
      }
    } catch (error) {
      console.error(`${actionType} 저장 중 오류:`, error);
      showCopyToast(`${actionType} 저장에 실패했습니다`);
      return false;
    }
  };

  const handleSunAction = async (messageContent: string) => {
    return saveToThread('interpretation', messageContent);
  };

  const handlePersonAction = async (messageContent: string) => {
    return saveToThread('proceed', messageContent);
  };

  const handleDocumentAction = async (messageContent: string) => {
    return saveToThread('sentence', messageContent);
  };

  return {
    saveToThread,
    handleSunAction,
    handlePersonAction,
    handleDocumentAction
  };
}; 