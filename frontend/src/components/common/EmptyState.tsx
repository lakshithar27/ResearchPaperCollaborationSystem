import { SearchX } from "lucide-react";

export default function EmptyState({
  title = "Nothing found",
  description = "There are no records to display right now.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center card-3d">
      <div className="mb-4 rounded-2xl bg-slate-100 p-4 shadow-inner">
        <SearchX size={26} className="text-slate-500" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs text-slate-500">{description}</p>
    </div>
  );
}
