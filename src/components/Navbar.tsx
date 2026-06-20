import Link from "next/link";

export default function NavBar() {
    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
                    <span className="text-emerald-600">DocuAsk AI</span>
                </Link>

                <div className="flex gap-6 text-sm font-medium text-slate-600">
                    <Link href="/dashboard" className="transition-colors hover:text-emerald-600">
                        Dashboard
                    </Link>
                    <Link href="/upload" className="transition-colors hover:text-emerald-600">
                        Upload
                    </Link>
                    <Link href="/chat" className="transition-colors hover:text-emerald-600">
                        Chat
                    </Link>
                </div>
            </div>
        </nav>
    );
}