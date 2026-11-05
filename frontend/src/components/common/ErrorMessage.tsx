import { AlertCircle } from "lucide-react";

export default function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-3xl border border-red-200 bg-red-50/90 p-5 sm:flex-row sm:items-center sm:justify-between card-3d"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={21} className="mt-0.5 shrink-0 text-red-600" />
        <div>
          <p className="font-bold text-red-900 text-sm">
            Something went wrong
          </p>
          <p className="mt-1 text-xs text-red-700 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition shadow-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}
