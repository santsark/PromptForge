"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Briefcase,
    MessageSquare,
    FileText,
    Zap,
    BrainCircuit,
    Layers,
    X,
} from "lucide-react";

type Framework = {
    id: string;
    name: string;
    description: string;
    useCases: string[];
    icon: React.ElementType;
};

const FRAMEWORKS: Framework[] = [
    {
        id: "rtf",
        name: "RTF",
        description: "Role, Task, Format",
        useCases: ["Quick tasks", "Emails", "Summaries"],
        icon: Zap,
    },
    {
        id: "costar",
        name: "COSTAR",
        description: "Context, Objective, Style, Tone, Audience, Response",
        useCases: ["Communications", "Marketing"],
        icon: MessageSquare,
    },
    {
        id: "risen",
        name: "RISEN",
        description: "Role, Instructions, Steps, End Goal, Narrowing",
        useCases: ["SOPs", "Research", "Documentation"],
        icon: FileText,
    },
    {
        id: "crispe",
        name: "CRISPE",
        description: "Capacity, Request, Insight, Statement, Personality, Experiment",
        useCases: ["Strategic content", "Complex requests"],
        icon: Briefcase,
    },
    {
        id: "cot",
        name: "Chain of Thought",
        description: "Step-by-step reasoning",
        useCases: ["Analysis", "Reasoning", "Complex decisions"],
        icon: BrainCircuit,
    },
    {
        id: "fewshot",
        name: "Few-Shot",
        description: "Providing examples to guide output",
        useCases: ["Standardizing outputs", "Data classification"],
        icon: Layers,
    },
];

export default function FrameworkSelector({ userName }: { userName: string }) {
    const router = useRouter();
    const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
    const [goal, setGoal] = useState("");
    const [showOnboarding, setShowOnboarding] = useState(() => {
        if (typeof window !== "undefined") {
            return !localStorage.getItem("promptforge_onboarded");
        }
        return false;
    });

    // Memoize framework cards so they don't re-render on goal typing
    const frameworkCards = useMemo(() => FRAMEWORKS.map((fw) => {
        const Icon = fw.icon;
        return { ...fw, Icon };
    }), []);

    const handleStart = () => {
        if (!selectedFramework || !goal.trim()) return;

        // Save to sessionStorage
        sessionStorage.setItem("promptforge_framework", selectedFramework);
        sessionStorage.setItem("promptforge_goal", goal);

        // Dismiss onboarding
        if (showOnboarding) {
            localStorage.setItem("promptforge_onboarded", "true");
            setShowOnboarding(false);
        }

        // Navigate to clarify page
        router.push("/app/clarify");
    };

    return (
        <div className="space-y-8">
            {/* Onboarding Tooltip */}
            {showOnboarding && (
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                    <button
                        onClick={() => {
                            localStorage.setItem("promptforge_onboarded", "true");
                            setShowOnboarding(false);
                        }}
                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <h3 className="font-bold text-lg mb-2">👋 Welcome to PromptForge!</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-100">
                        <li><strong className="text-white">Select a framework</strong> below that fits your task</li>
                        <li><strong className="text-white">Describe your task</strong> in plain language</li>
                        <li><strong className="text-white">Answer a few clarifying questions</strong> from the AI</li>
                        <li><strong className="text-white">Get 3 AI-generated prompts</strong>, automatically ranked!</li>
                    </ol>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Welcome, {userName}.
                </h2>
                <p className="mt-2 text-gray-600">
                    Select a framework to get started with your new prompt.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {frameworkCards.map((fw) => {
                    const { Icon } = fw;
                    const isSelected = selectedFramework === fw.id;
                    return (
                        <div
                            key={fw.id}
                            onClick={() => setSelectedFramework(fw.id)}
                            className={`cursor-pointer rounded-lg border p-6 transition-all hover:shadow-md ${isSelected
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50"
                                : "border-gray-200 bg-white hover:border-blue-300"
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`rounded-md p-2 ${isSelected ? "bg-blue-200 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{fw.name}</h3>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">{fw.description}</p>
                            <div className="mt-4">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Best For</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {fw.useCases.map((uc) => (
                                        <span
                                            key={uc}
                                            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                                        >
                                            {uc}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedFramework && (
                <div className="rounded-lg bg-gray-50 p-6 border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label htmlFor="goal" className="block text-sm font-medium leading-6 text-gray-900">
                        Describe what you want to do (in plain language)
                    </label>
                    <div className="mt-2 relative">
                        <textarea
                            id="goal"
                            name="goal"
                            rows={4}
                            maxLength={2000}
                            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="e.g. I need to write a performance review for a software engineer who met most goals but had attendance issues"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />
                        <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                            {goal.length}/2000
                        </span>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleStart}
                            disabled={!goal.trim()}
                            className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Start &rarr;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
