export default function Footer() {
  return (
    <footer className="text-center py-8 px-4 border-t border-earth-100 mt-12">
      <p className="text-earth-400 text-sm">
        Built with 🌍 for{' '}
        <a
          href="https://dev.to/challenges/weekend-2026-04-16"
          target="_blank"
          rel="noopener noreferrer"
          className="text-leaf-600 hover:text-leaf-700 underline underline-offset-2"
        >
          DEV Weekend Challenge: Earth Day Edition
        </a>
      </p>
      <p className="text-earth-300 text-xs mt-2">
        Powered by Google Gemini · Every bug matters · 🐛 EarthBug
      </p>
      <p className="text-earth-300 text-xs mt-1">
        Helping gardeners protect pollinators, one scan at a time
      </p>
    </footer>
  );
}
