import { useEffect, useState } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router'
import HomePage from './pages/Homepage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './authSlice'

function App() {

  const {isAuthenticated, loading} = useSelector((state)=>state.auth)
  const dispatch = useDispatch();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
        const checkAuthStatus = async () => {
            await dispatch(checkAuth());
            setAuthChecked(true);
        };
        checkAuthStatus();
    }, [dispatch]);

  // Show loading spinner while checking authentication
    if (!authChecked || loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-4 text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

  return (
    <>
      <Routes>
        <Route path='/' element={isAuthenticated ? <HomePage></HomePage>: <Navigate to="/signup"></Navigate>}></Route>
        <Route path="/login" element={isAuthenticated?<Navigate to="/"></Navigate>:<Login></Login>}></Route>
        <Route path="/signup" element={isAuthenticated?<Navigate to="/"></Navigate>:<Signup></Signup>}></Route>
      </Routes>
    </>
  )
}

export default App
