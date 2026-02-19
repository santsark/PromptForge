
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    const isAdmin = session.user.role === "admin";

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-[#0f172a] text-white flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        ⚡ PromptForge
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4">
                    <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompts</p>
                    <Link
                        href="/app"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                        New Prompt
                    </Link>
                    <Link
                        href="/app/history"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        History
                    </Link>

                    {isAdmin && (
                        <>
                            <div className="pt-4">
                                <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                            </div>
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-blue-300 hover:text-blue-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                Users
                            </Link>
                            <Link
                                href="/admin/analytics"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-blue-300 hover:text-blue-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                                Analytics
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="mb-3 px-4 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                            {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <p className="text-sm text-gray-200 font-medium">{session.user.name}</p>
                            <p className="text-xs text-gray-500">{isAdmin ? "Admin" : "User"}</p>
                        </div>
                    </div>
                    <form
                        action={async () => {
                            "use server";
                            await signOut();
                        }}
                    >
                        <button
                            type="submit"
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-white/5"
                        >
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
