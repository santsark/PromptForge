"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Copy, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

export default function ResultsPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"generating" | "ranking" | "saving" | "complete">("generating");
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [rankingFailed, setRankingFailed] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const runProcess = async () => {
            try {
                // 1. Load Context
                const framework = sessionStorage.getItem("promptforge_framework");
                const userQuestion = sessionStorage.getItem("promptforge_goal");
                const qaHistory = JSON.parse(sessionStorage.getItem("promptforge_qa_history") || "[]");
                const clarifyTokens = JSON.parse(sessionStorage.getItem("promptforge_tokens") || '{"input":0,"output":0}');

                // Estimate Clarify Cost (Claude Haiku)
                const clarifyCost = (clarifyTokens.input / 1000000) * 0.25 + (clarifyTokens.output / 1000000) * 1.25;

                if (!framework || !userQuestion) {
                    router.push("/app");
                    return;
                }

                // 2. Generate
                const genRes = await fetch("/api/generate", {
                    method: "POST",
                    body: JSON.stringify({ framework, userQuestion, qaHistory })
                });

                if (genRes.status === 429) {
                    const errData = await genRes.json();
                    setError(errData.error || "Rate limit reached. Please wait before generating more prompts.");
                    return;
                }
                if (!genRes.ok) {
                    const errData = await genRes.json().catch(() => ({}));
                    throw new Error(errData.error || "Generation Failed");
                }

                const prompts = await genRes.json();

                // Check for per-provider failures
                const failedProviders = [];
                if (prompts.gemini?.error) failedProviders.push("Gemini");
                if (prompts.claude?.error) failedProviders.push("Claude");
                if (prompts.deepseek?.error) failedProviders.push("DeepSeek");

                if (failedProviders.length === 3) {
                    throw new Error("All LLM providers failed. Please try again.");
                }

                setStatus("ranking");

                // 3. Rank — but gracefully handle failure
                let rankingData = null;
                try {
                    const rankRes = await fetch("/api/rank", {
                        method: "POST",
                        body: JSON.stringify({ framework, userQuestion, prompts })
                    });

                    if (rankRes.status === 429) {
                        setRankingFailed(true);
                    } else if (!rankRes.ok) {
                        setRankingFailed(true);
                    } else {
                        rankingData = await rankRes.json();
                    }
                } catch {
                    setRankingFailed(true);
                }

                setStatus("saving");

                // 4. Save (best effort)
                try {
                    await fetch("/api/transactions/save", {
                        method: "POST",
                        body: JSON.stringify({
                            framework,
                            userQuestion,
                            qaHistory,
                            prompts: {
                                gemini: { prompt: prompts.gemini?.prompt || "Failed", cost: prompts.gemini?.cost || 0 },
                                claude: { prompt: prompts.claude?.prompt || "Failed", cost: prompts.claude?.cost || 0 },
                                deepseek: { prompt: prompts.deepseek?.prompt || "Failed", cost: prompts.deepseek?.cost || 0 },
                            },
                            ranking: rankingData?.evaluation || {},
                            costs: {
                                gemini: prompts.gemini?.cost || 0,
                                claude: prompts.claude?.cost || 0,
                                deepseek: prompts.deepseek?.cost || 0,
                                ranking: rankingData?.cost || 0,
                                clarify: clarifyCost
                            }
                        })
                    });
                } catch {
                    console.error("Save failed (non-blocking)");
                }

                setData({ prompts, ranking: rankingData, clarifyCost, clarifyTokens, failedProviders });
                setStatus("complete");

            } catch (err: any) {
                console.error(err);
                setError(err.message || "An error occurred during generation. Please try again.");
            }
        };

        runProcess();
    }, [router]);

    if (error) {
        const isRateLimit = error.toLowerCase().includes("rate limit");
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <div className={`${isRateLimit ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200"} p-6 rounded-xl flex flex-col items-center gap-3 border`}>
                    {isRateLimit ? <AlertTriangle className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                    <p className="font-medium">{error}</p>
                </div>
                <div className="flex gap-3 justify-center mt-6">
                    <button
                        onClick={() => router.push("/app")}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Start New Prompt
                    </button>
                    {!isRateLimit && (
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (status !== "complete" || !data) {
        return (
            <div className="max-w-xl mx-auto mt-20 space-y-8">
                <h2 className="text-2xl font-bold text-center text-gray-800">Reviewing your prompt...</h2>
                <div className="space-y-4">
                    <Step label="Generating Prompts (Gemini, Claude, DeepSeek)" active={status === "generating"} completed={status !== "generating"} />
                    <Step label="Ranking with GPT-4o" active={status === "ranking"} completed={status === "saving" || status === "complete"} />
                    <Step label="Finalizing & Saving" active={status === "saving"} completed={status === "complete"} />
                </div>
            </div>
        );
    }

    const { prompts, ranking, clarifyCost, clarifyTokens, failedProviders } = data;
    const evalData = ranking?.evaluation;

    // Map winner letter (A/B/C) to provider key
    const winnerMap: Record<string, string> = { "A": "gemini", "B": "claude", "C": "deepseek" };
    const winnerKey = evalData ? winnerMap[evalData.winner] : null;
    const winnerPrompt = winnerKey ? prompts[winnerKey] : null;
    const winnerName = winnerKey === "gemini" ? "Gemini 2.0 Flash" : winnerKey === "claude" ? "Claude 3 Haiku" : winnerKey === "deepseek" ? "DeepSeek Chat" : null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Generation Results</h1>
                    <p className="text-gray-500 text-sm">Framework: {sessionStorage.getItem("promptforge_framework")}</p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Total Cost: ${((prompts.gemini?.cost || 0) + (prompts.claude?.cost || 0) + (prompts.deepseek?.cost || 0) + (ranking?.cost || 0) + clarifyCost).toFixed(4)}
                </div>
            </div>

            {/* Failed Provider Warning */}
            {failedProviders && failedProviders.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{failedProviders.join(", ")} generation failed. Showing available results.</p>
                </div>
            )}

            {/* Winner Banner */}
            {winnerPrompt && !rankingFailed ? (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">🏆</span>
                        <h2 className="text-xl font-bold text-yellow-900">Winner: {winnerName}</h2>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-yellow-100 shadow-inner font-mono text-sm text-gray-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {winnerPrompt.prompt}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <CopyButton text={winnerPrompt.prompt} />
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h2 className="text-lg font-bold text-amber-800">Ranking Unavailable</h2>
                    </div>
                    <p className="text-amber-700 text-sm mt-2">The ranking service couldn&apos;t be reached. Your prompts are still available below — pick the one you like best!</p>
                </div>
            )}

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PromptCard
                    title="Gemini 2.0 Flash"
                    prompt={prompts.gemini}
                    rank={evalData ? evalData.ranking.indexOf("A") + 1 : null}
                    scores={evalData?.scores?.A}
                    failed={!!prompts.gemini?.error}
                />
                <PromptCard
                    title="Claude 3 Haiku"
                    prompt={prompts.claude}
                    rank={evalData ? evalData.ranking.indexOf("B") + 1 : null}
                    scores={evalData?.scores?.B}
                    failed={!!prompts.claude?.error}
                />
                <PromptCard
                    title="DeepSeek Chat"
                    prompt={prompts.deepseek}
                    rank={evalData ? evalData.ranking.indexOf("C") + 1 : null}
                    scores={evalData?.scores?.C}
                    failed={!!prompts.deepseek?.error}
                />
            </div>

            {/* Explanation */}
            {evalData?.explanation && (
                <div className="bg-gray-50 rounded-lg p-6 border">
                    <h3 className="font-semibold text-gray-900 mb-2">GPT-4o Evaluation</h3>
                    <p className="text-gray-700 italic">&quot;{evalData.explanation}&quot;</p>
                </div>
            )}

            {/* Cost Breakdown */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Provider</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tokens In</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tokens Out</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white text-sm">
                        <CostRow provider="Claude (Clarify)" tokens={clarifyTokens} cost={clarifyCost} />
                        {!prompts.gemini?.error && <CostRow provider="Gemini (Gen)" tokens={prompts.gemini.tokens} cost={prompts.gemini.cost} />}
                        {!prompts.claude?.error && <CostRow provider="Claude (Gen)" tokens={prompts.claude.tokens} cost={prompts.claude.cost} />}
                        {!prompts.deepseek?.error && <CostRow provider="DeepSeek (Gen)" tokens={prompts.deepseek.tokens} cost={prompts.deepseek.cost} />}
                        {ranking && <CostRow provider="OpenAI (Rank)" tokens={ranking.tokens} cost={ranking.cost} />}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center pt-8">
                <button
                    onClick={() => router.push("/app")}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-500 transition-all"
                >
                    Start New Prompt
                </button>
            </div>

        </div>
    );
}

function Step({ label, active, completed }: { label: string, active: boolean, completed: boolean }) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${active ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100"}`}>
            {completed ? (
                <CheckCircle2 className="text-green-500 h-5 w-5" />
            ) : active ? (
                <Loader2 className="animate-spin text-blue-500 h-5 w-5" />
            ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
            )}
            <span className={`font-medium ${active ? "text-blue-700" : completed ? "text-green-700" : "text-gray-400"}`}>
                {label}
            </span>
        </div>
    )
}

function PromptCard({ title, prompt, rank, scores, failed }: any) {
    if (failed) {
        return (
            <div className="rounded-lg border shadow-sm p-4 bg-red-50 border-red-200">
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Generation failed for this provider.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border shadow-sm p-4 flex flex-col h-full bg-white relative overflow-hidden">
            <div className="flex justify-between items-start mb-3 mt-1">
                <h3 className="font-bold text-gray-900">{title}</h3>
                {rank && (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${rank === 1 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>
                        Rank #{rank}
                    </span>
                )}
            </div>

            {scores && (
                <div className="flex flex-wrap gap-1 mb-3">
                    <Badge label="Clarity" score={scores.clarity} />
                    <Badge label="Complete" score={scores.completeness} />
                    <Badge label="Adhere" score={scores.adherence} />
                </div>
            )}

            <div className="flex-1 bg-gray-50 p-3 rounded border text-xs font-mono text-gray-700 overflow-y-auto max-h-48 mb-3 whitespace-pre-wrap">
                {prompt.prompt}
            </div>

            <div className="flex justify-between items-center mt-auto">
                <span className="text-xs text-gray-400">${(prompt.cost || 0).toFixed(5)}</span>
                <CopyButton text={prompt.prompt || ""} />
            </div>
        </div>
    )
}

function Badge({ label, score }: any) {
    return (
        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border">
            {label}: {score}
        </span>
    )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (
        <button onClick={copy} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500">
            {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied! ✓" : "Copy"}
        </button>
    )
}

function CostRow({ provider, tokens, cost }: any) {
    return (
        <tr>
            <td className="whitespace-nowrap py-2 pl-4 pr-3 text-gray-900">{provider}</td>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{tokens?.input || 0}</td>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500">{tokens?.output || 0}</td>
            <td className="whitespace-nowrap px-3 py-2 text-gray-500 font-mono">${(cost || 0).toFixed(5)}</td>
        </tr>
    )
}
