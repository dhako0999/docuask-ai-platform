type DashboardCardProps = {
    label: string;
    value: number;
}


export default function DashboardCard({
    label,
    value,
}: DashboardCardProps) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-600">{label}</p>

            <h2 className="mt-2 text-3xl font-bold text-white">
                {value}
            </h2>

        </div>
    );
}

