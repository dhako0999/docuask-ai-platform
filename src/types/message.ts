import type { AnswerSource } from "@/lib/graphql";

export type Message = {
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    mode?: "selected" | "all";
    sources?: AnswerSource[];
};
