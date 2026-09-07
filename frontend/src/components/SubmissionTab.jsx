import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";

export default function SubmissionTab({ problemId }) {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showCodeModal, setShowCodeModal] = useState(false);

    useEffect(() => {
        const fetchSubmissions = async () => {
            setLoading(true);
            try {
                const { data } = await axiosClient.get(`problem/submittedProblem/${problemId}`);
                console.log(data);
                setSubmissions(data);
            } catch (error) {
                console.error("Failed to fetch submissions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [problemId]);

    const handleViewCode = (submission) => {
        setSelectedSubmission(submission);
        setShowCodeModal(true);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Your Submissions</h2>
            {loading ? (
                <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-md"></span>
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-base-content/60 text-center py-10">
                    No submissions yet for this problem.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-sm table-zebra">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Language</th>
                                <th>Runtime</th>
                                <th>Memory</th>
                                <th>Submitted At</th>
                                <th>Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((submission, index) => (
                                <tr key={submission._id || index}>
                                    <td>
                                        <span className={`badge ${submission.status === "accepted" ? "badge-success" : "badge-error"} badge-sm`}>
                                            {submission.status}
                                        </span>
                                    </td>
                                    <td>{submission.language}</td>
                                    <td>{submission.runtime ? `${submission.runtime}s` : "-"}</td>
                                    <td>{submission.memory ? `${(submission.memory / 1024).toFixed(1)} MB` : "-"}</td>
                                    <td>{new Date(submission.createdAt).toLocaleString()}</td>
                                    <td>
                                        <button 
                                            className="btn btn-xs btn-outline btn-primary"
                                            onClick={() => handleViewCode(submission)}
                                        >
                                            View Code
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Code Modal */}
            {showCodeModal && selectedSubmission && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">
                                Submitted Code
                            </h3>
                            <button 
                                className="btn btn-sm btn-circle btn-ghost"
                                onClick={() => setShowCodeModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="mb-4 flex gap-4 text-sm text-base-content/70">
                            <span>
                                <strong>Language:</strong> {selectedSubmission.language}
                            </span>
                            <span>
                                <strong>Status:</strong> 
                                <span className={`badge ${selectedSubmission.status === "accepted" ? "badge-success" : "badge-error"} badge-sm ml-2`}>
                                    {selectedSubmission.status}
                                </span>
                            </span>
                            <span>
                                <strong>Submitted:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}
                            </span>
                        </div>

                        <div className="mockup-code bg-base-200 p-4 rounded-lg overflow-auto max-h-96">
                            <pre className="whitespace-pre-wrap">
                                <code>{selectedSubmission.code || "No code available"}</code>
                            </pre>
                        </div>

                        <div className="modal-action">
                            <button 
                                className="btn"
                                onClick={() => setShowCodeModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}