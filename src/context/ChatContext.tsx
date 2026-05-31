"use client";

import { useState, useEffect, useContext, createContext } from "react";

import type { Message } from "@/types/message";

import type { UploadedDocument } from "@/types/document";


type ChatContextType = {
    messages: Message[];
    loading: boolean;
    sendMessage: (content: string, selectedDocument: UploadedDocument | null, documents: UploadedDocument[]) => Promise<void>;
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

    async function sendMessage(content: string, selectedDocument: UploadedDocument | null, documents: UploadedDocument[]) {
        if(!content.trim()) return;

        const userMessage: Message = {
            role: "user",
            content,
            createdAt: new Date().toISOString(),

        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        let aiContent = "";

        if(selectedDocument?.content) {
            aiContent = `You asked "${content}" about "${selectedDocument.name}". Here is a preview from the document: ${selectedDocument.content.slice(0, 500)}`;
        } else if(selectedDocument) {
            aiContent = `You asked "${content}" about "${selectedDocument.name}", but this file type does not have any readable text content yet.`;
        } else {
            const query = content.toLowerCase();

            const results = documents.filter((doc) => doc.content.toLowerCase().includes(query))
            .map((doc) => {
                const matchIndex = doc.content.toLowerCase().indexOf(query);

                const snippet = doc.content.slice(Math.max(0, matchIndex - 120), (matchIndex + query.length + 120));

                const matches = doc.content.toLowerCase().split(query).length - 1;

                return {
                    document: doc,
                    snippet,
                    matches,
                };

            })
            .sort((a, b) => b.matches - a.matches);

            aiContent = results.length > 0 ? `I found this in "${results[0].document.name}": ${results[0].snippet}`
            : `I could not find an exact match for "${content}" in your uploaded documents.`;

        }

        const aiMessage: Message = {
            role: "assistant",
            content: aiContent,
            createdAt: new Date().toISOString(),
        };

        setMessages((prevs) => [...prevs, aiMessage]);
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