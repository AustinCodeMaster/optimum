import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom' 
import Login from './pages/Login.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <BrowserRouter>
       <Routes>
          <Route path="/" element={<Login/>} />
          <Route
           path="/staff/dashboard" 
          element={
          <ProtectedRoute allowedRole="staff">
          <StaffDashboard />
          </ProtectedRoute>
           }
        />
         <Route
         path="/admin/dashboard"
         element={
         <ProtectedRoute allowedRole="admin">
         <AdminDashboard />
         </ProtectedRoute>
  }
/>

       </Routes>
    </BrowserRouter>
  )
}

export default App