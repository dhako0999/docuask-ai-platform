"use client";

import { useState, useRef, useEffect } from "react";

import { useChat } from "@/context/ChatContext";

type Message = {
    role: "user" | "assistant";
    content: string;
}

export default function ChatWindow() {

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { messages, loading, sendMessage, deleteMessage } = useChat();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, loading]);

    async function handleSendMessage() {
        if(!input.trim()) return;

        await sendMessage(input);

        setInput("");
       

    }


    return (
        <div className="flex h-[700px] flex-col rounded-2xl border border-slate-800 bg-slate-900">
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
                        <p>{message.content}</p>

                        <button
                             onClick={() => deleteMessage(index)}
                             className="mt-2 text-xs font-red-300 hover:text-red-200"
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
                            if(e.key === "Enter") {
                                handleSendMessage();
                            }
                          }}
                          placeholder="Ask a question..."
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    />

                    <button
                          onClick={handleSendMessage}
                          disabled={loading}
                          className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                    
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );

}