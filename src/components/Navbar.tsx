import Link from "next/link";

export default function NavBar() {
    return (
        <nav className="border-b border-slate-800 bg-slate-950 px-6 py-4 text-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                <Link href="/" className="text-lg font-bold">
                    DocuAsk AI
                </Link>

                <div className="flex gap-6 text-sm text-slate-300">
                    <Link href="/dashboard" className="hover:text-white">
                        Dashboard
                    </Link>
                    <Link href="/upload" className="hover:text-white">
                        Upload
                    </Link>
                    <Link href="/chat" className="hover:text-white">
                        Chat
                    </Link>
                </div>
            </div>
        </nav>
    );
}