export default function ResultsView({ result, imageUrl, onScanAnother }) {
  if (result.error) {
    return (
      <div className="card max-w-lg mx-auto text-center">
        <div className="text-4xl mb-3">🤔</div>
        <p className="text-earth-700 mb-4">{result.message}</p>
        <button onClick={onScanAnother} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const verdictConfig = {
    'Garden Buddy': { emoji: '🌱', color: 'bg-leaf-100 text-leaf-800 border-leaf-200', accent: 'text-leaf-700' },
    'Garden Bully': { emoji: '⚠️', color: 'bg-red-50 text-red-800 border-red-200', accent: 'text-red-700' },
    "It's Complicated": { emoji: '🤷', color: 'bg-amber-50 text-amber-800 border-amber-200', accent: 'text-amber-700' },
  };

  const verdict = verdictConfig[result.verdict] || verdictConfig["It's Complicated"];

  const impactIcon = (impact) => {
    if (impact === 'positive') return '✅';
    if (impact === 'negative') return '❌';
    return '➖';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Hero card with image and verdict */}
      <div className="card overflow-hidden p-0">
        <div className="relative">
          <img
            src={imageUrl}
            alt={result.name}
            className="w-full aspect-[16/9] object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-16">
            <h2 className="font-display text-3xl font-bold text-white mb-1">
              {result.name}
            </h2>
            <p className="text-white/70 italic text-sm">{result.scientificName}</p>
          </div>
          {result.confidence && (
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              {result.confidence} confidence
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Verdict badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${verdict.color} font-semibold text-lg mb-4`}>
            <span className="text-xl">{verdict.emoji}</span>
            {result.verdict}
          </div>

          <p className="text-earth-600 leading-relaxed">{result.summary}</p>

          {/* Quick impact indicators */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-earth-100">
            <div className="flex items-center gap-2 text-sm text-earth-600">
              <span>{impactIcon(result.soilImpact)}</span>
              <span>Soil: <span className="font-medium capitalize">{result.soilImpact}</span></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-earth-600">
              <span>{impactIcon(result.plantImpact)}</span>
              <span>Plants: <span className="font-medium capitalize">{result.plantImpact}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      {result.benefits && result.benefits.length > 0 && (
        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-leaf-700 mb-4">
            <span>🌿</span> How It Helps
          </h3>
          <div className="space-y-3">
            {result.benefits.map((b, i) => (
              <div key={i} className="pl-4 border-l-2 border-leaf-300">
                <p className="font-medium text-earth-800">{b.title}</p>
                <p className="text-earth-500 text-sm mt-0.5 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Harms */}
      {result.harms && result.harms.length > 0 && (
        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-red-700 mb-4">
            <span>🚨</span> Potential Harms
          </h3>
          <div className="space-y-3">
            {result.harms.map((h, i) => (
              <div key={i} className="pl-4 border-l-2 border-red-200">
                <p className="font-medium text-earth-800">{h.title}</p>
                <p className="text-earth-500 text-sm mt-0.5 leading-relaxed">{h.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ecosystem role */}
      {result.ecosystemRole && (
        <div className="card bg-soil-50 border-soil-200">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-soil-700 mb-2">
            <span>🌍</span> Ecosystem Role
          </h3>
          <p className="text-earth-600 leading-relaxed">{result.ecosystemRole}</p>
        </div>
      )}

      {/* Did you know */}
      {result.didYouKnow && (
        <div className="card bg-leaf-50 border-leaf-200">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-leaf-700 mb-2">
            <span>💡</span> Did You Know?
          </h3>
          <p className="text-earth-600 leading-relaxed">{result.didYouKnow}</p>
        </div>
      )}

      {/* Scan another */}
      <div className="text-center pt-2 pb-8">
        <button onClick={onScanAnother} className="btn-primary">
          🐛 Scan Another Bug
        </button>
      </div>
    </div>
  );
}
