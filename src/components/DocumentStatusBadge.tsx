import { UploadedDocument } from "@/types/document";

type DocumentStatusBadgeProps = {
    status: UploadedDocument["status"];
}

export default function DocumentStatusBadge({
   status,
}: DocumentStatusBadgeProps) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);

    const styles = status === "ready" 
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : status === "failed"
    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
    : "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200";

    return (
        <span
             className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
             >
                {status === "processing" && (
                    <span className="mr-2 h-2 w-2 animate-pulese rounded-full bg-amber-500" />
                )}
                {label}
             </span>
    );

}