import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/auth/LoginPage';
import ShopPage from './pages/consumer/ShopPage';
import ProductDetail from './pages/consumer/ProductDetail';
import CartPage from './pages/consumer/CartPage';
import MyOrders from './pages/consumer/MyOrders';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import AddProduct from './pages/seller/AddProduct';
import SellerOrders from './pages/seller/SellerOrders';
import BossDashboard from './pages/boss/BossDashboard';
import BossSellers from './pages/boss/BossSellers';
import BossProducts from './pages/boss/BossProducts';
import BossOrders from './pages/boss/BossOrders';
import BossUsers from './pages/boss/BossUsers';
import BossSecurity from './pages/boss/BossSecurity';
import NotificationsPage from './pages/shared/NotificationsPage';
import ProfilePage from './pages/shared/ProfilePage';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={`/${user.role}`} replace />} />
        <Route path="/" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />

        {/* Consumer */}
        <Route path="/shop" element={<ProtectedRoute role="consumer"><ShopPage /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute role="consumer"><CartPage /></ProtectedRoute>} />
        <Route path="/consumer/orders" element={<ProtectedRoute role="consumer"><MyOrders /></ProtectedRoute>} />
        <Route path="/consumer/notifications" element={<ProtectedRoute role="consumer"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/consumer/profile" element={<ProtectedRoute role="consumer"><ProfilePage /></ProtectedRoute>} />
        <Route path="/consumer" element={<Navigate to="/shop" replace />} />

        {/* Seller */}
        <Route path="/seller" element={<ProtectedRoute role="seller"><SellerDashboard /></ProtectedRoute>} />
        <Route path="/seller/products" element={<ProtectedRoute role="seller"><SellerProducts /></ProtectedRoute>} />
        <Route path="/seller/add-product" element={<ProtectedRoute role="seller"><AddProduct /></ProtectedRoute>} />
        <Route path="/seller/orders" element={<ProtectedRoute role="seller"><SellerOrders /></ProtectedRoute>} />
        <Route path="/seller/notifications" element={<ProtectedRoute role="seller"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/seller/profile" element={<ProtectedRoute role="seller"><ProfilePage /></ProtectedRoute>} />

        {/* Boss */}
        <Route path="/boss" element={<ProtectedRoute role="boss"><BossDashboard /></ProtectedRoute>} />
        <Route path="/boss/sellers" element={<ProtectedRoute role="boss"><BossSellers /></ProtectedRoute>} />
        <Route path="/boss/products" element={<ProtectedRoute role="boss"><BossProducts /></ProtectedRoute>} />
        <Route path="/boss/orders" element={<ProtectedRoute role="boss"><BossOrders /></ProtectedRoute>} />
        <Route path="/boss/users" element={<ProtectedRoute role="boss"><BossUsers /></ProtectedRoute>} />
        <Route path="/boss/security" element={<ProtectedRoute role="boss"><BossSecurity /></ProtectedRoute>} />
        <Route path="/boss/notifications" element={<ProtectedRoute role="boss"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/boss/profile" element={<ProtectedRoute role="boss"><ProfilePage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
