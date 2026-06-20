"use client";

import { useState, useRef, useEffect } from "react";

import { useChat } from "@/context/ChatContext";

import { useDocuments } from "@/context/DocumentsContext";

type Message = {
    role: "user" | "assistant";
    content: string;
}

export default function ChatWindow() {

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { messages, loading, sendMessage, deleteMessage, fetchConversation, sendMessageAcrossDocuments, analyzeSelectedDocument, researchDocuments, compareSelectedDocuments } = useChat();
    const { selectedDocument, setSelectedDocument, documents } = useDocuments();
    const [comparisonDocumentId, setComparisonDocumentId] = useState("");


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    useEffect(() => {
        if(!selectedDocument) return;

        fetchConversation(selectedDocument.id);
    }, [selectedDocument]);

    async function handleSendMessage() {
        if(!input.trim()) return;

        await sendMessage(input, selectedDocument, documents);

        setInput("");
       

    }

    const canAskQuestion = selectedDocument?.status === "ready";

    async function handleAskAcrossDocuments() {
        if(!input.trim()) return;

        try {

            await sendMessageAcrossDocuments(input);
            setInput("");

        } catch (error) {
            console.error("Ask across documents error: ", error);
        }
    }

    const comparisonDocument = documents.find((doc) => doc.id === comparisonDocumentId) ?? null;



    return (
        <div className="flex h-[700px] flex-col rounded-3xl border border-slate-200 bg-white/85 shadow-xl shadow-slate-200/70 backdrop-blur">
            {selectedDocument && (
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                    Answering from document
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                    {selectedDocument.name}
                    </p>

                    <button
                    onClick={() => setSelectedDocument(null)}
                    className="mt-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                    Clear Document Context
                    </button>
                </div>

                <select
                    onChange={(e) => setComparisonDocumentId(e.target.value)}
                    value={comparisonDocumentId}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                    <option value="">Compare with...</option>
                    {documents
                    .filter(
                        (doc) => doc.id !== selectedDocument?.id && doc.status === "ready"
                    )
                    .map((doc) => (
                        <option key={doc.id} value={doc.id}>
                        {doc.name}
                        </option>
                    ))}
                </select>
                </div>
            )}

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm font-medium text-slate-700">
                    Ask questions about your uploaded documents.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                    Use Send for the selected document, or Ask All across your library.
                    </p>
                </div>
                )}

                {messages.map((message, index) => (
                <div
                    key={index}
                    className={`max-w-xl rounded-2xl p-4 text-sm shadow-sm ${
                    message.role === "user"
                        ? "ml-auto bg-emerald-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                >
                    {message.mode === "all" && (
                    <p className="mb-2 text-xs font-semibold text-amber-700">
                        All Documents
                    </p>
                    )}

                    {message.mode === "selected" && (
                    <p className="mb-2 text-xs font-semibold text-emerald-700">
                        Selected Document
                    </p>
                    )}

                    <p>{message.content}</p>

                    <button
                    onClick={() => deleteMessage(index)}
                    className={`mt-2 text-xs font-medium ${
                        message.role === "user"
                        ? "text-emerald-100 hover:text-white"
                        : "text-red-500 hover:text-red-600"
                    }`}
                    >
                    Delete
                    </button>
                </div>
                ))}

                {loading && (
                <div className="max-w-xs rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                    Thinking...
                </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                    <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && canAskQuestion && !loading) {
                        handleSendMessage();
                        }
                    }}
                    placeholder={
                        selectedDocument?.status === "processing"
                        ? "Document is processing..."
                        : selectedDocument?.status === "failed"
                            ? "Document processing failed"
                            : "Ask a question..."
                    }
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />

                    <button
                    onClick={handleSendMessage}
                    disabled={!canAskQuestion || loading}
                    className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    Send
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                    onClick={handleAskAcrossDocuments}
                    disabled={loading}
                    className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    Ask All
                    </button>

                    <button
                    onClick={() => researchDocuments(input)}
                    disabled={!input.trim() || loading}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    Research
                    </button>

                    <button
                    onClick={() =>
                        compareSelectedDocuments(selectedDocument, comparisonDocument)
                    }
                    disabled={
                        loading ||
                        !selectedDocument ||
                        !comparisonDocument ||
                        selectedDocument.status !== "ready" ||
                        comparisonDocument.status !== "ready"
                    }
                    className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    Compare Documents
                    </button>

                    <button
                    onClick={() => analyzeSelectedDocument(selectedDocument)}
                    disabled={
                        !selectedDocument ||
                        selectedDocument.status !== "ready" ||
                        loading
                    }
                    className="rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                    Analyze
                    </button>
                </div>
                </div>

                {selectedDocument?.status === "processing" && (
                <p className="mt-3 text-sm text-amber-700">
                    This document is still processing. Please wait before asking questions.
                </p>
                )}

                {selectedDocument?.status === "failed" && (
                <p className="mt-3 text-sm text-red-600">
                    Document processing failed. Please delete and upload it again.
                </p>
                )}
            </div>

        </div>
    );

}