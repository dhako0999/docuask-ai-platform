"use client";

import AppShell from "@/components/AppShell";
import DashboardCard from "@/components/DashboardCard";
//import { recentActivity } from "@/lib/mockData";
import { useDocuments } from "@/context/DocumentsContext";
import { useChat } from "@/context/ChatContext";

//import type { Activity } from "@/types/activity";

import { useState } from "react";

import DocumentStatusBadge from "@/components/DocumentStatusBadge";


export default function DashboardPage() {

    const { documents, deleteDocument, selectedDocument, setSelectedDocument } = useDocuments();
    const { messages, questionsAsked, aiResponses } = useChat();
    const [documentSearch, setDocumentSearch] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [globalDocumentSearch, setGlobalDocumentSearch] = useState("");
    const [activeSection, setActiveSection] = useState<"questions" | "responses" | "activity" | "documents" | "search">("questions")

    const dashboardStats = [
        {
            label: "Documents",
            value: documents.length,
        },
        {
            label: "Questions Asked",
            value: questionsAsked,
        },
        {
            label: "AI Responses",
            value: aiResponses,
        },
    ];

    const documentActivity = documents.map((doc) => ({
        id: doc.id,
        title: `Uploaded ${doc.name}`,
        time: doc.uploadedAt,
    }));

    const messageActivity = messages.map((message, index) => ({
        id: `${message.role}-${index}`,
        title: message.role === "user" ? `Asked ${message.content}` : `AI answered a question`,
        time: message.createdAt,
    }));


    const recentActivity = [...documentActivity, ...messageActivity].sort((a, b) => (
        new Date(b.time).getTime() - new Date(a.time).getTime()
    ));

    const sortedDocuments = [...documents].sort((a, b) => (
       new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ));

    const documentSearchIndex = selectedDocument?.content.toLowerCase().indexOf(documentSearch.toLowerCase()) ?? -1;

    const matches: number[] = [];

    if(selectedDocument?.content && documentSearch) {
        let position = 0;

        while(true) {
            const found = selectedDocument.content.toLowerCase().indexOf(documentSearch.toLowerCase(), position);

            if(found === -1) break;

            matches.push(found);

            position = found + documentSearch.length;
        }
    }

    const currentMatchPosition = matches[currentMatchIndex] ?? -1;

    const searchSnippet = selectedDocument?.content && currentMatchPosition >= 0 ? selectedDocument.content.slice(Math.max(0, currentMatchPosition - 80), (currentMatchPosition + documentSearch.length + 80)) : "";

    function highlightMatch(text: string, query: string) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());

        if(!query || index === -1) return text;

        return (
            <>
               {text.slice(0, index)}
               <mark className="rounded bg-yellow-400 text-slate-950">
                  {text.slice(index, index + query.length)}
               </mark>
               {text.slice(index + query.length, text.length)}
            </>
        )

    }

    const globalSearchResults = documents.filter((doc) => {
        if(!globalDocumentSearch.trim()) return false;
        if(!doc.content) return false;

        const query = globalDocumentSearch.toLowerCase();

        return doc.content.toLowerCase().includes(query) || doc.name.toLowerCase().includes(query);
    }).map((doc) => {

        const query = globalDocumentSearch.toLowerCase();

        const nameMatch = doc.name.toLowerCase().includes(query);
        const contentMatch = doc.content.toLowerCase().includes(query);

        const matchIndex = doc.content.toLowerCase().indexOf(query);


        const snippet = contentMatch && matchIndex >= 0 ? doc.content.slice(Math.max(0, matchIndex - 80), matchIndex + globalDocumentSearch.length + 80) : nameMatch ? "Matched document name." : "";

        const contentMatches = contentMatch ? doc.content.toLowerCase().split(globalDocumentSearch.toLowerCase()).length - 1 : 0;

        return {
            document: doc,
            snippet,
            matches: contentMatches,
            nameMatch,
            contentMatch,
        };
    })
    .sort((a, b) => {
        if(a.contentMatch !== b.contentMatch) {
            return a.contentMatch ? -1 : 1;
        }

        return b.matches - a.matches;

    });

    const recentQuestions = messages.filter((message) => message.role === "user").slice(-5).reverse();

    const recentAIResponses = messages.filter((message) => message.role === "assistant").slice(-5).reverse();

    const wordCount = selectedDocument?.content ? selectedDocument.content.trim().split(/\s+/).length : 0;

    const characterCount = selectedDocument?.content.length || 0;

    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    function formatDate(value?: string) {
        if(!value) return "Date unavailable";

        const date = new Date(value);

        if(Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString();
    }

    

    return (
        <AppShell
                title="Dashboard"
                description="View your documents, recent questions, and AI activity."
        >
            <div className="grid gap-6 md:grid-cols-3">
                {dashboardStats.map((stat, index) => (
                    <DashboardCard key={stat.label} label={stat.label} value={stat.value}/>
                ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm">
                {[
                    { key: "questions", label: "Recent Questions" },
                    { key: "responses", label: "Recent Responses" },
                    { key: "activity", label: "Recent Activity" },
                    { key: "documents", label: "Uploaded Documents" },
                    { key: "search", label: "Search Documents" },
                ].map((tab) => (
                    <button
                            key={tab.key}
                            onClick={(e) => setActiveSection(tab.key as typeof activeSection)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeSection === tab.key ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                            {tab.label}
                    </button>
                ))}
            </div>

            {activeSection === "questions" && (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
                    <h2 className="text-xl font-semibold text-slat-950">
                        Recent Questions
                    </h2>
    
                    <div className="mt-4 space-y-3">
                        {recentQuestions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <h2 className="text-sm text-slate-500">
                                    No questions asked yet.
                                </h2>
                            </div>    
                        ) : (
                            recentQuestions.map((question, index) => (
                                <div
                                    key={index}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-emerald-200"
                                >
                                    <p className="text-sm text-slate-800">
                                        {question.content}
                                    </p>
    
                                    <p className="mt-2 text-xs text-slate-500">
                                        Asked {new Date(question.createdAt).toLocaleString()}
                                    </p>
                                </div>    
                            ))
                        )}
                    </div>
    
                </div>

            )}

            {activeSection === "responses" && (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200">
                    <h2 className="text-xl font-semibold text-slate-950">
                        Recent Responses
                    </h2>

                    <div className="mt-4 space-y-3">
                        {recentAIResponses.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <p className="text-sm text-slate-500">No responses yet.</p>
                            </div>    
                        ) : (
                            recentAIResponses.map((response, index) => (
                                <div 
                                    key={index}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-emerald-200"
                                
                                >
                                    <p className="text-sm text-slate-800">
                                        {response.content}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {new Date(response.createdAt).toLocaleString()}
                                    </p>
                                </div>

                            ))
                        )}
                    </div>
                </div>

            )}

            {activeSection === "activity" && (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
                    <h2 className="text-xl font-semibold text-slate-950">
                        Recent Activity
                    </h2>
                    <div className="mt-4 space-y-4">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-emerald-200">
                                <p className="font-medium text-slate-900">
                                {activity.title}
                                </p>
                    
                                <p className="mt-1 text-sm text-slate-500">
                                {formatDate(activity.time)}
                                </p>
                            </div>
                        ))}

                    </div>

                </div>

            )}

            {activeSection === "documents" && (
                <div className="mt-8 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
                    <h2 className="text-xl font-semibold text-slate-950">
                        Uploaded Documents
                    </h2>

                    <div className="mt-4 space-y-4">
                        {sortedDocuments.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                <p className="text-sm text-slate-500">
                                    No documents uploaded yet.
                                </p>
                            </div>    
                        
                        ) : (
                            sortedDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-emerald-200"
                                >
                                    <p className="font-semibold text-slate-900">{doc.name}</p>
                                    <p className="mt-1 text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                                    <p className="mt-1 text-xs text-slate-500">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
                                    <div className="mt-4 space-y-3">
                                        <DocumentStatusBadge status={doc.status} />
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => deleteDocument(doc.id)}
                                                className="text-sm font-medium text-red-600 hover:text-red-700"
                                            >
                                                Delete

                                            </button>

                                            <button
                                                onClick={() => setSelectedDocument(doc)}
                                                disabled={doc.status === "processing"}
                                                className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                                            >
                                                View Details
                                            </button>  
                                        </div>    
                                        
                                    </div>  

                                
                                    
                                </div>
                            ))
                        )}
                    </div>

                    
                </div>


            )}


            
            {selectedDocument && (

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-emerald-700">
                                Selected Document
                            </p>

                            <h3 className="mt-1 text-xl font-semibold text-slate-950">
                                {selectedDocument.name}
                            </h3>
                        </div>


                        <span
                             className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                selectedDocument.status === "ready"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                             }`}
                        >
                                {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                        </span>

                    </div>

                    {selectedDocument.status === "processing" && (
                            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                 This document is still processing. You can view metadata now, but Q&A will be available once processing finishes.
                            </div>
                        )}

                    {selectedDocument.status === "failed" && (
                        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            Document processing failed. Delete this document and upload it again.
                        </div>    
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Type
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {selectedDocument.type}
                            </p>

                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Size
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {(selectedDocument.size / 1024).toFixed(1)} KB
                            </p>

                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Status
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {selectedDocument.status}
                            </p>

                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Uploaded
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {new Date(selectedDocument.uploadedAt).toLocaleString()} 
                            </p>

                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Words
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {wordCount} 
                            </p>

                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Reading Time
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {readingTimeMinutes} {readingTimeMinutes !== 1 ? "mins" : "min"}
                            </p>

                        </div>

                       

                    </div>

                    {selectedDocument.content ? (
                        <div className="mt-6">
                                <h4 className="text-sm font-semibold text-slate-950">
                                    Content Preview
                                </h4>

                                <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                                    {selectedDocument.content.slice(0, 500)}

                                </div>
                        </div>

                    ) : (
                        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Preview is only available for TXT files right now.
                        </p>

                    )}
                    

                   

                    {selectedDocument.content && (
                        <div className="mt-4">
                            <input
                                type="text"
                                value={documentSearch}
                                onChange={(e) => setDocumentSearch(e.target.value)}
                                placeholder="Search within this document..."
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            />

                            {documentSearch && (
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                                    {matches.length > 0 ? (
                                    <>
                                        <div className="mb-3 flex flex-wrap items-center gap-3">
                                        <button
                                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                                            onClick={() => {
                                            setCurrentMatchIndex((prev) =>
                                                prev === 0 ? matches.length - 1 : prev - 1
                                            );
                                            }}
                                        >
                                            Previous
                                        </button>

                                        <span className="text-sm text-slate-500">
                                            {currentMatchIndex + 1} of {matches.length} {" • "} Position:{" "}
                                            {currentMatchPosition}
                                        </span>

                                        <button
                                            onClick={() => {
                                            setCurrentMatchIndex((prev) =>
                                                prev === matches.length - 1 ? 0 : prev + 1
                                            );
                                            }}
                                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                                        >
                                            Next
                                        </button>
                                        </div>

                                        <p className="rounded-xl border border-slate-200 bg-white p-4 leading-6 text-slate-700">
                                        {highlightMatch(searchSnippet, documentSearch)}
                                        </p>
                                    </>
                                    ) : (
                                    <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-slate-500">
                                        No match found.
                                    </p>
                                    )}
                                </div>
                            )}
                        </div>   
                    )}

                    

                    <button disabled={selectedDocument.status !== "ready"} className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700">
                        Ask About This Document
                    </button>
                </div>    

            )}

            {activeSection === "search" && (
                 <div className="mt-6 rounded-3xl border border-slate-300 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
                    <div className="mb-5">
                        <p className="text-sm font-medium text-emerald-700">
                            Document Search
                        </p>

                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                            Search Across Documents
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Find matching content across your uploaded document library.
                        </p>

                    </div>
                
    
                    <input 
                        value={globalDocumentSearch}
                        onChange={(e) => setGlobalDocumentSearch(e.target.value)}
                        placeholder="Search all uploaded documents..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
    
                    {globalDocumentSearch && (
                        <div className="mt-5 space-y-4">
                            {globalSearchResults.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                                    <p className="text-sm text-slate-500">
                                        No matches found across your documents.
                                    </p>
                                </div>
                            ) : (
                                globalSearchResults.map((result) => (
                                    <div
                                        key={result.document.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-emerald-200"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {result.document.name}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {result.matches}{" "}
                                                    {result.matches !== 1 ? "matches" : "match"}
                                                </p>
                                            </div>  

                                            <button 
                                                 onClick={() => setSelectedDocument(result.document)}
                                                 className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                                            >
                                                View Document
                                            </button>   
                                        </div> 

                                        <p className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                                            {highlightMatch(result.snippet, globalDocumentSearch)}
                                        </p>   
                                        
                                    </div>    
                                ))
                            )}
                        </div>    
                    )}
                </div>

            )}

           
        </AppShell>     
    )
}