import RagPipelineAnimation from "@/components/RagPipelineAnimation";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 via-slate-50 to-emerald-50 text-slate-900">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
          AI-powered document Q&A
        </p>

        <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
          Ask questions across your documents.
        </h1>

        <p className="mb-10 max-w-2xl text-lg leading-8 text-slate-600">
          Upload PDFs, DOCX files, or text documents and get grounded answers
          with source citations from your own content.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700">
            Get Started
          </button>

          <button className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-3 font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100">
            View Demo
          </button>
        </div>

        <RagPipelineAnimation />
      </section>
    </main>
  );
}
