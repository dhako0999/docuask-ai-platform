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
        <div className="flex h-[700px] flex-col rounded-2xl border border-slate-800 bg-slate-900">
            {selectedDocument && (
                <div className="border-b border-slate-800 p-6 flex flex-center justify-between">
                    <div>
                        <p className="text-sm text-slate-400">
                            Answering from document
                        </p>
                        <p className="font-medium text-white">
                            {selectedDocument.name}
                        </p>
                        <button
                            onClick={() => setSelectedDocument(null)}
                            className="mt-2 text-sm text-slate-400 hover:text-white"
                        >
                            Clear Document Context

                        </button>

                    </div>    

                    <div>
                        <select
                            onChange={(e) => setComparisonDocumentId(e.target.value)}
                            value={comparisonDocumentId}
                            className=""
                        >
                            <option value="">Compare with...</option>
                            {documents.filter((doc) => doc.id !== selectedDocument?.id && doc.status === "ready").map((doc) => (
                                <option key={doc.id} value={doc.id}>{doc.name}</option>
                            ))}   
                        </select> 
                    </div>    
                   
                </div>    

            )}
   
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {messages.length === 0 && (
                    <p className="text-sm text-slate-600">
                        Ask questions about your uploaded documents.
                    </p>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`max-w-xl rounded-2xl p-4 text-sm ${
                            message.role === "user" 
                            ? "ml-auto bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-100"   
                        }`}
                    >

                        {message.mode === "all" && (
                            <p className="mb-2 text-xs font-semibold text-blue-300">
                                All Documents
                            </p>
                            )}

                            {message.mode === "selected" && (
                            <p className="mb-2 text-xs font-semibold text-green-300">
                                Selected Document
                            </p>
                        )}
                        <p>{message.content}</p>

                        <button
                             onClick={() => deleteMessage(index)}
                             className="mt-2 text-xs text-red-300 hover:text-red-200"
                        >
                            Delete
                        </button>
                    </div>    
                ))}

                {loading && (
                    <div className="max-w-xs rounded-2xl bg-slate-800 p-4 text-sm text-white">
                        Thinking...
                    </div>    
                )}

                <div ref={messagesEndRef} />

            </div>

            <div className="border-t border-slate-800 p-4">
                <div className="flex gap-3">
                    <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if(e.key === "Enter" && canAskQuestion && !loading) {
                                handleSendMessage();
                            }
                          }}
                          placeholder={selectedDocument?.status === "processing" ? "Document is processing..." : selectedDocument?.status === "failed" ? "Document processing failed" : "Ask a question..."}
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    />

                    <button
                          onClick={handleSendMessage}
                          disabled={!canAskQuestion || loading}
                          className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                    
                    >
                        Send
                    </button>

                    <button
                         onClick={(handleAskAcrossDocuments)}
                         disabled={loading}
                         className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                        Ask All
                    </button>

                    <button
                         onClick={() => researchDocuments(input)}
                         disabled={!input.trim() || loading}
                         className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                        Research
                    </button>

                    <button
                         onClick={() => compareSelectedDocuments(selectedDocument, comparisonDocument)}
                         disabled={
                            loading || 
                            !selectedDocument || 
                            !comparisonDocument || 
                            selectedDocument.status !== "ready" || 
                            comparisonDocument.status !== "ready"
                        }
                         className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                    >
                         Compare Documents
                    </button>

                    <button 
                         onClick={() => analyzeSelectedDocument(selectedDocument)}
                         disabled={!selectedDocument || selectedDocument.status !== "ready" || loading}
                         className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                         >
                        Analyze
                    </button>
                </div>

                {selectedDocument?.status === "processing" && (
                    <p className="text-sm text-slate-600">This document is still processing. Please wait before asking questions.</p>
                )}

                {selectedDocument?.status === "failed" && (
                    <p className="text-sm text-slate-600">Document processing failed. Please delete and upload it again.</p>
                )}
            </div>

            

        </div>
    );

}