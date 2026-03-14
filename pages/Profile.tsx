
import React, { useState, useRef } from 'react';
import { useAuth } from '../App';
import { storageService } from '../services/storageService';
import { User as UserIcon, Mail, Shield, Smartphone, Camera, ChevronRight, Trash2, Key } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real data from storage
  const docs = storageService.getDocuments();
  const quizzes = storageService.getQuizzes().filter(q => q.score !== undefined);
  const avgScore = quizzes.length 
    ? Math.round(quizzes.reduce((a, b) => a + (b.score || 0), 0) / quizzes.length) 
    : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateUser({ avatar: base64 });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      updateUser({ avatar: undefined });
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Account Intelligence</h1>
          <p className="text-gray-500 font-medium text-lg mt-1">Manage your identity and learning identity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
        {/* Left Card: Identity */}
        <div className="xl:col-span-1 space-y-8">
          <div className="bg-white border border-gray-200 rounded-[2.5rem] p-10 text-center shadow-xl shadow-gray-100 ring-1 ring-gray-100">
            <div className="relative inline-block mb-8">
              <div className="relative">
                <img 
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} 
                  className="w-40 h-40 rounded-[3rem] border-8 border-green-50 shadow-2xl object-cover ring-2 ring-white"
                  alt="Profile"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-4 bg-green-600 text-white rounded-2xl border-4 border-white shadow-2xl hover:bg-green-700 transition-all hover:scale-110 active:scale-90"
                  title="Change Photo"
                >
                  <Camera size={20} />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900">{user?.name}</h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{user?.email}</p>

            {user?.avatar && (
              <button 
                onClick={removePhoto}
                className="mt-6 text-xs font-black text-red-400 hover:text-red-600 flex items-center gap-2 mx-auto uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={14} /> Remove Photo
              </button>
            )}

            <div className="mt-10 pt-10 border-t border-gray-100 grid grid-cols-2 gap-8">
              <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-50">
                <span className="block text-2xl font-black text-blue-700">{docs.length}</span>
                <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest">ASSETS</span>
              </div>
              <div className="p-4 bg-green-50/30 rounded-2xl border border-green-50">
                <span className="block text-2xl font-black text-green-700">{avgScore}%</span>
                <span className="text-[10px] uppercase font-black text-green-400 tracking-widest">AVG SCORE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Cards: Information & Settings */}
        <div className="xl:col-span-3 space-y-10">
          <div className="bg-white border border-gray-200 rounded-[3rem] overflow-hidden shadow-xl shadow-gray-100 ring-1 ring-gray-100">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-green-600">
                  <UserIcon size={24} />
                </div>
                <h3 className="text-xl font-black tracking-tight">Master Identity Information</h3>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                  isEditing ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                {isEditing ? 'Discard Changes' : 'Edit Profile'}
              </button>
            </div>
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Official Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      type="text" 
                      readOnly={!isEditing}
                      defaultValue={user?.name}
                      className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 text-base font-bold transition-all outline-none ${
                        isEditing ? 'border-green-600 bg-white ring-8 ring-green-50' : 'border-gray-50 bg-gray-50 text-gray-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Verified Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      type="email" 
                      readOnly={!isEditing}
                      defaultValue={user?.email}
                      className={`w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 text-base font-bold transition-all outline-none ${
                        isEditing ? 'border-green-600 bg-white ring-8 ring-green-50' : 'border-gray-50 bg-gray-50 text-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end pt-4 animate-in slide-in-from-right-4">
                  <button className="bg-green-600 text-white px-12 py-5 rounded-[1.5rem] font-black text-lg hover:bg-green-700 shadow-2xl shadow-green-100 active:scale-95 transition-all">
                    Update Master Data
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[3rem] overflow-hidden shadow-xl shadow-gray-100 ring-1 ring-gray-100">
            <div className="p-10 border-b border-gray-50 bg-gray-50/30">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-green-600">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-black tracking-tight">Security & Governance</h3>
              </div>
            </div>
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Security Credentials', icon: Key, desc: 'Update your password and encryption keys.' },
                { label: 'Multi-Factor Auth', icon: Smartphone, desc: 'Add biometric or SMS security layers.' },
                { label: 'Session Management', icon: Shield, desc: 'View and manage active device logins.' },
              ].map((item, i) => (
                <button key={i} className="group flex items-center justify-between p-8 rounded-[2rem] border-2 border-gray-50 hover:border-green-100 hover:bg-green-50/30 transition-all text-left ring-offset-4 focus:ring-4 focus:ring-green-100 outline-none">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl group-hover:bg-white group-hover:text-green-600 group-hover:shadow-lg transition-all">
                      <item.icon size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-gray-900 leading-tight">{item.label}</h4>
                      <p className="text-sm font-medium text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-gray-200 group-hover:text-green-600 group-hover:translate-x-2 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
