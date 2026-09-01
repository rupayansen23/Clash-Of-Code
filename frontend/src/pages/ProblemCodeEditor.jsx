import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axiosClient from "../utils/axiosClient";

// Zod Schema for Custom Test Case Form
const testCaseSchema = z.object({
    input: z.string().min(1, "Input is required"),
    expected: z.string().min(1, "Expected output is required"),
});

const decodeBase64 = (str) => {
    if (!str) return "";
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        return str;
    }
};

export default function ProblemCodeEditor() {
    const { id } = useParams();

    // --- State ---
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState("javascript");
    const [initialCode, setInitialCode] = useState(""); // used as defaultValue for editor
    const [testCases, setTestCases] = useState([]);
    const [results, setResults] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeBottomTab, setActiveBottomTab] = useState("testcases");

    // --- Editor ref ---
    const editorRef = useRef(null);

    // --- React Hook Form for Custom Test Case ---
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(testCaseSchema),
    });

    // --- 1. Fetch Problem Data ---
    useEffect(() => {
        setLoading(true);
        const fetchProblem = async () => {
            try {
                const { data } = await axiosClient.get(`problem/getProblemById/${id}`);
                setProblem(data);
                setTestCases(
                    data.visibleTestCases?.map((tc) => ({
                        input: tc.input,
                        expected: tc.output,
                    })) || []
                );
                // Set initial code after problem loads (editor isn't mounted yet)
                const starter = getStarterCode(data, language);
                setInitialCode(starter);
                setLoading(false);
            } catch (error) {
                alert("Failed to fetch problem: " + error);
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id]);

    // Helper to extract starter code for a given language
    const getStarterCode = (problemData, lang) => {
        if (!problemData?.startCode) return "";
        const languageMap = {
            cpp: "C++",
            java: "Java",
            python: "Python",
            javascript: "JavaScript",
        };
        const starter = problemData.startCode.find(
            (item) => item.language === languageMap[lang]
        );
        return starter?.initialCode || "";
    };

    // --- 2. Update Editor when Language Changes ---
    useEffect(() => {
        const newCode = getStarterCode(problem, language);
        setInitialCode(newCode);
        if (editorRef.current) {
            editorRef.current.setValue(newCode);
        }
    }, [language, problem]);

    // --- 3. Monaco Language Mapping ---
    const getMonacoLanguage = (lang) => {
        const map = {
            javascript: "javascript",
            python: "python",
            java: "java",
            cpp: "cpp",
        };
        return map[lang] || "plaintext";
    };

    // --- 4. Editor onMount ---
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        // If initialCode was set before mount, apply it (should already be in defaultValue)
    };

    // --- 5. Run Handler ---
    const onRun = async () => {
        const code = editorRef.current?.getValue() || "";
        if (!code.trim()) return;
        setIsRunning(true);
        setResults(null);
        setActiveBottomTab("output");

        try {
            const languageMap = {
                cpp: "C++",
                java: "Java",
                python: "Python",
                javascript: "JavaScript",
            };
            const response = await axiosClient.post(`submission/run/${id}`, {
                language: languageMap[language] || language,
                code: code,
            });

            const apiResults = response.data;
            const transformedResults = {
                status: apiResults.some(r => r.status?.description === "Accepted") ? "completed" : "error",
                output: apiResults.length > 0
                    ? `${apiResults.filter(r => r.status?.description === "Accepted").length} passed, ${apiResults.filter(r => r.status?.description !== "Accepted").length} failed`
                    : "No test cases executed",
                results: apiResults.map((r, index) => ({
                    input: decodeURIComponent(escape(atob(r.stdin || ""))),
                    expected: decodeURIComponent(escape(atob(r.expected_output || ""))),
                    actual: decodeURIComponent(escape(atob(r.stdout || ""))),
                    passed: r.status?.description === "Accepted",
                    status: r.status?.description,
                    time: r.time,
                    memory: r.memory,
                })),
                passedCount: apiResults.filter(r => r.status?.description === "Accepted").length,
                totalCount: apiResults.length,
                runtime: apiResults[0]?.time,
                memory: apiResults[0]?.memory ? `${(apiResults[0].memory / 1024).toFixed(1)} MB` : undefined,
            };
            setResults(transformedResults);
        } catch (error) {
            setResults({
                status: "error",
                output: error.response?.data?.message || "Execution failed",
                results: [],
            });
        }
        setIsRunning(false);
    };

    // --- 6. Submit Handler ---
    const onSubmitCode = async () => {
        const code = editorRef.current?.getValue() || "";
        if (!code.trim()) return;
        setIsSubmitting(true);
        setResults(null);
        setActiveBottomTab("output");

        try {
            const languageMap = {
                cpp: "c++",
                java: "java",
                python: "python",
                javascript: "javascript",
            };
            const response = await axiosClient.post(`submission/submit/${id}`, {
                language: languageMap[language] || language,
                code: code,
            });

            const apiResult = response.data;
            const transformedResults = {
                status: apiResult.status === "accepted" ? "completed" : "error",
                output: apiResult.status === "accepted"
                    ? "All test cases passed!"
                    : apiResult.errorMessage || `Failed: ${apiResult.status}`,
                passedCount: apiResult.testCasesPassed,
                totalCount: apiResult.testCasesTotal,
                runtime: apiResult.runtime ? `${apiResult.runtime}s` : undefined,
                memory: apiResult.memory ? `${(apiResult.memory / 1024).toFixed(1)} MB` : undefined,
                results: [],
            };
            setResults(transformedResults);
        } catch (error) {
            setResults({
                status: "error",
                output: error.response?.data?.message || error.message || "Submission failed",
                results: [],
            });
        }
        setIsSubmitting(false);
    };

    // --- 7. Add Custom Test Case ---
    const onAddCustomTestCase = (data) => {
        setTestCases((prev) => [...prev, { input: data.input, expected: data.expected }]);
        reset();
        document.getElementById("custom_test_modal").close();
    };

    // --- 8. Helpers ---
    const getDifficultyColor = (diff) => {
        switch (diff?.toLowerCase()) {
            case "easy": return "badge-success";
            case "medium": return "badge-warning";
            case "hard": return "badge-error";
            default: return "badge-ghost";
        }
    };

    // --- 9. Loading & Error States ---
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="alert alert-error">Problem not found!</div>
            </div>
        );
    }

    // --- 10. Main Render ---
    return (
        <div className="flex h-screen overflow-hidden bg-base-200">
            {/* LEFT PANEL: Description (unchanged) */}
            <div className="w-1/2 h-full overflow-y-auto p-6 bg-base-100 border-r border-base-300">
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl font-bold">{problem.title}</h1>
                    <div className={`badge ${getDifficultyColor(problem.difficulty)} text-white`}>
                        {problem.difficulty}
                    </div>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline && match ? (
                                    <pre className="bg-base-300 p-4 rounded-lg overflow-x-auto">
                                        <code className={className} {...props}>{children}</code>
                                    </pre>
                                ) : (
                                    <code className="bg-base-300 px-1 py-0.5 rounded text-error" {...props}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {problem.description}
                    </ReactMarkdown>
                </div>
            </div>

            {/* RIGHT PANEL: Editor */}
            <div className="w-1/2 h-full flex flex-col bg-base-100">
                {/* Toolbar */}
                <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-200">
                    <div className="flex items-center gap-2">
                        <label className="font-semibold text-sm">Language:</label>
                        <select
                            className="select select-bordered select-sm w-36"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="cpp">C++</option>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={onRun}
                            disabled={isRunning || isSubmitting}
                        >
                            {isRunning ? <span className="loading loading-spinner loading-xs"></span> : "▶ Run"}
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={onSubmitCode}
                            disabled={isRunning || isSubmitting}
                        >
                            {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : "✓ Submit"}
                        </button>
                    </div>
                </div>

                {/* Monaco Editor - uncontrolled, using defaultValue and onMount */}
                <div className="flex-1 min-h-0">
                    <Editor
                        height="100%"
                        language={getMonacoLanguage(language)}
                        defaultValue={initialCode}
                        onMount={handleEditorDidMount}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: "on",
                        }}
                    />
                </div>

                {/* Bottom Panel (Test Cases & Output) - unchanged */}
                <div className="h-1/3 border-t border-base-300 bg-base-200 flex flex-col">
                    <div className="flex border-b border-base-300">
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeBottomTab === "testcases"
                                ? "border-b-2 border-primary text-primary"
                                : "text-base-content/70 hover:text-base-content"
                                }`}
                            onClick={() => setActiveBottomTab("testcases")}
                        >
                            Test Cases ({testCases.length})
                        </button>
                        <button
                            className={`px-4 py-2 text-sm font-medium ${activeBottomTab === "output"
                                ? "border-b-2 border-primary text-primary"
                                : "text-base-content/70 hover:text-base-content"
                                }`}
                            onClick={() => setActiveBottomTab("output")}
                        >
                            Output
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {activeBottomTab === "testcases" && (
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium">Default & Custom Test Cases</span>
                                    <button
                                        className="btn btn-ghost btn-xs"
                                        onClick={() => document.getElementById("custom_test_modal").showModal()}
                                    >
                                        + Add Custom
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {testCases.map((tc, idx) => {
                                        const result = results?.results?.find(
                                            (r) => r.input === tc.input && r.expected === tc.expected
                                        );
                                        const passed = result?.passed;
                                        return (
                                            <div
                                                key={idx}
                                                className={`collapse collapse-arrow bg-base-100 border ${passed === undefined
                                                    ? "border-base-300"
                                                    : passed
                                                        ? "border-success"
                                                        : "border-error"
                                                    }`}
                                            >
                                                <input type="checkbox" defaultChecked={idx === 0} />
                                                <div className="collapse-title text-sm font-medium flex items-center gap-2">
                                                    {passed !== undefined && (
                                                        <span className={`badge ${passed ? "badge-success" : "badge-error"} badge-sm`}>
                                                            {passed ? "✔" : "✗"}
                                                        </span>
                                                    )}
                                                    <span>Case {idx + 1}</span>
                                                </div>
                                                <div className="collapse-content text-xs font-mono space-y-1">
                                                    <div><span className="font-semibold">Input: </span><code className="bg-base-300 px-1 rounded">{tc.input}</code></div>
                                                    <div><span className="font-semibold">Expected: </span><code className="bg-base-300 px-1 rounded">{tc.expected}</code></div>
                                                    {result && (
                                                        <div>
                                                            <span className="font-semibold">Actual: </span>
                                                            <code className={`px-1 rounded ${result.passed ? "text-success" : "text-error"}`}>
                                                                {result.actual}
                                                            </code>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {activeBottomTab === "output" && (
                            <div className="h-full">
                                {results ? (
                                    <div>
                                        <div className={`badge ${results.status === "error" ? "badge-error" : "badge-success"} mb-2`}>
                                            {results.status === "error" ? "Failed" : "Success"}
                                        </div>
                                        <pre className="whitespace-pre-wrap text-sm font-mono bg-base-100 p-3 rounded-lg border border-base-300">
                                            {results.output}
                                        </pre>
                                        {results.passedCount !== undefined && (
                                            <div className="mt-2 text-sm">
                                                <p>Passed: {results.passedCount} / {results.totalCount} tests</p>
                                                {results.runtime && <p>Runtime: {results.runtime}</p>}
                                                {results.memory && <p>Memory: {results.memory}</p>}
                                            </div>
                                        )}
                                        {results.results && results.results.length > 0 && (
                                            <div className="mt-2 text-sm">
                                                <span className="font-semibold">Detailed results: </span>
                                                <span>
                                                    {results.results.filter((r) => r.passed).length} passed,{" "}
                                                    {results.results.filter((r) => !r.passed).length} failed
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-base-content/50 text-sm flex items-center justify-center h-full">
                                        Run your code to see output here.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Add Custom Test Case - unchanged */}
            <dialog id="custom_test_modal" className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">Add Custom Test Case</h3>
                    <form onSubmit={handleSubmit(onAddCustomTestCase)} className="space-y-4">
                        <div>
                            <label className="label"><span className="label-text">Input</span></label>
                            <input
                                type="text"
                                placeholder='e.g. "[2,7,11,15], 9"'
                                className={`input input-bordered w-full ${errors.input ? "input-error" : ""}`}
                                {...register("input")}
                            />
                            {errors.input && <span className="text-error text-xs">{errors.input.message}</span>}
                        </div>
                        <div>
                            <label className="label"><span className="label-text">Expected Output</span></label>
                            <input
                                type="text"
                                placeholder='e.g. "[0,1]"'
                                className={`input input-bordered w-full ${errors.expected ? "input-error" : ""}`}
                                {...register("expected")}
                            />
                            {errors.expected && <span className="text-error text-xs">{errors.expected.message}</span>}
                        </div>
                        <div className="modal-action">
                            <button type="submit" className="btn btn-primary">Add Case</button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    reset();
                                    document.getElementById("custom_test_modal").close();
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>
    );
}