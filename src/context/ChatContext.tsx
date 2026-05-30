"use client";

import { useState, useEffect, useContext, createContext } from "react";

import type { Message } from "@/types/message";

import type { UploadedDocument } from "@/types/document";


type ChatContextType = {
    messages: Message[];
    loading: boolean;
    sendMessage: (content: string, selectedDocument?: UploadedDocument | null) => Promise<void>;
    questionsAsked: number;
    aiResponses: number;
    deleteMessage: (index: number) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children } : { children: React.ReactNode }) {

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);


    useEffect(() => {

        const saved = localStorage.getItem("messages");

        if(saved) {
            setMessages(JSON.parse(saved));
        }

        setHasLoaded(true);
        
    }, []);

    useEffect(() => {
        if(!hasLoaded) return;

        localStorage.setItem("messages", JSON.stringify(messages));

    }, [messages, hasLoaded]);

    async function sendMessage(content: string, selectedDocument?: UploadedDocument | null) {
        if(!content.trim()) return;

        const userMessage: Message = {
            role: "user",
            content,
            createdAt: new Date().toISOString(),

        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const aiMessage: Message = {
            role: "assistant",
            content: selectedDocument 
                    ? `You asked "${content}" about "${selectedDocument.name}". AI responses will later use uploaded document content.` 
                    : `You asked "${content}". AI responses will later use uploaded document context`,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setLoading(false);
    }

    function deleteMessage(index: number) {

        setMessages((prevs) => prevs.filter((_, i) => i !== index));
    }

    const questionsAsked = messages.filter((message) => message.role === "user").length;

    const aiResponses = messages.filter((message) => message.role === "assistant").length;

    return (
        <ChatContext.Provider value={{ messages, loading, sendMessage, questionsAsked, aiResponses, deleteMessage }}>{children}</ChatContext.Provider>
    )

}

export function useChat() {

    const context = useContext(ChatContext);

    if(!context) {
        throw new Error("useChat must be used inside ChatProvider");

    }

    return context;

}