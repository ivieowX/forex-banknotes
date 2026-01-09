import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import หน้าต่างๆ
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import AddEditCurrency from './pages/admin/AddEditCurrency';
import ProtectedRoute from './components/ProtectedRoute'; // ตัวกันคนนอก

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้า User (เข้าได้ทุกคน) */}
        <Route path="/" element={<Home />} />
        
        {/* หน้า Login (เข้าได้ทุกคน) */}
        <Route path="/login" element={<Login />} />

        {/* โซน Admin (ต้องล็อกอินก่อนถึงจะเข้าได้) */}
        <Route element={<ProtectedRoute />}>
           <Route path="/admin/dashboard" element={<Dashboard />} />
           <Route path="/admin/add" element={<AddEditCurrency />} />
           <Route path="/admin/edit/:id" element={<AddEditCurrency />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;