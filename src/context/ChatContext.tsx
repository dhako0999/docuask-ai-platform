"use client";

import { useState, useEffect, useContext, createContext } from "react";

import type { Message } from "@/types/message";

import type { UploadedDocument } from "@/types/document";

import { graphqlRequest } from "@/lib/graphql";


type ChatContextType = {
    messages: Message[];
    loading: boolean;
    sendMessage: (content: string, selectedDocument: UploadedDocument | null, documents: UploadedDocument[]) => Promise<void>;
    questionsAsked: number;
    aiResponses: number;
    deleteMessage: (index: number) => void;
    fetchConversation: (documentId: string) => Promise<void>;
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

        try {
            let aiContent = "";

            if(selectedDocument) {
                const data = await graphqlRequest<{
                   askQuestion: {
                       answer: string;
                   };
                }>(
                    `
                       mutation AskQuestion($documentId: ID!, $question: String!) {
                           askQuestion(documentId: $documentId, question: $question) {
                               answer
                           
                           }
                       
                       }
                    
                    `,
                    {
                        documentId: selectedDocument.id,
                        question: content,
                    }
                );

                aiContent = data.askQuestion.answer;
            } else {
                aiContent = "Please select a document before asking a question.";
            }

            const aiMessage: Message = {
                role: "assistant",
                content: aiContent,
                createdAt: new Date().toISOString(),
            }

            setMessages((prevs) => [...prevs, aiMessage]);

        } catch (error) {
            console.error("Send message error: ", error);

            const errorMessage: Message = {
                role: "assistant",
                content: "Sorry, I could not answer that question.",
                createdAt: new Date().toISOString(),
            };

            setMessages((prevs) => [...prevs, errorMessage]);

        } finally {
            setLoading(false);

        }
        
    }

    async function fetchConversation(documentId: string) {
        try {
          const data = await graphqlRequest<{
            conversation: {
              id: string;
              messages: {
                id: string;
                role: "user" | "assistant";
                content: string;
                createdAt: string;
              }[];
            } | null;
          }>(
            `
              query Conversation($documentId: ID!) {
                conversation(documentId: $documentId) {
                  id
                  messages {
                    id
                    role
                    content
                    createdAt
                  }
                }
              }
            `,
            { documentId }
          );
      
          const loadedMessages =
            data.conversation?.messages.map((message) => ({
              role: message.role,
              content: message.content,
              createdAt: message.createdAt,
            })) ?? [];
      
          setMessages(loadedMessages);
        } catch (error) {
          console.error("Fetch conversation error:", error);
        }
    }

    function deleteMessage(index: number) {

        setMessages((prevs) => prevs.filter((_, i) => i !== index));
    }

    const questionsAsked = messages.filter((message) => message.role === "user").length;

    const aiResponses = messages.filter((message) => message.role === "assistant").length;

    return (
        <ChatContext.Provider value={{ messages, loading, sendMessage, questionsAsked, aiResponses, deleteMessage, fetchConversation }}>{children}</ChatContext.Provider>
    )

}

export function useChat() {

    const context = useContext(ChatContext);

    if(!context) {
        throw new Error("useChat must be used inside ChatProvider");

    }

    return context;

}