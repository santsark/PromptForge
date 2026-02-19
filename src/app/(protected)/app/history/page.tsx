"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Eye, X, ChevronLeft, ChevronRight, Copy, CheckCircle2 } from "lucide-react";

interface Transaction {
    id: string;
    frameworkUsed: string;
    userQuestion: string;
    clarifyingQa: any;
    geminiPrompt: string | null;
    claudePrompt: string | null;
    deepseekPrompt: string | null;
    rankingResult: any;
    geminiCost: string;
    claudeCost: string;
    deepseekCost: string;
    openaiCost: string;
    totalCost: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const FRAMEWORKS = ["RTF", "COSTAR", "RISEN", "Chain of Thought", "APE", "TIDD-EC"];

export default function HistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [framework, setFramework] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const fetchTransactions = useCallback(async (page: number, fw: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (fw) params.set("framework", fw);
            const res = await fetch(`/api/transactions?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setTransactions(data.transactions);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions(pagination.page, framework);
    }, []);

    const handlePageChange = (newPage: number) => {
        fetchTransactions(newPage, framework);
    };

    const handleFrameworkChange = (fw: string) => {
        setFramework(fw);
        fetchTransactions(1, fw);
    };

    const getWinner = (rankingResult: any): string => {
        try {
            const data = typeof rankingResult === "string" ? JSON.parse(rankingResult) : rankingResult;
            const winnerMap: Record<string, string> = { A: "Gemini", B: "Claude", C: "DeepSeek" };
            return winnerMap[data?.winner] || data?.winner || "N/A";
        } catch {
            return "N/A";
        }
    };

    const truncate = (str: string, len: number = 60) =>
        str.length > len ? str.substring(0, len) + "…" : str;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prompt History</h1>
                    <p className="text-sm text-gray-500 mt-1">{pagination.total} total transactions</p>
                </div>

                {/* Framework Filter */}
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <select
                        value={framework}
                        onChange={(e) => handleFrameworkChange(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                        <option value="">All Frameworks</option>
                        {FRAMEWORKS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Framework</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Question</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Winner</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                        Loading...
                                    </div>
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="text-4xl">📝</div>
                                        <p className="text-gray-500 font-medium">No prompts yet</p>
                                        <p className="text-sm text-gray-400">Create your first one to see it here!</p>
                                        <a
                                            href="/app"
                                            className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                                        >
                                            Create Your First Prompt →
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                                            month: "short", day: "numeric", year: "numeric",
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {tx.frameworkUsed}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                        {truncate(tx.userQuestion)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                        {getWinner(tx.rankingResult)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                        ${parseFloat(tx.totalCost || "0").toFixed(4)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedTx(tx)}
                                            className="text-blue-600 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction Detail Modal */}
            {selectedTx && (
                <TransactionDetailModal
                    transaction={selectedTx}
                    onClose={() => setSelectedTx(null)}
                />
            )}
        </div>
    );
}

/* ========== Transaction Detail Modal ========== */

function TransactionDetailModal({
    transaction,
    onClose,
}: {
    transaction: Transaction;
    onClose: () => void;
}) {
    const [activeTab, setActiveTab] = useState<"gemini" | "claude" | "deepseek">("gemini");

    const rankingData = (() => {
        try {
            return typeof transaction.rankingResult === "string"
                ? JSON.parse(transaction.rankingResult)
                : transaction.rankingResult;
        } catch {
            return null;
        }
    })();

    const qaHistory = (() => {
        try {
            return typeof transaction.clarifyingQa === "string"
                ? JSON.parse(transaction.clarifyingQa)
                : transaction.clarifyingQa;
        } catch {
            return [];
        }
    })();

    const winnerMap: Record<string, string> = { A: "Gemini", B: "Claude", C: "DeepSeek" };

    const prompts: Record<string, { prompt: string | null; cost: string }> = {
        gemini: { prompt: transaction.geminiPrompt, cost: transaction.geminiCost },
        claude: { prompt: transaction.claudePrompt, cost: transaction.claudeCost },
        deepseek: { prompt: transaction.deepseekPrompt, cost: transaction.deepseekCost },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Transaction Detail</h2>
                        <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString()} · {transaction.frameworkUsed}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Original Question */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Original Question</h3>
                        <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border">{transaction.userQuestion}</p>
                    </div>

                    {/* Clarifying Q&A */}
                    {qaHistory && qaHistory.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Clarifying Q&A ({qaHistory.length} rounds)
                            </h3>
                            <div className="space-y-3">
                                {qaHistory.map((qa: any, i: number) => (
                                    <div key={i} className="bg-gray-50 rounded-lg p-4 border">
                                        <p className="text-sm font-medium text-blue-700 mb-1">Q: {qa.question}</p>
                                        <p className="text-sm text-gray-700">A: {qa.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generated Prompts (Tabbed) */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Generated Prompts</h3>
                        <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
                            {(["gemini", "claude", "deepseek"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {tab === "gemini" ? "Gemini" : tab === "claude" ? "Claude" : "DeepSeek"}
                                    <span className="ml-1 text-xs text-gray-400">${parseFloat(prompts[tab].cost || "0").toFixed(4)}</span>
                                </button>
                            ))}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border font-mono text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            {prompts[activeTab].prompt || "No prompt generated"}
                        </div>
                        <div className="flex justify-end mt-2">
                            <CopyButton text={prompts[activeTab].prompt || ""} />
                        </div>
                    </div>

                    {/* Ranking Result */}
                    {rankingData && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Ranking Result</h3>
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-yellow-900 mb-2">
                                    🏆 Winner: {winnerMap[rankingData.winner] || rankingData.winner || "N/A"}
                                </p>
                                {rankingData.ranking && (
                                    <p className="text-xs text-gray-600 mb-2">
                                        Ranking: {rankingData.ranking.map((r: string) => winnerMap[r] || r).join(" → ")}
                                    </p>
                                )}
                                {rankingData.scores && (
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {Object.entries(rankingData.scores).map(([key, scores]: [string, any]) => (
                                            <div key={key} className="bg-white p-2 rounded border text-xs">
                                                <p className="font-semibold text-gray-700 mb-1">{winnerMap[key] || key}</p>
                                                <p>Clarity: {scores.clarity}</p>
                                                <p>Completeness: {scores.completeness}</p>
                                                <p>Adherence: {scores.adherence}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {rankingData.explanation && (
                                    <p className="text-sm text-gray-700 italic">&quot;{rankingData.explanation}&quot;</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Cost Breakdown */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Cost Breakdown</h3>
                        <div className="overflow-hidden rounded-lg border">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Provider</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white text-sm">
                                    <tr><td className="px-4 py-2 text-gray-700">Gemini</td><td className="px-4 py-2 text-right font-mono text-gray-600">${parseFloat(transaction.geminiCost || "0").toFixed(5)}</td></tr>
                                    <tr><td className="px-4 py-2 text-gray-700">Claude</td><td className="px-4 py-2 text-right font-mono text-gray-600">${parseFloat(transaction.claudeCost || "0").toFixed(5)}</td></tr>
                                    <tr><td className="px-4 py-2 text-gray-700">DeepSeek</td><td className="px-4 py-2 text-right font-mono text-gray-600">${parseFloat(transaction.deepseekCost || "0").toFixed(5)}</td></tr>
                                    <tr><td className="px-4 py-2 text-gray-700">OpenAI (Ranking)</td><td className="px-4 py-2 text-right font-mono text-gray-600">${parseFloat(transaction.openaiCost || "0").toFixed(5)}</td></tr>
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="px-4 py-2 text-gray-900">Total</td>
                                        <td className="px-4 py-2 text-right font-mono text-gray-900">${parseFloat(transaction.totalCost || "0").toFixed(5)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-500">
            {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied! ✓" : "Copy"}
        </button>
    );
}
