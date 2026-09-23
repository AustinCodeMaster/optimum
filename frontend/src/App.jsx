import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom' 
import Login from './pages/Login.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RecordReceived from './pages/RecordReceived.jsx'
import RecordExpense from './pages/RecordExpense'
import Transactions from './pages/Transactions.jsx'

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
         <Route
         path="/staff/received"
         element={
          <ProtectedRoute allowedRole="staff">
            <RecordReceived />
         </ProtectedRoute>
         }
         />
         <Route
         path="staff/expense"
         element={
          <ProtectedRoute allowedRole="staff">
            <RecordExpense />
          </ProtectedRoute>  
         }
         />
         <Route
         path="/staff/transactions"
         element={
          <ProtectedRoute allowedRole="staff">
             <Transactions />
          </ProtectedRoute>
         }
         />
       </Routes>
    </BrowserRouter>
  )
}

export default App