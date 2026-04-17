import { useState, useRef, useCallback, useEffect } from 'react';
import { prepareImageForAnalysis } from '../utils/imageUtils';

const DEFAULT_FACING_MODE = 'environment';
const IDEAL_VIDEO_WIDTH = 1280;
const IDEAL_VIDEO_HEIGHT = 960;
const PREVIEW_IMAGE_MIME_TYPE = 'image/jpeg';
const PREVIEW_IMAGE_QUALITY = 0.95;

function stopStreamTracks(activeStream) {
  if (!activeStream) {
    return;
  }

  activeStream.getTracks().forEach((track) => track.stop());
}

export function useCamera() {
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState(DEFAULT_FACING_MODE);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) {
      return undefined;
    }

    videoRef.current.srcObject = stream;

    return () => {
      if (videoRef.current?.srcObject === stream) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  const startCamera = useCallback(async (mode = facingMode) => {
    try {
      setError(null);
      stopStreamTracks(stream);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: IDEAL_VIDEO_WIDTH },
          height: { ideal: IDEAL_VIDEO_HEIGHT },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsActive(true);
      setFacingMode(mode);
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
    stopStreamTracks(stream);
    setStream(null);
    setIsActive(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setError('Camera is still starting. Please wait a moment and try again.');
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL(PREVIEW_IMAGE_MIME_TYPE, PREVIEW_IMAGE_QUALITY);
    const analysisImage = await prepareImageForAnalysis({
      dataUrl,
      mimeType: PREVIEW_IMAGE_MIME_TYPE,
    });

    return {
      dataUrl,
      base64: analysisImage.base64,
      mimeType: analysisImage.mimeType,
    };
  }, [setError]);

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
