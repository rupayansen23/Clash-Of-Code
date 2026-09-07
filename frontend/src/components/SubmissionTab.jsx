import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosClient";

export default function SubmissionTab({ problemId }) {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
