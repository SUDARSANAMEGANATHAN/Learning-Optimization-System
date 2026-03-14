
import React, { useState } from 'react';
import { BookOpen, Mail, User as UserIcon, ArrowRight, Lock, Eye, EyeOff, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const user = await authService.register(name, email, password);
        onLogin(user);
      } else {
        const user = await authService.login(email, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-[#A3D133]/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-8 max-w-7xl mx-auto relative z-20">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-[#A3D133] p-2.5 rounded-xl text-white shadow-lg shadow-[#A3D133]/20 group-hover:rotate-6 transition-transform">
            <BookOpen size={28} />
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-3xl font-black tracking-tighter text-[#A3D133]">EduAI</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Making learning intelligent</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-12 text-xs font-black tracking-widest text-slate-400">
          <a href="#" className="text-[#A3D133] hover:text-[#92bc2e] transition-colors">HOME</a>
          <a href="#about" className="hover:text-[#A3D133] transition-colors">ABOUT US</a>
        </div>

        <button 
          onClick={() => { setMode('signup'); setShowAuthModal(true); }}
          className="bg-[#A3D133] text-white px-10 py-3 rounded-full font-black text-sm tracking-widest shadow-xl shadow-[#A3D133]/30 hover:scale-105 hover:bg-[#92bc2e] transition-all active:scale-95"
        >
          JOIN
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 grid lg:grid-cols-2 gap-20 items-center relative">
        {/* Decorative Blobs from Image */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#A3D133] rounded-full opacity-[0.07] blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-[#A3D133] rounded-full opacity-[0.07] blur-[120px] pointer-events-none"></div>
        
        {/* Corner Blobs like in the image */}
        <div className="fixed top-0 right-0 w-64 h-64 bg-[#A3D133] rounded-full -mr-32 -mt-32 opacity-20 lg:opacity-100 lg:block hidden"></div>
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-[#A3D133] rounded-full -ml-48 -mb-48 opacity-20 lg:opacity-100 lg:block hidden"></div>

        <div className="space-y-10 relative z-10">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900">
              Let's Bring the <br />
              <span className="text-[#A3D133]">Classroom</span> <br />
              to You
            </h1>
            <div className="w-32 h-2 bg-[#A3D133] rounded-full"></div>
          </div>
          
          <p className="text-slate-500 text-xl max-w-lg leading-relaxed font-medium">
            With experienced instructors and AI-powered tools, EduAI makes learning very easy for you. 
            Summarize documents, generate flashcards, and master any subject with ease.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              onClick={() => { setMode('signup'); setShowAuthModal(true); }}
              className="bg-[#A3D133] text-white px-12 py-5 rounded-xl font-black text-xl shadow-2xl shadow-[#A3D133]/40 hover:bg-[#92bc2e] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Get Started
              <ArrowRight size={24} />
            </button>
            
            <div className="flex items-center gap-4 px-4">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
                ))}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Trusted by <span className="text-slate-900">2,000+</span> scholars
              </p>
            </div>
          </div>
        </div>

        <div className="relative group lg:block hidden">
          {/* Image Container with specific styling from the image */}
          <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border-[12px] border-white transform group-hover:-translate-y-2 transition-transform duration-500">
             <img 
               src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200" 
               alt="Student learning" 
               className="w-full h-[600px] object-cover"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          
          {/* Decorative background elements behind image */}
          <div className="absolute -top-8 -right-8 w-full h-full bg-slate-900 rounded-[2.5rem] -z-10 opacity-10 group-hover:rotate-2 transition-transform duration-500"></div>
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#A3D133] rounded-full -z-10 opacity-20 blur-2xl animate-pulse"></div>
          
          {/* Floating Stats Card */}
          <div className="absolute -left-12 bottom-20 z-20 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-4 animate-bounce duration-[3000ms]">
            <div className="bg-green-100 p-3 rounded-2xl text-green-600">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 leading-none">98%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="w-full max-w-lg bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl relative animate-in fade-in zoom-in duration-300 overflow-hidden">
             {/* Modal Background Decals */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#A3D133]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             
             <button 
               onClick={() => setShowAuthModal(false)}
               className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-xl"
             >
               <X size={24} />
             </button>

             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-10">
                 <div className="bg-[#A3D133] p-2 rounded-lg text-white">
                   <BookOpen size={20} />
                 </div>
                 <span className="text-xl font-black tracking-tighter text-slate-900">EduAI</span>
               </div>

               <div className="mb-10">
                 <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                   {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                 </h2>
                 <p className="text-slate-500 font-medium">
                   {mode === 'login' ? 'Sign in to continue your learning journey.' : 'Join thousands of scholars mastering new subjects.'}
                 </p>
               </div>

               {error && (
                 <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                   <AlertCircle size={20} className="shrink-0" />
                   <p className="text-sm font-bold">{error}</p>
                 </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-5">
                 {mode === 'signup' && (
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                     <div className="relative">
                       <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                       <input 
                         type="text" required value={name} onChange={(e) => setName(e.target.value)}
                         placeholder="e.g. Marie Curie"
                         className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-2 border-transparent focus:border-[#A3D133] focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                       />
                     </div>
                   </div>
                 )}

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                   <div className="relative">
                     <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                     <input 
                       type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="you@example.edu"
                       className="w-full pl-16 pr-6 py-4.5 bg-slate-50 border-2 border-transparent focus:border-[#A3D133] focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                     />
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                   <div className="relative">
                     <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                     <input 
                       type={showPassword ? 'text' : 'password'} 
                       required 
                       value={password} 
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••"
                       className="w-full pl-16 pr-16 py-4.5 bg-slate-50 border-2 border-transparent focus:border-[#A3D133] focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
                     />
                     <button 
                       type="button"
                       onClick={() => setShowPassword(!showPassword)}
                       className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                     >
                       {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                   </div>
                 </div>

                 <button 
                   type="submit" 
                   disabled={isLoading}
                   className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3 mt-4"
                 >
                   {isLoading ? (
                     <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <>
                       {mode === 'login' ? 'Sign In' : 'Create Account'}
                       <ArrowRight size={20} />
                     </>
                   )}
                 </button>
               </form>

               <p className="mt-8 text-center text-sm font-bold text-slate-400">
                 {mode === 'login' ? "New to EduAI?" : "Already have an account?"}{' '}
                 <button 
                   onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                   className="text-[#A3D133] hover:underline underline-offset-4"
                 >
                   {mode === 'login' ? 'Join now' : 'Sign in here'}
                 </button>
               </p>
             </div>
           </div>
        </div>
      )}

      {/* Footer Section */}
      <footer id="about" className="max-w-7xl mx-auto px-6 md:px-12 py-20 border-t border-slate-100 mt-20">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#A3D133] p-2 rounded-lg text-white">
                <BookOpen size={20} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900">EduAI</span>
            </div>
            <p className="text-slate-400 font-medium max-w-sm">
              Empowering students worldwide with AI-driven learning tools. Master any subject, anywhere, anytime.
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Platform</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-400">
              <li><a href="#" className="hover:text-[#A3D133] transition-colors">Library</a></li>
              <li><a href="#" className="hover:text-[#A3D133] transition-colors">Flashcards</a></li>
              <li><a href="#" className="hover:text-[#A3D133] transition-colors">AI Chat</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-400">
              <li><a href="#" className="hover:text-[#A3D133] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#A3D133] transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-[#A3D133] transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">© 2026 EduAI Design. All rights reserved.</p>
          <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-slate-300">
            <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
            <a href="#" className="hover:text-slate-900 transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
