import AppShell from "@/components/AppShell";
import ChatWindow from "@/components/ChatWindow";


export default function ChatPage() {

    return (
        <AppShell
            title="Chat"
            description="Ask questions across your uploaded documents."
        >
            <ChatWindow />

        </AppShell>
    )
}

