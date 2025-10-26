// components/InertiaLoading.jsx
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import LoadingPage from './LoadingPage';

export default function InertiaLoading() {
  const { component } = usePage();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const originalFetch = window.fetch;
    
    // Intercept fetch requests
    window.fetch = async (...args) => {
      setLoading(true);
      setProgress(30);
      try {
        const response = await originalFetch(...args);
        setProgress(100);
        setTimeout(() => setLoading(false), 300);
        return response;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Show loading during Inertia visits
  useEffect(() => {
    const handleStart = () => {
      setLoading(true);
      setProgress(20);
    };

    const handleProgress = (event) => {
      if (event.detail.progress.percentage) {
        setProgress(event.detail.progress.percentage);
      }
    };

    const handleFinish = () => {
      setProgress(100);
      setTimeout(() => setLoading(false), 500);
    };

    // Listen to Inertia events
    window.addEventListener('inertia:start', handleStart);
    window.addEventListener('inertia:progress', handleProgress);
    window.addEventListener('inertia:finish', handleFinish);

    return () => {
      window.removeEventListener('inertia:start', handleStart);
      window.removeEventListener('inertia:progress', handleProgress);
      window.removeEventListener('inertia:finish', handleFinish);
    };
  }, []);

  if (!loading) return null;

  return (
    <LoadingPage 
      type="spinner"
      text="Processing..."
      subtext="Please wait while we complete your request"
      fullscreen={true}
    />
  );
}