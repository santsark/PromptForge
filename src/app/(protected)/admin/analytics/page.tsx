"use client";

import { useEffect, useState } from "react";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
    Activity, DollarSign, Users, Award, Download, ChevronRight,
    UserX, Eye
} from "lucide-react";
import Link from "next/link";

/* ========== Types ========== */
interface Summary {
    totalRuns: number;
    totalCost: string;
    activeUsers: number;
    mostPopularFramework: string;
}

interface DailyData {
    date: string;
    runs: number;
    cost: number;
}

interface FrameworkData {
    framework: string;
    runs: number;
}

interface UserData {
    userId: string;
    name: string;
    email: string;
    isActive: boolean;
    totalRuns: number;
    totalCost: string;
    lastActive: string | null;
}

/* ========== Component ========== */
export default function AdminAnalyticsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [daily, setDaily] = useState<DailyData[]>([]);
    const [byFramework, setByFramework] = useState<FrameworkData[]>([]);
    const [byUser, setByUser] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingUser, setTogglingUser] = useState<string | null>(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [summaryRes, dailyRes, fwRes, userRes] = await Promise.all([
                    fetch("/api/admin/analytics/summary"),
                    fetch("/api/admin/analytics/daily"),
                    fetch("/api/admin/analytics/by-framework"),
                    fetch("/api/admin/analytics/by-user"),
                ]);

                if (summaryRes.ok) setSummary(await summaryRes.json());
                if (dailyRes.ok) setDaily(await dailyRes.json());
                if (fwRes.ok) setByFramework(await fwRes.json());
                if (userRes.ok) setByUser(await userRes.json());
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const handleExportCSV = () => {
        const today = new Date().toISOString().split("T")[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const from = thirtyDaysAgo.toISOString().split("T")[0];
        window.open(`/api/admin/transactions/export?from=${from}&to=${today}`, "_blank");
    };

    const handleToggleUser = async (userId: string, currentlyActive: boolean) => {
        setTogglingUser(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentlyActive }),
            });
            if (res.ok) {
                setByUser((prev) =>
                    prev.map((u) =>
                        u.userId === userId ? { ...u, isActive: !currentlyActive } : u
                    )
                );
            }
        } catch (err) {
            console.error("Failed to toggle user:", err);
        } finally {
            setTogglingUser(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-gray-500">
                    <div className="h-5 w-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Loading analytics...
                </div>
            </div>
        );
    }

    // Colors for charts
    const CHART_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Platform-wide usage and cost metrics</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-medium rounded-lg shadow hover:shadow-md hover:from-emerald-600 hover:to-green-700 transition-all"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* KPI Cards */}
            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Total Runs"
                        value={summary.totalRuns.toLocaleString()}
                        icon={<Activity className="h-5 w-5" />}
                        color="blue"
                    />
                    <KPICard
                        title="Total Cost"
                        value={`$${summary.totalCost}`}
                        icon={<DollarSign className="h-5 w-5" />}
                        color="green"
                    />
                    <KPICard
                        title="Active Users (30d)"
                        value={summary.activeUsers.toLocaleString()}
                        icon={<Users className="h-5 w-5" />}
                        color="purple"
                    />
                    <KPICard
                        title="Top Framework"
                        value={summary.mostPopularFramework}
                        icon={<Award className="h-5 w-5" />}
                        color="amber"
                    />
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Runs by Framework */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Runs by Framework</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byFramework}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="framework" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                                />
                                <Bar dataKey="runs" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Daily Usage (Dual Y Axis) */}
                <div className="bg-white rounded-xl border shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Daily Usage (30 days)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                                    labelFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="runs" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 10 Users by Cost */}
                <div className="bg-white rounded-xl border shadow-sm p-6 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Top 10 Users by Total Cost</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byUser.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                                    formatter={(value: any) => [`$${parseFloat(value).toFixed(4)}`, "Total Cost"]}
                                />
                                <Bar dataKey="totalCost" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* User Detail Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">User Details</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Runs</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Active</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {byUser.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No users found.</td>
                            </tr>
                        ) : (
                            byUser.map((u) => (
                                <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{u.email}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{u.totalRuns}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600 font-mono">${u.totalCost}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">
                                        {u.lastActive
                                            ? new Date(u.lastActive).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric", year: "numeric",
                                            })
                                            : "Never"}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}>
                                            {u.isActive ? "Active" : "Disabled"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                href={`/admin/analytics?userId=${u.userId}`}
                                                className="text-blue-600 hover:text-blue-500 p-1 rounded hover:bg-blue-50 transition-colors"
                                                title="View History"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleToggleUser(u.userId, u.isActive)}
                                                disabled={togglingUser === u.userId}
                                                className={`p-1 rounded transition-colors ${u.isActive
                                                        ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        : "text-green-500 hover:text-green-700 hover:bg-green-50"
                                                    }`}
                                                title={u.isActive ? "Disable Account" : "Enable Account"}
                                            >
                                                <UserX className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ========== Sub-Components ========== */

function KPICard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: "blue" | "green" | "purple" | "amber";
}) {
    const colorMap = {
        blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600",
        green: "from-emerald-500 to-green-600 bg-green-50 text-green-600",
        purple: "from-purple-500 to-violet-600 bg-purple-50 text-purple-600",
        amber: "from-amber-500 to-orange-600 bg-amber-50 text-amber-600",
    };

    const gradient = colorMap[color].split(" ").slice(0, 2).join(" ");
    const bgLight = colorMap[color].split(" ")[2];
    const textColor = colorMap[color].split(" ")[3];

    return (
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4">
            <div className={`p-2.5 rounded-lg ${bgLight}`}>
                <div className={textColor}>{icon}</div>
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );
}
