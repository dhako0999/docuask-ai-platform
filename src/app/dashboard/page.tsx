import AppShell from "@/components/AppShell";


export default function DashboardPage() {
    return (
        <AppShell
                title="Dashboard"
                description="View your documents, recent questions, and AI activity."
        >
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                Dashboard content will go here.
            </div>
        </AppShell>     
    )
}