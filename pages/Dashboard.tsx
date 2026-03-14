
import React from 'react';
import { FileText, BookOpen, Target, Clock, ArrowUpRight, Sparkles, RefreshCw, BarChart3 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { recommendationService } from '../services/recommendationService';
import { Recommendation } from '../types';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = React.useState(false);
  const docs = storageService.getDocuments();
  const sets = storageService.getFlashcardSets();
  const activities = storageService.getActivities();

  React.useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async (force = false) => {
    setIsLoadingRecs(true);
    try {
      const recs = await recommendationService.getRecommendations(force);
      setRecommendations(recs);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const stats = [
    { label: 'Documents', value: docs.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Study Sets', value: sets.length, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Daily Goal', value: '75%', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Time Spent', value: '2.4h', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Welcome back, Scholar</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Continue your learning journey where you left off.</p>
        </div>
        <Link to="/documents" className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all">
          Upload New Material
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className={`${stat.bg} ${stat.color} p-4 rounded-xl`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations Section */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Recommended for You</h2>
              <p className="text-sm text-slate-500 font-medium">AI-powered study suggestions based on your library.</p>
            </div>
          </div>
          <button 
            onClick={() => fetchRecommendations(true)}
            disabled={isLoadingRecs}
            className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoadingRecs ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingRecs ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-50 rounded-3xl animate-pulse"></div>
            ))
          ) : recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <div key={rec.id} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-600' : 
                    rec.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {rec.priority} Priority
                  </div>
                  <div className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
                <h4 className="font-black text-lg text-slate-900 mb-2">{rec.title}</h4>
                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4">{rec.description}</p>
                <Link 
                  to={rec.type === 'quiz' ? '/documents' : rec.type === 'review' ? '/documents' : '/flashcards'}
                  className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Take Action
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-slate-400 font-bold">
              Upload more documents to get personalized recommendations.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Recent Activity</h2>
          <div className="space-y-6">
            {activities.length > 0 ? activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 items-start p-4 hover:bg-slate-50 rounded-2xl transition-all">
                <div className="mt-1 flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 leading-tight">{activity.description}</p>
                  <p className="text-xs text-slate-400 mt-1 font-black uppercase tracking-widest">{new Date(activity.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-slate-400 font-bold">No recent activities found.</p>
            )}
          </div>
        </div>

        <Link to="/progress" className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <h2 className="text-2xl font-black mb-4 relative z-10">Smart Progress</h2>
          <p className="text-slate-400 mb-10 relative z-10 font-medium">Keep going! You're in the top 10% of active scholars this week.</p>
          
          <div className="space-y-6 relative z-10">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h4 className="font-bold">View Analytics</h4>
                  <p className="text-xs text-slate-400">Track your performance</p>
                </div>
              </div>
              <ArrowUpRight size={20} className="text-slate-500 group-hover:text-white transition-all" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
