import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../authSlice';

export default function Navbar() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    return (
        <nav className="navbar bg-base-100 shadow-lg px-4">
            <div className="flex-1">
                <NavLink to="/" className="btn btn-ghost text-xl">Clash Of Code</NavLink>
            </div>
            <div className="flex-none gap-4">
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} className="btn btn-ghost">
                        {user?.firstName}
                    </div>
                    <ul className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                        <li><button onClick={handleLogout}>Logout</button></li>
                        {user?.role === 'admin' && <li><NavLink to="/admin">Admin</NavLink></li>}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
