
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { TrendingUp, Award, Target, BookOpen, ChevronRight, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Quiz, Document } from '../types';

const Progress: React.FC = () => {
  const quizzes = storageService.getQuizzes().filter(q => q.score !== undefined);
  const documents = storageService.getDocuments();

  // Calculate stats
  const averageScore = quizzes.length > 0 
    ? Math.round(quizzes.reduce((acc, q) => acc + (q.score || 0), 0) / quizzes.length) 
    : 0;
  
  const bestScore = quizzes.length > 0 
    ? Math.max(...quizzes.map(q => q.score || 0)) 
    : 0;

  const totalAttempts = quizzes.length;

  // Prepare chart data (scores over time)
  const chartData = quizzes
    .sort((a, b) => (a.attemptedAt || 0) - (b.attemptedAt || 0))
    .map(q => ({
      date: new Date(q.attemptedAt || 0).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: q.score,
      title: q.title
    }));

  // Prepare performance by document
  const docPerformance = documents.map(doc => {
    const docQuizzes = quizzes.filter(q => q.documentId === doc.id);
    const avg = docQuizzes.length > 0 
      ? Math.round(docQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / docQuizzes.length)
      : 0;
    return {
      name: doc.title,
      score: avg,
      attempts: docQuizzes.length
    };
  }).filter(d => d.attempts > 0);

  const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#ea580c', '#dc2626'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Academic Progress</h1>
          <p className="text-slate-500 mt-1 font-medium text-lg">Visualize your mastery across all subjects.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="bg-green-50 text-green-600 p-4 rounded-xl">
            <Award size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Average Score</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{averageScore}%</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="bg-blue-50 text-blue-600 p-4 rounded-xl">
            <Target size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Best Performance</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{bestScore}%</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="bg-purple-50 text-purple-600 p-4 rounded-xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Assessments</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{totalAttempts}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Trend Chart */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <TrendingUp className="text-green-600" />
            Performance Trend
          </h2>
          <div className="h-[350px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '1rem', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '1rem'
                    }}
                    labelStyle={{ fontWeight: 900, marginBottom: '0.5rem' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#16a34a" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No assessment data available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance by Subject */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <BookOpen className="text-blue-600" />
            Mastery by Subject
          </h2>
          <div className="h-[350px] w-full">
            {docPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={docPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={30}>
                    {docPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="font-bold">Complete some quizzes to see subject mastery.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Quiz History */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Assessment History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-6 py-4">Assessment</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {quizzes.length > 0 ? quizzes.sort((a, b) => (b.attemptedAt || 0) - (a.attemptedAt || 0)).map((quiz) => (
                <tr key={quiz.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                        <Target size={20} />
                      </div>
                      <p className="font-bold text-slate-900">{quiz.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm text-slate-500 font-medium">
                    {new Date(quiz.attemptedAt || 0).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-6">
                    <span className={`text-lg font-black ${
                      (quiz.score || 0) >= 80 ? 'text-green-600' : 
                      (quiz.score || 0) >= 50 ? 'text-orange-600' : 
                      'text-red-600'
                    }`}>
                      {quiz.score}%
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      (quiz.score || 0) >= 80 ? 'bg-green-100 text-green-700' : 
                      (quiz.score || 0) >= 50 ? 'bg-orange-100 text-orange-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {(quiz.score || 0) >= 80 ? 'Mastered' : (quiz.score || 0) >= 50 ? 'Improving' : 'Needs Review'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold">
                    No assessments completed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Progress;
