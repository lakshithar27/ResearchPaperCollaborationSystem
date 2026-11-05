export default function Loading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
