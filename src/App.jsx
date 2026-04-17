import { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import ApiKeyInput from './components/ApiKeyInput';
import CameraView from './components/CameraView';
import AnalyzingView from './components/AnalyzingView';
import ResultsView from './components/ResultsView';
import Footer from './components/Footer';
import { useCamera } from './hooks/useCamera';
import { initGemini, identifyBug } from './utils/gemini';

const VIEWS = {
  API_KEY: 'api_key',
  CAMERA: 'camera',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
};

const API_KEY_STORAGE_KEY = 'earthbug_api_key';
const SCAN_HISTORY_STORAGE_KEY = 'earthbug_scan_history';

function readStoredApiKey() {
  return window.localStorage.getItem(API_KEY_STORAGE_KEY)?.trim() ?? '';
}

function storeApiKey(apiKey) {
  window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

function clearStoredApiKey() {
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
}

function readStoredScanHistory() {
  try {
    const stored = window.localStorage.getItem(SCAN_HISTORY_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function storeScanHistory(history) {
  try {
    window.localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently ignore if localStorage is full
  }
}

export default function App() {
  const [view, setView] = useState(VIEWS.API_KEY);
  const [apiKey, setApiKey] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState(() => readStoredScanHistory());
  const analysisCancelledRef = useRef(false);
  const cameraHook = useCamera();

  useEffect(() => {
    storeScanHistory(scanHistory);
  }, [scanHistory]);

  useEffect(() => {
    try {
      const storedApiKey = readStoredApiKey();

      if (!storedApiKey) {
        return;
      }

      initGemini(storedApiKey);
      setApiKey(storedApiKey);
      setView(VIEWS.CAMERA);
    } catch (storageError) {
      console.error('Could not read saved Gemini API key:', storageError);
      setError('Could not access saved API key storage in this browser.');
    }
  }, []);

  const handleApiKey = useCallback((key) => {
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      return;
    }

    try {
      storeApiKey(trimmedKey);
    } catch (storageError) {
      console.error('Could not save Gemini API key:', storageError);
      setError('Could not save your API key in this browser.');
      return;
    }

    setApiKey(trimmedKey);
    setView(VIEWS.CAMERA);
    setError(null);
    initGemini(trimmedKey);
  }, []);

  const handleChangeApiKey = useCallback(() => {
    try {
      clearStoredApiKey();
    } catch (storageError) {
      console.error('Could not clear saved Gemini API key:', storageError);
      setError('Could not clear your saved API key in this browser.');
      return;
    }

    cameraHook.stopCamera();
    setApiKey('');
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setView(VIEWS.API_KEY);
  }, [cameraHook]);

  const cancelAnalysis = useCallback(() => {
    analysisCancelledRef.current = true;
    setCapturedImage(null);
    setView(VIEWS.CAMERA);
  }, []);

  const analyzeImage = useCallback(async (photo) => {
    analysisCancelledRef.current = false;
    setCapturedImage(photo.dataUrl);
    setView(VIEWS.ANALYZING);
    setError(null);

    try {
      const analysis = await identifyBug(photo.base64, photo.mimeType);

      if (analysisCancelledRef.current) return;

      setResult(analysis);

      if (!analysis.error) {
        setScanHistory(prev => {
          const deduped = prev.filter(item => item.name !== analysis.name);
          return [
            { ...analysis, imageUrl: photo.dataUrl, timestamp: Date.now() },
            ...deduped,
          ].slice(0, 10);
        });
      }

      setView(VIEWS.RESULTS);
    } catch (err) {
      if (analysisCancelledRef.current) return;
      console.error('Analysis failed:', err);
      setError(err.message);
      setView(VIEWS.CAMERA);
    }
  }, []);

  const handleScanAnother = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setView(VIEWS.CAMERA);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 px-4 pb-8 max-w-4xl mx-auto w-full">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm text-center max-w-lg mx-auto">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {view === VIEWS.API_KEY && (
          <ApiKeyInput
            initialKey={apiKey}
            onSubmit={handleApiKey}
          />
        )}

        {view === VIEWS.CAMERA && (
          <CameraView
            cameraHook={cameraHook}
            onCapture={analyzeImage}
            onFileUpload={analyzeImage}
            onChangeApiKey={handleChangeApiKey}
          />
        )}

        {view === VIEWS.ANALYZING && (
          <AnalyzingView imageUrl={capturedImage} onCancel={cancelAnalysis} />
        )}

        {view === VIEWS.RESULTS && result && (
          <ResultsView
            result={result}
            imageUrl={capturedImage}
            onScanAnother={handleScanAnother}
          />
        )}

        {/* Scan history */}
        {scanHistory.length > 0 && view === VIEWS.CAMERA && (
          <div className="mt-8 max-w-lg mx-auto">
            <h3 className="font-display text-lg font-semibold text-earth-700 mb-3">
              Recent Scans
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {scanHistory.map((scan, i) => (
                <button
                  key={scan.timestamp}
                  onClick={() => {
                    setCapturedImage(scan.imageUrl);
                    setResult(scan);
                    setView(VIEWS.RESULTS);
                  }}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-earth-100
                             hover:border-leaf-400 transition-colors"
                >
                  <img
                    src={scan.imageUrl}
                    alt={scan.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-white text-xs font-medium truncate">{scan.name}</p>
                  </div>
                  <div className="absolute top-1.5 right-1.5 text-sm">
                    {scan.verdict === 'Garden Buddy' ? '🌱' : scan.verdict === 'Garden Bully' ? '⚠️' : '🤷'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
