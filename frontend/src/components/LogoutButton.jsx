// components/LogoutButton.jsx
import { useDispatch } from 'react-redux';
import { logoutUser } from '../authSlice';
import { useNavigate } from 'react-router';

export const LogoutButton = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Dispatch logout action
            await dispatch(logoutUser()).unwrap();
            // Navigate to login page after successful logout
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if API fails, you might want to navigate anyway
            navigate('/login', { replace: true });
        }
    };

    return (
        <button 
            onClick={handleLogout}
            className="btn btn-error"
        >
            Logout
        </button>
    );
};