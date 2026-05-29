"use client";

import AppShell from "@/components/AppShell";
import DashboardCard from "@/components/DashboardCard";
import { recentActivity } from "@/lib/mockData";
import { useDocuments } from "@/context/DocumentsContext";
import { useChat } from "@/context/ChatContext";

import { Activity } from "@/types/activity";





export default function DashboardPage() {

    const { documents } = useDocuments();
    const { messages, questionsAsked, aiResponses } = useChat();

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
        </AppShell>     
    )
}