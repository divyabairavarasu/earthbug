export default function AnalyzingView({ imageUrl }) {
  return (
    <div className="card max-w-lg mx-auto text-center">
      <div className="mb-6">
        <img
          src={imageUrl}
          alt="Captured bug"
          className="w-full aspect-[4/3] object-cover rounded-xl"
        />
      </div>
      <div className="gentle-pulse space-y-3">
        <div className="text-4xl">🔬</div>
        <p className="font-display text-xl text-earth-700">Analyzing your bug...</p>
        <p className="text-earth-400 text-sm">
          Consulting our entomology database
        </p>
      </div>
      <div className="mt-6 flex justify-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-leaf-400"
            style={{
              animation: 'gentle-pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
