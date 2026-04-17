export default function Header() {
  return (
    <header className="text-center py-8 px-4">
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-4xl">🐛</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-earth-900 tracking-tight">
          Earth<span className="text-leaf-600">Bug</span>
        </h1>
      </div>
      <p className="text-earth-500 text-lg font-light italic">
        helps build the soil
      </p>
      <p className="text-earth-400 text-sm mt-3 max-w-md mx-auto">
        Snap a bug. Discover its secret life in your garden's ecosystem.
      </p>
    </header>
  );
}
