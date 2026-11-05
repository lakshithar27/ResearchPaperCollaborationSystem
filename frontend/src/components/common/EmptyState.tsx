import { SearchX } from "lucide-react";

export default function EmptyState({
  title = "Nothing found",
  description = "There are no records to display right now.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4">
        <SearchX size={28} className="text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
