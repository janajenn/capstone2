// hooks/useFormLoading.js
import { useState } from 'react';
import { useLoading } from '@/contexts/LoadingContext';

export const useFormLoading = (defaultText = 'Processing...') => {
  const { showLoading, hideLoading } = useLoading();
  const [isProcessing, setIsProcessing] = useState(false);

  const startProcessing = (text = defaultText) => {
    setIsProcessing(true);
    showLoading(text);
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    hideLoading();
  };

  return {
    isProcessing,
    startProcessing,
    stopProcessing
  };
};