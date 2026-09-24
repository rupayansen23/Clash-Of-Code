import { useEffect, useState } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router'
import HomePage from './pages/Homepage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './authSlice'
import ProblemCodeEditor from './pages/ProblemCodeEditor'
import AdminHome from './pages/AdminHome'
import CreateProblem from './components/CreateProblem'
import DeleteProblem from './components/DeleteProblem'
import UpdateProblem from './components/UpdateProblem'
import { Delete } from 'lucide-react'
import AdminVideo from './components/AdminVideo'
import AdminVideoUpload from './components/AdminVideoUpload'

function App() {

  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
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
        <Route path='/' element={isAuthenticated ? <HomePage></HomePage> : <Navigate to="/signup"></Navigate>}></Route>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/"></Navigate> : <Login></Login>}></Route>
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/"></Navigate> : <Signup></Signup>}></Route>
        <Route path="/problem/:id" element={isAuthenticated ? <ProblemCodeEditor></ProblemCodeEditor> : <Login></Login>}></Route>
        <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <AdminHome /> : <Navigate to="/" />}></Route>
        <Route path="/admin/create" element={isAuthenticated && user?.role === 'admin' ? <CreateProblem /> : <Navigate to="/" />}></Route>
        <Route path="/admin/update" element={isAuthenticated && user?.role === 'admin' ? <UpdateProblem /> : <Navigate to="/" />}></Route>
        <Route path="/admin/delete" element={isAuthenticated && user?.role === 'admin' ? <DeleteProblem /> : <Navigate to="/" />}></Route>
        <Route path="/admin/video" element={isAuthenticated && user?.role === 'admin' ? <AdminVideo/> : <Navigate to="/" />}></Route>
        <Route path="/admin/upload/:problemId" element={isAuthenticated && user?.role === 'admin' ? <AdminVideoUpload/> : <Navigate to="/" />}></Route>
      </Routes>
    </>
  )
}

export default App
