import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // เช็คว่าตอนนี้มีคนล็อกอินอยู่ไหม
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // ฟังสถานะการเปลี่ยนแปลง (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-10 text-center">กำลังโหลด...</div>;

  // ถ้ามี Session (ล็อกอินแล้ว) ให้แสดงเนื้อหาข้างใน (Outlet)
  // ถ้าไม่มี ให้ดีดกลับไปหน้า Login
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}