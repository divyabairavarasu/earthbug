import { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import CameraView from './components/CameraView';
import AnalyzingView from './components/AnalyzingView';
import ResultsView from './components/ResultsView';
import Footer from './components/Footer';
import { useCamera } from './hooks/useCamera';
import { identifyBug, createBugChat } from './utils/gemini';

const VIEWS = {
  CAMERA: 'camera',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
};

const SCAN_HISTORY_STORAGE_KEY = 'earthbug_scan_history';

// Demo result — shown when ?demo=true is in the URL, no API key needed
const DEMO_RESULT = {
  name: 'Seven-Spot Ladybug',
  scientificName: 'Coccinella septempunctata',
  verdict: 'Mostly Helpful',
  confidence: 'high',
  summary: 'A beloved garden guardian that feasts on aphids and shields your plants from infestations.',
  benefits: [
    {
      title: 'Natural Pest Control',
      description:
        'A single ladybug can consume up to 5,000 aphids in its lifetime. This dramatically reduces the need for chemical pesticides, protecting your soil microbiome and local waterways.',
    },
    {
      title: 'Pollination Assistance',
      description:
        'While feeding on pollen as larvae, ladybugs inadvertently transfer pollen between flowers, contributing to plant reproduction across your garden.',
    },
  ],
  harms: [],
  ecosystemRole:
    'Ladybugs sit at a critical junction in the garden food web — voracious predators of soft-bodied insects like aphids and scale insects, while themselves serving as prey for birds and spiders. Their bright warning coloration (aposematism) deters most would-be predators.',
  didYouKnow:
    "The spots on a ladybug don't indicate its age — they're there to warn predators that it tastes awful! When threatened, ladybugs can secrete a foul-smelling fluid from their leg joints.",
  soilImpact: 'positive',
  plantImpact: 'positive',
  nuance:
    'Non-native ladybug species can outcompete native populations for food, so encouraging your local native species is best.',
  ecoActions: [
    "Don't spray pesticides — this ladybug naturally controls aphids without chemical runoff",
    'Plant native flowers like marigolds and fennel to attract and feed ladybug populations',
    'Report your sighting to iNaturalist to help scientists track biodiversity changes',
    'Avoid removing leaf litter where ladybugs overwinter in your garden',
  ],
};

const DEMO_IMAGE_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Coccinella_septempunctata_closeup.jpg/640px-Coccinella_septempunctata_closeup.jpg';

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
    // Never write image data (base64 data URLs) to localStorage — keep it in-memory only
    const safeHistory = history.map(({ imageUrl: _imageUrl, ...item }) => item);
    window.localStorage.setItem(SCAN_HISTORY_STORAGE_KEY, JSON.stringify(safeHistory));
  } catch {
    // Silently ignore if localStorage is full
  }
}

function getVerdictEmoji(verdict) {
  if (verdict === 'Mostly Helpful' || verdict === 'Garden Buddy') return '🌱';
  if (verdict === 'Mostly Harmful' || verdict === 'Garden Bully') return '⚠️';
  return '🤷';
}

export default function App() {
  const [view, setView] = useState(VIEWS.CAMERA);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [chatSession, setChatSession] = useState(null);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState(() => readStoredScanHistory());
  const analysisCancelledRef = useRef(false);
  const isAnalyzingRef = useRef(false);
  const cameraHook = useCamera();

  // Demo mode: ?demo=true loads a pre-seeded result without any API call
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setCapturedImage(DEMO_IMAGE_URL);
      setResult(DEMO_RESULT);
      setView(VIEWS.RESULTS);
    }
  }, []);

  useEffect(() => {
    storeScanHistory(scanHistory);
  }, [scanHistory]);

  const cancelAnalysis = useCallback(() => {
    analysisCancelledRef.current = true;
    isAnalyzingRef.current = false;
    setCapturedImage(null);
    setView(VIEWS.CAMERA);
  }, []);

  const analyzeImage = useCallback(async (photo) => {
    // In-flight guard — ignore duplicate submissions while analysis is running
    if (isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    analysisCancelledRef.current = false;
    setCapturedImage(photo.dataUrl);
    setChatSession(null);
    setView(VIEWS.ANALYZING);
    setError(null);

    try {
      const analysis = await identifyBug(photo.base64, photo.mimeType);

      if (analysisCancelledRef.current) return;

      setResult(analysis);

      // Spin up a multi-turn chat session so the user can ask follow-up questions
      if (!analysis.error) {
        setScanHistory(prev => {
          const deduped = prev.filter(item => item.name !== analysis.name);
          return [
            { ...analysis, imageUrl: photo.dataUrl, timestamp: Date.now() },
            ...deduped,
          ].slice(0, 10);
        });

        try {
          const chat = createBugChat(analysis);
          setChatSession(chat);
        } catch {
          // Follow-up chat is a bonus feature — don't fail the whole flow
        }
      }

      setView(VIEWS.RESULTS);
    } catch (err) {
      if (analysisCancelledRef.current) return;
      console.error('Analysis failed:', err);
      setError(err.message);
      setView(VIEWS.CAMERA);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, []);

  const handleScanAnother = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setChatSession(null);
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

        {view === VIEWS.CAMERA && (
          <CameraView
            cameraHook={cameraHook}
            onCapture={analyzeImage}
            onFileUpload={analyzeImage}
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
            chatSession={chatSession}
          />
        )}

        {/* Scan history */}
        {scanHistory.length > 0 && view === VIEWS.CAMERA && (
          <div className="mt-8 max-w-lg mx-auto">
            <h3 className="font-display text-lg font-semibold text-earth-700 mb-3">
              Recent Scans
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {scanHistory.map((scan) => (
                <button
                  key={scan.timestamp}
                  onClick={() => {
                    setCapturedImage(scan.imageUrl);
                    setResult(scan);
                    setChatSession(null);
                    setView(VIEWS.RESULTS);
                  }}
                  className="group relative aspect-square rounded-xl overflow-hidden border-2 border-earth-100
                             hover:border-leaf-400 transition-colors"
                >
                  {scan.imageUrl ? (
                    <img
                      src={scan.imageUrl}
                      alt={scan.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-earth-100 text-2xl">
                      {getVerdictEmoji(scan.verdict)}
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-white text-xs font-medium truncate">{scan.name}</p>
                  </div>
                  <div className="absolute top-1.5 right-1.5 text-sm">
                    {getVerdictEmoji(scan.verdict)}
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
