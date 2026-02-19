
import { auth } from "@/auth";
import FrameworkSelector from "@/components/framework-selector";

export default async function AppPage() {
    const session = await auth();

    return (
        <div className="max-w-5xl mx-auto">
            <FrameworkSelector userName={session?.user?.name || "User"} />
        </div>
    );
}
