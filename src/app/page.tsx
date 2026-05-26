import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
            AI-powered document Q&A
        </p>

        <h1 className="mb-6 text-5xl font-bold tracking-light">
          Ask questions across your documents.
        </h1>

        <p className="mb-8 max-w-2xl text-lg text-slate-300">
          Upload PDFs, docs, or URLs and get cited answers from your own content.
        </p>

        <div className="flex gap-4">
          <button className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950">
            Get Started
          </button>

          <button className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-white">
            View Demo
          </button>

        </div>


      </section>

    </main>
  );
}
