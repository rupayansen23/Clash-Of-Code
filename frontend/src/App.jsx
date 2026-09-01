import { useEffect, useState } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router'
import HomePage from './pages/Homepage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './authSlice'
import AdminPanel from './pages/AdminPanel'
import ProblemCodeEditor from './pages/ProblemCodeEditor'

function App() {

  const {isAuthenticated, loading, user} = useSelector((state)=>state.auth)
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
        <Route path="/problem/:id" element={isAuthenticated?<ProblemCodeEditor></ProblemCodeEditor>:<Login></Login>}></Route>
        <Route path="/admin" element={
          isAuthenticated && user.role === 'admin'?
          <AdminPanel></AdminPanel> : <Navigate to="/"></Navigate>
          }></Route>
      </Routes>
    </>
  )
}

export default App
