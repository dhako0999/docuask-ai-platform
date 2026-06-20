type DashboardCardProps = {
    label: string;
    value: number;
}


export default function DashboardCard({
    label,
    value,
}: DashboardCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-light text-slate-950">
                {value}
            </h2>

        </div>
    );
}

