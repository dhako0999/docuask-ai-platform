export type UploadedDocument = {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
    status: "uploading" | "processing" | "ready" | "failed";
    content: string;

};