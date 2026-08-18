import { useEffect, useState } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router'
import HomePage from './pages/Homepage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { useDispatch, useSelector } from 'react-redux'
import { checkAuth } from './authSlice'

function App() {

  const {isAuthenticated} = useSelector((state)=>state.auth)
  const dispatch = useDispatch();

  useEffect(()=>{
    dispatch(checkAuth())
  }, [dispatch])


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
