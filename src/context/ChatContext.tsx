"use client";

import { useState, useEffect, useContext, createContext } from "react";

import type { Message } from "@/types/message";

import type { UploadedDocument } from "@/types/document";

import { graphqlRequest, askAcrossDocuments, analyzeDocument, researchAcrossDocuments, compareDocuments } from "@/lib/graphql";

import type { AnswerSource } from "@/lib/graphql";


type ChatContextType = {
    messages: Message[];
    loading: boolean;
    sendMessage: (content: string, selectedDocument: UploadedDocument | null, documents: UploadedDocument[]) => Promise<void>;
    questionsAsked: number;
    aiResponses: number;
    deleteMessage: (index: number) => void;
    fetchConversation: (documentId: string) => Promise<void>;
    sendMessageAcrossDocuments: (question: string) => Promise<void>;
    analyzeSelectedDocument: (selectedDocument: UploadedDocument | null) => Promise<void>;
    researchDocuments: (content: string) => Promise<void>;
    compareSelectedDocuments: (
      documentA: UploadedDocument | null,
      documentB: UploadedDocument | null
    ) => Promise<void>;
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

   /* async function sendMessage(content: string, selectedDocument: UploadedDocument | null, documents: UploadedDocument[]) {
        if(!content.trim()) return;

        const userMessage: Message = {
            role: "user",
            content,
            createdAt: new Date().toISOString(),
            mode: "selected",
        };

        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            let aiContent = "";
            let dataSources: AnswerSource[] = [];

            if(selectedDocument) {
                const data = await graphqlRequest<{
                   askQuestion: {
                       answer: string;
                       sources: AnswerSource[];
                   };
                }>(
                    `
                       mutation AskQuestion($documentId: ID!, $question: String!) {
                           askQuestion(documentId: $documentId, question: $question) {
                               answer,
                               sources {
                                   sourceNumber,
                                   documentId,
                                   documentName,
                                   chunkIndex,
                                   similarity, 
                                   preview
                               }
                           
                           }
                       
                       }
                    
                    `,
                    {
                        documentId: selectedDocument.id,
                        question: content,
                    }
                );

                aiContent = data.askQuestion.answer;
                dataSources = data.askQuestion.sources.slice(0, 5);

                console.log("Sources:", data.askQuestion.sources);
                
            } else {
                aiContent = "Please select a document before asking a question.";
            }

            const aiMessage: Message = {
                role: "assistant",
                content: aiContent,
                createdAt: new Date().toISOString(),
                mode: "selected",
                sources: dataSources,
               
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
        
    }*/

    
    async function sendMessage(
      content: string,
      selectedDocument: UploadedDocument | null,
      documents: UploadedDocument[]
    ) {
      if (!content.trim()) return;
    
      const userMessage: Message = {
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        mode: "selected",
      };
    
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

    
      try {
        if (!selectedDocument) {
          const aiMessage: Message = {
            role: "assistant",
            content: "Please select a document before asking a question.",
            createdAt: new Date().toISOString(),
            mode: "selected",
          };
    
          setMessages((prevs) => [...prevs, aiMessage]);
          return;
        }

        await fetch("/api/chat/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: selectedDocument.id,
            role: "user",
            content,
          }),
        });
    
        const assistantMessage: Message = {
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
          mode: "selected",
          sources: [],
        };
    
        setMessages((prevs) => [...prevs, assistantMessage]);
    
        const response = await fetch("/api/chat/selected-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: selectedDocument.id,
            question: content,
          }),
        });
    
        if (!response.ok || !response.body) {
          throw new Error("Streaming response failed");
        }
    
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
    
        let streamedAnswer = "";
    
        while (true) {
          const { done, value } = await reader.read();
    
          if (done) break;
    
          const chunk = decoder.decode(value, { stream: true });
          streamedAnswer += chunk;
    
          setMessages((prev) =>
            prev.map((message, index) =>
              index === prev.length - 1
                ? {
                    ...message,
                    content: streamedAnswer,
                  }
                : message
            )
          );
        }

        const saveAssistantRes = await fetch("/api/chat/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: selectedDocument.id,
            role: "assistant",
            content: streamedAnswer,
          }),
        });

        if(!saveAssistantRes) {
          throw new Error("Failed to save assistant message");
        }


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

    async function sendMessageAcrossDocuments(content: string) {
      if(!content.trim()) return;

      setLoading(true);

      const userMessage: Message = {
        role: "user",
        content,
        createdAt: new Date().toISOString(),
        mode: "all",
      };

      setMessages((prevs) => [...prevs, userMessage]);

      try {
        const result = await askAcrossDocuments(content);

        const assistantMessage: Message = {
          role: "assistant",
          content: result.answer,
          createdAt: new Date().toISOString(),
          mode: "all",
          sources: result.sources,
        };

        setMessages((prevs) => [...prevs, assistantMessage]);

      } catch (error) {
        console.error("Send message across documents error: ", error);

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

    async function analyzeSelectedDocument(selectedDocument: UploadedDocument | null) {

      console.log("Analyze clicked");
      console.log("Selected document:", selectedDocument);

      if (!selectedDocument) {
        console.log("No selected document");
        return;
      }

      if (selectedDocument.status !== "ready") {
        console.log("Document is not ready:", selectedDocument.status);
        return;
      }

      setLoading(true);

      const userMessage: Message = {
        role: "user",
        content: `Analyze document: ${selectedDocument.name}`,
        createdAt: new Date().toISOString(),
        mode: "selected",
      }

      setMessages((prevs) => [...prevs, userMessage]);

      try {

        const result = await analyzeDocument(selectedDocument.id);

        const assistantMessage: Message = {
          role: "assistant",
          content: result.analysis,
          createdAt: new Date().toISOString(),
          mode: "selected",
        };

        setMessages((prevs) => [...prevs, assistantMessage]);



      } catch (error) {
        console.error("Error in analyzing the document: ", error);
      } finally {
        setLoading(false);
      }

     

    }

    async function researchDocuments(content: string) {
       
       if(!content.trim()) return;

       setLoading(true);

       const userMessage: Message = {
          role: "user",
          content: `Research ${content}`,
          createdAt: new Date().toISOString(),
          mode: "all",
       };

       setMessages((prevs) => [...prevs, userMessage]);

       try {

          const result = await researchAcrossDocuments(content);

          const assistantMessage: Message = {
            role: "assistant",
            content: `${result.report}`,
            createdAt: new Date().toISOString(),
            mode: "all",
          };

          setMessages((prev) => [...prev, assistantMessage]);

       } catch (error) {
          console.error("");
       } finally {
          setLoading(false);
       }
    }

    async function compareSelectedDocuments(
      documentA: UploadedDocument | null,
      documentB: UploadedDocument | null
    ) {
      if (!documentA || !documentB) return;
      if (documentA.id === documentB.id) return;
      if (documentA.status !== "ready" || documentB.status !== "ready") return;
    
      setLoading(true);
    
      const userMessage: Message = {
        role: "user",
        content: `Compare documents: ${documentA.name} and ${documentB.name}`,
        createdAt: new Date().toISOString(),
        mode: "all",
      };
    
      setMessages((prevs) => [...prevs, userMessage]);
    
      try {
        const result = await compareDocuments(documentA.id, documentB.id);
    
        const assistantMessage: Message = {
          role: "assistant",
          content: result.comparison,
          createdAt: new Date().toISOString(),
          mode: "all",
        };
    
        setMessages((prevs) => [...prevs, assistantMessage]);
      } catch (error) {
        console.error("Compare documents error:", error);
      } finally {
        setLoading(false);
      }
    }

    function deleteMessage(index: number) {

        setMessages((prevs) => prevs.filter((_, i) => i !== index));
    }

    const questionsAsked = messages.filter((message) => message.role === "user").length;

    const aiResponses = messages.filter((message) => message.role === "assistant").length;

    return (
        <ChatContext.Provider value={{ messages, loading, sendMessage, questionsAsked, aiResponses, deleteMessage, fetchConversation, sendMessageAcrossDocuments, analyzeSelectedDocument, researchDocuments, compareSelectedDocuments }}>{children}</ChatContext.Provider>
    )

}

export function useChat() {

    const context = useContext(ChatContext);

    if(!context) {
        throw new Error("useChat must be used inside ChatProvider");

    }

    return context;

}