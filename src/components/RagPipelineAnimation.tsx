"use client";

import { motion } from "framer-motion";

const steps = [
    "Document",
    "Chunking",
    "Embeddings",
    "Analysis",
    "Cited Answer",
];

export default function RagPipelineAnimation() {
    return (
        <div className="mt-14 w-full max-w-4xl rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
            <div className="grid gap-4 md:grid-cols-5">
                {steps.map((step, index) => (
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 24, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                        delay: index * 0.35,
                        duration: 0.55,
                        ease: "easeOut",
                        }}
                        className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-stone-50 to-emerald-50 p-4 text-center shadow-sm"
                     >
                        <div className="mx-auto mb-3 flex w-10 h-10 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md">
                            {index + 1}
                        </div>

                        <p className="text-sm font-semibold text-slate-800">{step}</p>

                        {index < steps.length - 1 && (
                            <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-emerald-600 md:block">
                                →
                            </div>
                        )}
                    </motion.div>
                ))}

            </div>

            <motion.div
                className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center"
            >
                <p className="text-sm font-semibold text-amber-900">
                    Answer generated with source citations
                </p>

            </motion.div>

        </div>
    )
}