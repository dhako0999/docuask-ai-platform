import AppShell from "@/components/AppShell";
import UploadBox from "@/components/UploadBox";

export default function UploadPage() {
    return (
        <AppShell
            title="Upload a document here"
            description="Uploaded documents are presented here..."
        >
           <UploadBox />
        </AppShell>
    )
}

