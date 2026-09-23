import { Loader2, AlertCircle, SearchX } from 'lucide-react';

export function LoadingState({ message = 'Loading movies...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-lg animate-pulse">{message}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-red-400">
      <AlertCircle className="w-12 h-12 mb-4" />
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="mb-6">{error || 'Unable to fetch data.'}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No results found', message = 'Try adjusting your filters or search query.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <SearchX className="w-12 h-12 mb-4 opacity-50" />
      <h2 className="text-xl font-bold text-slate-200 mb-2">{title}</h2>
      <p>{message}</p>
    </div>
  );
}
