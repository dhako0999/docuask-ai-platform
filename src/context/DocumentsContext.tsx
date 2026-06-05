"use client"


import { createContext, useContext, useState, useEffect } from "react";

import { UploadedDocument } from "@/types/document";

import { graphqlRequest } from "@/lib/graphql";




type DocumentsContextType = {
    documents: UploadedDocument[];
    addDocument: (file: File, status: UploadedDocument["status"], content: string, s3Key: string) => string;
    deleteDocument: (id: string) => Promise<void>;
    selectedDocument: UploadedDocument | null;
    setSelectedDocument: (doc: UploadedDocument | null) => void;
    markDocumentReady: (id: string) => void;

};


const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: React.ReactNode; }) {
    //const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);

    useEffect(() => {
        fetchDocuments();
    }, []);

    function addDocument(file: File, status: UploadedDocument["status"] = "ready", content: string, s3Key: string) {

        const id = crypto.randomUUID();

        const newDocument: UploadedDocument = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            status: "ready",
            content,
            s3Key,
        };

        setDocuments((prevs) => [...prevs, newDocument]);

        return id;

    }


    function markDocumentReady(id: string) {
        setDocuments((prevs) => prevs.map((doc) => doc.id === id ? {...doc, status: "ready"} : doc));
    }

    /*async function fetchDocuments() {
        try {

            const res = await fetch("/api/documents", {
                method: "GET",  
            });

            if(!res.ok) {
                throw new Error("Failed to fetch documents");
            }

            const data = await res.json();

            setDocuments(data);

        } catch (error) {
            console.error("Error fetching documents: ", error);

        } 
    }*/

    
    async function fetchDocuments() {
        try {

            const data = await graphqlRequest<{
                documents: UploadedDocument[]
            }>(
                `
                  query {
                     documents {
                        id
                        name
                        size
                        type
                        s3Key
                        content
                        status
                        uploadedAt
                        createdAt
                     }
                  }
            `);

            setDocuments(data.documents);


        } catch (error) {
            console.error("Fetch documents error: ", error);

        }
    }

    /*async function deleteDocument(id: string) {
        try {

            const res = await fetch(`/api/documents/${id}`, {
                method: "DELETE",
            });

            if(!res.ok) {
                throw new Error("Failed to delete document");
            }

            setDocuments((prevs) => prevs.filter((doc) => doc.id !== id));

        } catch (error) {
            console.error("Delete document error: ", error);
        }
    }*/

    async function deleteDocument(id: string) {
        try {

            await graphqlRequest<{
                deleteDocument: Boolean;
            }>(
                `
                   mutation DeleteDocument($id: ID!) {
                      deleteDocument(id: $id)
                   }
                `,
                { id }
            );

            setDocuments((prevs) => prevs.filter((doc) => doc.id !== id));

        } catch (error) {
            console.error("Delete document error: ", error);
        }
    }


    return (
        <DocumentsContext.Provider value={{ documents, addDocument, deleteDocument, selectedDocument, setSelectedDocument, markDocumentReady}}>{children}</DocumentsContext.Provider>
    );
    
}


export function useDocuments() {

    const context = useContext(DocumentsContext);

    if(!context) {
        throw new Error("useDocuments must be used inside DocumentsProvider");
    }

    return context;
}