export type Activity = {
    id: string;
    type: "document" | "question" | "response",
    title: string;
    createdAt: string;
}