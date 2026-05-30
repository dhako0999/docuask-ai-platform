"use client";

import { useState } from "react";
import { useDocuments } from "@/context/DocumentsContext";

import { extractPdfText } from "@/lib/pdf";



export default function UploadBox() {

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const { documents, addDocument, markDocumentReady } = useDocuments();


    async function handleUpload() {
        if (!selectedFile) return;
      
        try {
          setLoading(true);
          setError("");
          setSuccess("");

          let content = "";

          if (selectedFile.type === "text/plain") {
              content = await selectedFile.text();
          } else if (selectedFile.type === "application/pdf") {
            content = await extractPdfText(selectedFile);
          }

          const documentId = addDocument(selectedFile, "processing", content);
         
          await new Promise((resolve) => setTimeout(resolve, 1500));

          markDocumentReady(documentId);

          setSuccess(`${selectedFile.name} uploaded successfully.`);
        } catch {
          setError("Upload failed.");
        } finally {
          setLoading(false);
        }
    }



    return (
        <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-900 p-8 text-center">
            <p className="text-lg font-semibold text-white">Upload a document.</p>

            <p className="mt-2 text-sm text-slate-600">
                PDF, DOCX, or TXT files will be supported.
            </p>

            <input
                type="file"
                accept=".pdf, .docx, .txt"
                className="mt-6 block w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300"
                onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;

                    if(!file) {
                        setSelectedFile(null);
                        return;
                    }

                    const allowedTypes = [
                        "application/pdf",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "text/plain"
                    ];

                    const maxSize = 10 * 1024 * 1024;

                    if(!allowedTypes.includes(file.type)) {
                        setError("Only PDF, DOCX, or TXT files are allowed.");
                        setSelectedFile(null);
                        return;
                    }

                    if(file.size > maxSize) {
                        setError("File size must be smaller than 10 MB.");
                        setSelectedFile(null);
                        return;
                    }

                    setError("");
                    setSelectedFile(file);
                }}
                />

                {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

                {selectedFile && (
                    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4 text-left">
                        <p className="text-sm text-slat-600">Selected file</p>
                        <p className="mt-1 font-medium text-white">{selectedFile.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                    </div>    
                )}

                <button
                       onClick={handleUpload}
                       disabled={!selectedFile || loading}
                       className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                        {loading ? "Uploading..." : "Upload document"}
                </button>

                {success && (
                    <p className="mt-4 text-sm text-green-400">{success}</p>
                )}

                {documents.length > 0 && (
                    <div className="mt-8 space-y-3 text-left">
                        <h2 className="text-lg font-semibold text-white">
                            Uploaded documents
                        </h2>

                        {documents.map((doc) => (
                            <div
                                 key={doc.id}
                                 className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                            >
                                <p className="font-medium text-white">{doc.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                            </div>    

                        ))}
                    </div>    
                )}

        </div>
    )
}