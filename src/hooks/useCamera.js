import { useState, useRef, useCallback } from 'react';

export function useCamera() {
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);

  const startCamera = useCallback(async (mode = facingMode) => {
    try {
      setError(null);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsActive(true);
      setFacingMode(mode);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please try again.');
      }
      setIsActive(false);
    }
  }, [stream, facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Return both the data URL (for display) and base64 (for API)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];

    return { dataUrl, base64, mimeType: 'image/jpeg' };
  }, []);

  const flipCamera = useCallback(() => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(newMode);
  }, [facingMode, startCamera]);

  return {
    videoRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    flipCamera,
    facingMode,
  };
}
