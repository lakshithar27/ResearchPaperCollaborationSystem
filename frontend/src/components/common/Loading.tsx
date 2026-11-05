export default function Loading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      <p className="text-xs font-semibold text-slate-500">{message}</p>
    </div>
  );
}
