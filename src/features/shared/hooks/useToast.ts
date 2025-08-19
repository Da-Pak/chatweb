import { useState } from 'react';

export const useToast = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showCopyToast = (message: string, duration: number = 2000) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, duration);
  };

  return {
    showToast,
    toastMessage,
    showCopyToast
  };
}; 