import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Feed from '../pages/Feed';
import Profile from '../pages/Profile';
import PostDetails from '../pages/PostDetails';
import EditProfile from '../pages/EditProfile';
import Search from '../pages/Search';
import ProtectedRoute from '../components/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/search" element={<Search />} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/post/:id" element={<PostDetails />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default AppRoutes;
