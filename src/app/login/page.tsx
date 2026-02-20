"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Zap, Shield, BarChart3, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const signedOut = searchParams.get("signedOut") === "true";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setLoading(false);
            } else {
                router.push("/app");
            }
        } catch (err) {
            setError("An unexpected error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* LEFT PANEL - Hero / Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] relative overflow-hidden">
                {/* Subtle grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                {/* Gradient accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-600/10 to-transparent" />

                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Top: Logo + App Name */}
                    <div className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="PromptForge Logo"
                            width={48}
                            height={48}
                            className="rounded-lg"
                        />
                        <span className="text-white text-xl font-bold tracking-tight">
                            PromptForge
                        </span>
                    </div>

                    {/* Middle: Hero Content */}
                    <div className="max-w-lg">
                        <p className="text-blue-400 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                            Enterprise Prompt Engineering
                        </p>
                        <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
                            Craft better AI prompts.{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                Faster. Smarter.
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed mb-10">
                            Select a framework, describe your task, and let three leading AI
                            models compete to write the best prompt — then see them ranked
                            side by side.
                        </p>

                        {/* Feature pills */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Zap className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">6 Proven Frameworks</p>
                                    <p className="text-slate-500 text-xs">RTF, COSTAR, RISEN, CRISPE, CoT, Few-Shot</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Shield className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">3 AI Models, Ranked</p>
                                    <p className="text-slate-500 text-xs">Gemini, Claude, and DeepSeek compete on every prompt</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                    <BarChart3 className="h-4 w-4 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium">Full Cost Tracking</p>
                                    <p className="text-slate-500 text-xs">Token usage and costs tracked per generation</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Footer */}
                    <p className="text-slate-600 text-xs">
                        Developed by Santanu Sarkar
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL - Login Form */}
            <div className="flex flex-1 items-center justify-center bg-gray-50 p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo (hidden on desktop) */}
                    <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
                        <Image
                            src="/logo.png"
                            alt="PromptForge Logo"
                            width={40}
                            height={40}
                            className="rounded-lg"
                        />
                        <span className="text-gray-900 text-xl font-bold">PromptForge</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Sign in to access your prompt workspace
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {signedOut && (
                            <div className="rounded-lg bg-green-50 border border-green-200 p-3.5 text-sm text-green-700 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                You&apos;ve been signed out successfully.
                            </div>
                        )}
                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none sm:text-sm transition-shadow"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none sm:text-sm transition-shadow"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-400 text-center">
                            Protected by enterprise-grade authentication.
                            <br />
                            Contact your admin for access.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
