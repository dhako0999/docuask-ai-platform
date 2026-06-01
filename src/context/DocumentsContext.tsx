"use client"


import { createContext, useContext, useState, useEffect } from "react";

import { UploadedDocument } from "@/types/document";


type DocumentsContextType = {
    documents: UploadedDocument[];
    addDocument: (file: File, status: UploadedDocument["status"], content: string, s3Key?: string) => string;
    deleteDocument: (id: string) => void;
    selectedDocument: UploadedDocument | null;
    setSelectedDocument: (doc: UploadedDocument | null) => void;
    markDocumentReady: (id: string) => void;
};


const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

export function DocumentsProvider({ children }: { children: React.ReactNode; }) {
    //const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("documents");

        if(saved) {
            setDocuments(JSON.parse(saved));
        }

        setHasLoaded(true);
    }, []);




    useEffect(() => {

        if(!hasLoaded) return;

        localStorage.setItem("documents", JSON.stringify(documents));

    }, [documents, hasLoaded]);

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

    function deleteDocument(id: string) {
        setDocuments((prevs) => prevs.filter((doc) => doc.id !== id));
    }

    function markDocumentReady(id: string) {
        setDocuments((prevs) => prevs.map((doc) => doc.id === id ? {...doc, status: "ready"} : doc));
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