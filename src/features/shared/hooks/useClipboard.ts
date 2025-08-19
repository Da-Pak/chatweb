import { copyToClipboard } from '../utils/clipboard';
import { useToast } from './useToast';

export const useClipboard = () => {
  const { showCopyToast } = useToast();

  const copyTextToClipboard = async (text: string, successMessage: string = '복사되었습니다') => {
    const success = await copyToClipboard(text);
    
    if (success) {
      showCopyToast(successMessage);
    } else {
      showCopyToast('복사에 실패했습니다');
    }
    
    return success;
  };

  const handleCopyMessage = async (messageContent: string) => {
    return copyTextToClipboard(messageContent, '메시지가 복사되었습니다');
  };

  return {
    copyTextToClipboard,
    handleCopyMessage
  };
}; 