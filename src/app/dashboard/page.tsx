"use client";

import AppShell from "@/components/AppShell";
import DashboardCard from "@/components/DashboardCard";
//import { recentActivity } from "@/lib/mockData";
import { useDocuments } from "@/context/DocumentsContext";
import { useChat } from "@/context/ChatContext";

//import type { Activity } from "@/types/activity";

import { useState } from "react";


export default function DashboardPage() {

    const { documents, deleteDocument, selectedDocument, setSelectedDocument } = useDocuments();
    const { messages, questionsAsked, aiResponses } = useChat();
    const [documentSearch, setDocumentSearch] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [globalDocumentSearch, setGlobalDocumentSearch] = useState("");

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

            <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold text-white">
                    Recent Questions
                </h2>

                <div className="mt-3 space-y-3">
                    {recentQuestions.length === 0 ? (
                        <p className="text-sm text-slate-500">No questions asked yet.</p>
                    ) : (
                        recentQuestions.map((question, index) => (
                            <div
                                key={index}
                                className="rounded-xl bg-slate-950 p-4"
                            >
                                <p className="text-sm text-white">
                                    {question.content}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Asked {new Date(question.createdAt).toLocaleString()}
                                </p>
                            </div>    
                        ))
                    )}
                </div>

            </div>

            <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold text-white">
                    Recent Responses
                </h2>

                <div className="mt-3 space-y-3">
                    {recentAIResponses.length === 0 ? (
                        <p className="text-sm text-slate-500">No responses yet.</p>
                    ) : (
                        recentAIResponses.map((response, index) => (
                            <div 
                                key={index}
                                className="rounded-xl bg-slate-950 p-4"
                            
                            >
                                <p className="text-sm text-white">
                                    {response.content}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {new Date(response.createdAt).toLocaleString()}
                                </p>
                            </div>

                        ))
                    )}
                </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold text-white">
                    Recent Activity
                </h2>
                <div className="mt-4 space-y-4">
                    {recentActivity.map((activity, index) => (
                        <div key={index} className="rounded-xl bg-slate-950 p-4">
                            <p className="text-white">
                            {activity.title}
                            </p>
                
                            <p className="mt-1 text-sm text-slate-500">
                            {new Date(activity.time).toLocaleString()}
                            </p>
                        </div>
                    ))}

                </div>

            </div>

            <div className="mt-8 rounded-2xl border border-slate-500 bg-slate-800 p-6">
                <h2 className="text-xl font-semibold text-white">
                    Uploaded Documents
                </h2>

                <div className="mt-4 space-y-3">
                    {sortedDocuments.length === 0 ? (
                        <p className="text-slate-500">
                            No documents uploaded yet.
                        </p>
                    ) : (
                        sortedDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="rounded-xl bg-slate-950 p-6"
                            >
                                <p className="font-medium text-white">{doc.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>
                                <p className="mt-1 text-xs text-slate-600">Uploaded {new Date(doc.uploadedAt).toLocaleString()}</p>
                                <div className="mt-3 space-y-3">
                                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                        doc.status === "ready" 
                                        ? "bg-green-900 text-green-300" 
                                        : "bg-yellow-900 text-yellow-300"
                                        }`}
                                        >
                                        Status: {doc.status}
                                    </span>
                                    <div className="flex gap-4 items-center">
                                        <button
                                            onClick={() => deleteDocument(doc.id)}
                                            className="text-sm text-red-400 hover:text-red-500"
                                        >
                                            Delete

                                        </button>

                                        <button
                                            onClick={() => setSelectedDocument(doc)}
                                            className="text-sm text-blue-400 hover:text-blue-300"
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

            {selectedDocument && (

                <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">
                        {selectedDocument.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                        Type: {selectedDocument.type}
                    </p>

                    <p className="text-sm text-slate-300">
                        Size: {(selectedDocument.size / 1024).toFixed(1)} KB

                    </p>

                    <p className="text-sm text-slate-300">
                        Status: {selectedDocument.status}
                    </p>

                    <p className="text-sm text-slate-300">
                        Uploaded: { new Date(selectedDocument.uploadedAt).toLocaleString() }
                    </p>

                    <p className="text-sm text-slate-300">
                        Words: {wordCount}
                    </p>

                    <p className="text-sm text-slate-300">
                        Reading Time: {readingTimeMinutes} {readingTimeMinutes !== 1 ? "mins" : "min"}
                    </p>

                    {selectedDocument.content ? (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-white">
                                Content Preview
                            </h4>

                            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl p-6 bg-slate-900 text-slate-300 text-sm">
                                {selectedDocument.content.slice(0, 500)}

                            </div>
                        </div>

                    ) : (
                        <p className="mt-4 text-sm text-slate-100">
                            Preview is only available for TXT files right now.
                        </p>

                    )}

                    {selectedDocument.content && (
                        <div className="mt-4">
                            <input
                                  type="text"
                                  value={documentSearch}
                                  onChange={(e) => setDocumentSearch(e.target.value)}
                                  placeholder="Search..."
                                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                            />

                            {documentSearch && (
                                <div className="mt-3 rounded-xl bg-slate-900 p-4 text-sm text-slate-300">
                                    {matches.length > 0 ? (
                                        <>
                                           <div className="mb-3 flex items-center gap-3">
                                               <button
                                                      //onClick={() => setCurrentMatchIndex((prev) => Math.max(0, prev - 1))}
                                                      className="text-sm text-blue-400"
                                                      onClick={() => {
                                                        setCurrentMatchIndex((prev) => prev === 0 ? matches.length - 1 : prev - 1)
                                                      }}
                                               >
                                                    Previous
                                               </button>

                                               <span className="text-slate-400">
                                                 {currentMatchIndex + 1} of {matches.length} {" • "} Position: {currentMatchPosition}
                                               </span>

                                               <button
                                                     //onClick={() => setCurrentMatchIndex((prev) => Math.min(matches.length - 1, prev + 1))}
                                                     //disabled={currentMatchIndex === matches.length - 1}
                                                     onClick={() => {
                                                        setCurrentMatchIndex((prev) => prev === matches.length - 1 ? 0 : prev + 1)
                                                    }}
                                                     className="text-sm text-blue-400"
                                               >
                                                    Next
                                               </button>
                                           </div>

                                           <p>{highlightMatch(searchSnippet, documentSearch)}</p>
                                        </>

                                    ) : (
                                        <p className="text-slate-500">No match found.</p>
                                    )}
                                </div>
                            )}
                        </div>   
                    )}

                    

                    <button 
                       className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
                    >
                        Ask About This Document
                    </button>
                </div>    

            )}

            <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold text-white">
                    Search Across Documents
                </h2>

                <input 
                    value={globalDocumentSearch}
                    onChange={(e) => setGlobalDocumentSearch(e.target.value)}
                    placeholder="Search all uploaded documents..."
                    className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />

                {globalDocumentSearch && (
                    <div className="mt-4 space-y-4">
                        {globalSearchResults.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No matches found across your documents
                            </p>
                        ) : (
                            globalSearchResults.map((result) => (
                                <div
                                    key={result.document.id}
                                    className="rounded-xl bg-slate-950 p-4"
                                >
                                    <p className="font-medium text-white">
                                        {result.document.name}
                                    </p>

                                    <p className="mt-2 text-sm text-slate-300">
                                        {highlightMatch(result.snippet, globalDocumentSearch)}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        {result.matches} {result.matches !== 1 ? "matches" : "match"}
                                    </p>

                                    <button
                                        onClick={() => setSelectedDocument(result.document)}
                                        className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        View Document
                                    </button>
                                </div>    
                            ))
                        )}
                    </div>    
                )}
            </div>
        </AppShell>     
    )
}