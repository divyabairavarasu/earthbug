import { useEffect, useRef, useState, useCallback } from 'react';
import { prepareImageForAnalysis, readFileAsDataUrl } from '../utils/imageUtils';

export default function CameraView({ cameraHook, onCapture, onFileUpload, onChangeApiKey }) {
  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto, flipCamera } = cameraHook;
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (!uploadError) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setUploadError(null);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [uploadError]);

  const handleCapture = async () => {
    const photo = await capturePhoto();

    if (photo) {
      stopCamera();
      onCapture(photo);
    }
  };

  const handleSelectedFile = useCallback(async (file, invalidFileMessage) => {
    if (!file.type.startsWith('image/')) {
      setUploadError(invalidFileMessage);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const originalDataUrl = await readFileAsDataUrl(file);
      const analysisImage = await prepareImageForAnalysis({
        dataUrl: originalDataUrl,
        mimeType: file.type || 'image/jpeg',
      });

      onFileUpload({
        dataUrl: originalDataUrl,
        base64: analysisImage.base64,
        mimeType: analysisImage.mimeType,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (imageError) {
      console.error('Image processing failed:', imageError);
      setUploadError('Could not read that image. Please try another one.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onFileUpload]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    void handleSelectedFile(file, 'Please choose an image file');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    void handleSelectedFile(file, 'Please drop an image file');
  };

  return (
    <div className="card max-w-lg mx-auto">
      {!isActive ? (
        <div className="text-center space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-12 flex flex-col items-center gap-4 transition-colors ${
              isDragActive ? 'border-leaf-400 bg-leaf-50' : 'border-transparent bg-earth-100'
            }`}
          >
            <div className="text-6xl">📸</div>
            <p className="text-earth-600 font-medium">
              Found a bug? Let's identify it!
            </p>
            <p className="text-sm text-earth-500">
              Or drag and drop a bug photo here.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => startCamera()} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Photo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={onChangeApiKey}
            className="text-sm text-earth-500 hover:text-earth-700 underline underline-offset-2"
          >
            Change API key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Viewfinder */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Camera viewfinder"
              className="w-full h-full object-cover"
            />
            {/* Scan line overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="scan-line absolute left-4 right-4 h-0.5 bg-leaf-400 opacity-50 rounded-full" />
            </div>
            {/* Corner brackets */}
            <div className="absolute inset-0 pointer-events-none p-6">
              <div className="w-full h-full border-2 border-white/20 rounded-lg" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={stopCamera}
              aria-label="Stop camera"
              className="p-3 rounded-full bg-earth-200 hover:bg-earth-300 transition-colors"
              title="Cancel"
            >
              <svg className="w-6 h-6 text-earth-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={handleCapture}
              aria-label="Take photo"
              className="w-16 h-16 rounded-full bg-leaf-600 hover:bg-leaf-700 transition-all
                         shadow-lg hover:shadow-xl active:scale-90 flex items-center justify-center
                         ring-4 ring-leaf-200"
              title="Take photo"
            >
              <div className="w-12 h-12 rounded-full bg-white/90" />
            </button>

            <button
              onClick={flipCamera}
              aria-label="Flip camera"
              className="p-3 rounded-full bg-earth-200 hover:bg-earth-300 transition-colors"
              title="Flip camera"
            >
              <svg className="w-6 h-6 text-earth-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {uploadError && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm text-center">
          {uploadError}
        </div>
      )}
    </div>
  );
}
