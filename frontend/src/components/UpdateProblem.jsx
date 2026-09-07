import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Search, Edit } from 'lucide-react';
import axiosClient from '../utils/axiosClient';

export default function UpdateProblem() {
    const navigate = useNavigate();
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            const { data } = await axiosClient.get('/problem/getAllProblem');
            setProblems(data);
        } catch (error) {
            console.error('Failed to fetch problems:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProblems = problems.filter(problem =>
        problem.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin" className="btn btn-ghost btn-sm gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold">Update Problem</h1>
            </div>

            {/* Search Bar */}
            <div className="card bg-base-100 shadow-lg p-6 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-base-content/40" />
                        <input
                            type="text"
                            placeholder="Search problems by title..."
                            className="input input-bordered w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Problems List */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : filteredProblems.length === 0 ? (
                        <div className="text-center py-10 text-base-content/60">
                            {searchTerm ? 'No problems found matching your search.' : 'No problems available to update.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Difficulty</th>
                                        <th>Tags</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProblems.map((problem) => (
                                        <tr key={problem._id}>
                                            <td className="font-medium">{problem.title}</td>
                                            <td>
                                                <span className={`badge ${
                                                    problem.difficulty === 'easy' ? 'badge-success' :
                                                    problem.difficulty === 'medium' ? 'badge-warning' :
                                                    'badge-error'
                                                }`}>
                                                    {problem.difficulty}
                                                </span>
                                            </td>
                                            <td>{problem.tags}</td>
                                            <td>
                                                <button
                                                    className="btn btn-primary btn-sm gap-1"
                                                    onClick={() => navigate(`/admin/update/${problem._id}`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}