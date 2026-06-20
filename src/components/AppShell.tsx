type AppShellProps = {
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function AppShell({ title, description, children} : AppShellProps) {
    return (
        <main className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50 to-emerald-50 px-6 py-10 text-slate-900">
            <section className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                        {title}
                    </h1>
                    <p className="mt-2 text-slate-600">{description}</p>

                </div>
                {children}

            </section>

        </main>
    )

}