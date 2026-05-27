type AppShellProps = {
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function AppShell({ title, description, children} : AppShellProps) {
    return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
            <section className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="mt-2 text-slate-400">{description}</p>
                </div>
                {children}
            </section>
        </main>
    )

}