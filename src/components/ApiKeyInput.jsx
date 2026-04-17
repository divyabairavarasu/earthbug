import { useState } from 'react';

export default function ApiKeyInput({ onSubmit }) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) {
      onSubmit(key.trim());
    }
  };

  return (
    <div className="card max-w-md mx-auto text-center">
      <div className="text-3xl mb-3">🔑</div>
      <h2 className="font-display text-xl font-semibold text-earth-800 mb-2">
        Connect to Google Gemini
      </h2>
      <p className="text-earth-500 text-sm mb-5">
        Enter your Gemini API key to start identifying bugs.
        Your key stays in your browser — it's never sent to our servers.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIza..."
            className="w-full px-4 py-3 rounded-xl border border-earth-200 bg-earth-50
                       focus:outline-none focus:ring-2 focus:ring-leaf-400 focus:border-transparent
                       text-earth-800 placeholder-earth-300 pr-16"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 text-sm"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          type="submit"
          disabled={!key.trim()}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Connect & Start
        </button>
      </form>
      <a
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 text-sm text-leaf-600 hover:text-leaf-700 underline underline-offset-2"
      >
        Get a free Gemini API key →
      </a>
    </div>
  );
}
