"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, AlertTriangle } from "lucide-react";

type QA = {
    question: string;
    answer: string;
};

export default function ClarifyPage() {
    const router = useRouter();
    const [framework, setFramework] = useState<string | null>(null);
    const [goal, setGoal] = useState<string | null>(null);
    const [qaHistory, setQaHistory] = useState<QA[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [readyToGenerate, setReadyToGenerate] = useState(false);
    const [tokens, setTokens] = useState({ input: 0, output: 0 });

    useEffect(() => {
        const fw = sessionStorage.getItem("promptforge_framework");
        const gl = sessionStorage.getItem("promptforge_goal");

        if (!fw || !gl) {
            router.push("/app");
            return;
        }

        setFramework(fw);
        setGoal(gl);

        // Initial call
        fetchQuestion(fw, gl, []);
    }, [router]);

    const fetchQuestion = async (fw: string, gl: string, history: QA[]) => {
        setLoading(true);
        setError(null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const res = await fetch("/api/clarify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    framework: fw,
                    userQuestion: gl,
                    previousQA: history,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.status === 429) {
                const data = await res.json();
                setError(data.error || "Rate limit reached. Please wait before sending more requests.");
                return;
            }

            if (res.status === 400) {
                const data = await res.json();
                setError(data.error || "Invalid input. Please check your message.");
                return;
            }

            if (!res.ok) throw new Error("Failed to fetch question");

            const data = await res.json();

            setTokens(prev => ({
                input: prev.input + data.inputTokens,
                output: prev.output + data.outputTokens
            }));

            if (data.question.includes("READY_TO_GENERATE")) {
                setReadyToGenerate(true);
            } else {
                setCurrentQuestion(data.question);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError("Request timed out. Please try again.");
            } else {
                setError("Couldn't reach AI. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!currentAnswer.trim()) return;

        const newQA = { question: currentQuestion, answer: currentAnswer };
        const updatedHistory = [...qaHistory, newQA];

        setQaHistory(updatedHistory);
        setCurrentAnswer("");

        if (framework && goal) {
            fetchQuestion(framework, goal, updatedHistory);
        }
    };

    const handleGenerate = () => {
        sessionStorage.setItem("promptforge_qa_history", JSON.stringify(qaHistory));
        sessionStorage.setItem("promptforge_tokens", JSON.stringify(tokens));
        router.push("/app/results");
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Refining Your Prompt</h1>
                <p className="text-sm text-gray-500">
                    Framework: <span className="font-medium uppercase">{framework}</span>
                </p>
            </div>

            <div className="space-y-6">
                {/* Goal */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm font-semibold text-blue-800">Your Goal:</p>
                    <p className="text-gray-700">{goal}</p>
                </div>

                {/* History */}
                {qaHistory.map((qa, idx) => (
                    <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex gap-3">
                            <div className="min-w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                AI
                            </div>
                            <div className="bg-white p-3 rounded-lg border shadow-sm text-gray-800">
                                {qa.question}
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <div className="bg-blue-600 p-3 rounded-lg text-white max-w-[80%]">
                                {qa.answer}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Current Interaction */}
                {loading ? (
                    <div className="flex gap-3 items-center text-gray-500 animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>thinking...</span>
                    </div>
                ) : readyToGenerate ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4 animate-in zoom-in duration-300">
                        <div className="text-2xl">🚀</div>
                        <h3 className="text-lg font-bold text-green-800">All set!</h3>
                        <p className="text-green-700">We have enough information to generate your prompt.</p>
                        <button
                            onClick={handleGenerate}
                            className="inline-flex justify-center rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                        >
                            Generate Prompts
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in">
                        {currentQuestion && (
                            <div className="flex gap-3">
                                <div className="min-w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                    AI
                                </div>
                                <div className="bg-white p-3 rounded-lg border shadow-sm text-gray-800 font-medium">
                                    {currentQuestion}
                                </div>
                            </div>
                        )}

                        {error ? (
                            <div className={`text-sm flex items-center gap-2 p-3 rounded-lg border ${error.toLowerCase().includes("rate limit")
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-red-50 text-red-600 border-red-200"
                                }`}>
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                                {!error.toLowerCase().includes("rate limit") && (
                                    <button onClick={() => fetchQuestion(framework!, goal!, qaHistory)} className="underline hover:opacity-80 ml-auto">Retry</button>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Type your answer..."
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    maxLength={1000}
                                    autoFocus
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!currentAnswer.trim()}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Token Tracker */}
            <div className="fixed bottom-4 right-4 text-xs text-gray-400 bg-white/80 p-2 rounded backdrop-blur border">
                Tokens: {tokens.input} in / {tokens.output} out
            </div>
        </div>
    );
}
