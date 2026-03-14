
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, User as UserIcon, LogOut, Bell, Menu, X, Search, MessageCircle, BarChart3 } from 'lucide-react';
import { User } from './types';
import { storageService } from './services/storageService';

// Pages
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentDetail from './pages/DocumentDetail';
import GlobalFlashcards from './pages/GlobalFlashcards';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import CommunityChat from './pages/CommunityChat';
import Progress from './pages/Progress';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
      active ? 'bg-green-600 text-white shadow-xl shadow-green-100 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
    }`}
  >
    <Icon size={22} />
    <span className="text-base">{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storageService.getCurrentSession());
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const login = (newUser: User) => {
    setUser(newUser);
    storageService.setCurrentSession(newUser);
    navigate('/');
  };

  const logout = () => {
    setUser(null);
    storageService.setCurrentSession(null);
    navigate('/auth');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    storageService.setCurrentSession(updatedUser);
  };

  if (!user && location.pathname !== '/auth') {
    return <Navigate to="/auth" />;
  }

  if (location.pathname === '/auth') {
    return <Auth onLogin={login} />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/40 z-[60] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`fixed inset-y-0 left-0 z-[70] w-80 bg-white border-r border-slate-100 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full p-8">
            <div className="px-4 py-8 flex items-center justify-between mb-12">
              <div className="flex items-center gap-4 font-black text-4xl text-slate-900 tracking-tighter">
                <div className="bg-green-600 text-white p-2.5 rounded-2xl shadow-xl">
                  <BookOpen size={36} />
                </div>
                <span>EduAI</span>
              </div>
              <button className="lg:hidden p-2 text-slate-400" onClick={() => setSidebarOpen(false)}><X size={24} /></button>
            </div>

            <nav className="flex-1 space-y-3">
              <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
              <SidebarItem to="/documents" icon={FileText} label="Library" active={location.pathname.startsWith('/documents')} />
              <SidebarItem to="/progress" icon={BarChart3} label="Progress" active={location.pathname === '/progress'} />
              <SidebarItem to="/community" icon={MessageCircle} label="Community" active={location.pathname === '/community'} />
              <SidebarItem to="/flashcards" icon={BookOpen} label="Study Sets" active={location.pathname === '/flashcards'} />
              <SidebarItem to="/profile" icon={UserIcon} label="Profile" active={location.pathname === '/profile'} />
            </nav>

            <div className="mt-auto pt-8 border-t border-slate-100">
              <button onClick={logout} className="flex items-center gap-4 w-full px-6 py-4 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all font-black uppercase text-xs tracking-widest">
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-28 bg-white border-b border-slate-100 flex items-center justify-between px-10 lg:px-16 shrink-0 z-40">
            <button className="lg:hidden p-3 text-slate-500 hover:bg-slate-50 rounded-2xl" onClick={() => setSidebarOpen(true)}><Menu size={32} /></button>

            <div className="hidden md:flex items-center bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 w-[450px]">
              <Search size={22} className="text-slate-400" />
              <input type="text" placeholder="Search resources..." className="bg-transparent border-none outline-none text-base px-4 w-full font-bold" />
            </div>

            <div className="flex items-center gap-8">
              <button className="p-4 text-slate-400 hover:bg-slate-50 rounded-2xl relative">
                <Bell size={26} />
                <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full border-4 border-white"></span>
              </button>
              
              <div className="flex items-center gap-5 pl-8 border-l border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-lg font-black text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-xs font-black text-green-600 uppercase tracking-widest mt-1">Scholar</p>
                </div>
                <img src={user?.avatar} alt="Avatar" className="w-16 h-16 rounded-2xl border-4 border-white shadow-xl object-cover" />
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 lg:p-16 custom-scrollbar">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/documents/:id" element={<DocumentDetail />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/community" element={<CommunityChat />} />
              <Route path="/flashcards" element={<GlobalFlashcards />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </AuthContext.Provider>
  );
};

export default App;
