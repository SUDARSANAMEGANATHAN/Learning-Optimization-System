
import React, { useEffect } from 'react';
import { Layers, Database, Cpu, Activity, Info, ShieldCheck, Zap } from 'lucide-react';

const SystemOverview: React.FC = () => {
  useEffect(() => {
    // Refresh Mermaid diagrams on component mount
    // Cast window to any to access global mermaid object added via script tag
    if ((window as any).mermaid) {
      (window as any).mermaid.contentLoaded();
    }
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="bg-slate-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden ring-8 ring-slate-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight mb-4">System Architecture</h1>
          <p className="text-slate-400 font-medium text-xl max-w-2xl">A high-level overview of the AI Learning Assistant infrastructure, data flow, and security protocols.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Core Architecture */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Layers size={24} />
            </div>
            <h2 className="text-2xl font-black">Application Layers</h2>
          </div>
          
          <div className="mermaid">
            {/* Wrap mermaid diagram in template literal to avoid JSX/TSX parsing issues */}
            {`graph TD
    UI[React Frontend Layer] --> AS[Auth Service - Hashing/JWT]
    UI --> SS[Storage Service - Local IndexedDB Proxy]
    UI --> GS[Gemini AI Service - Flash/Pro Models]
    GS --> API[Google GenAI API Endpoint]
    SS --> LS[LocalStorage / Browser Persistence]
    UI --> RH[React Router - Navigation State]`}
          </div>
          
          <p className="mt-8 text-slate-500 font-medium leading-relaxed">
            The application follows a <strong>decentralized frontend architecture</strong>. Business logic is separated into specialized services (Auth, Storage, AI) ensuring clean data mutation and consistent state across the UI.
          </p>
        </div>

        {/* ER Diagram */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Database size={24} />
            </div>
            <h2 className="text-2xl font-black">Data Entity Relationship</h2>
          </div>
          
          <div className="mermaid">
            {/* Wrap mermaid diagram in template literal to prevent parser from treating curly braces as code blocks */}
            {`erDiagram
    USER ||--o{ DOCUMENT : owns
    USER {
        string id
        string email
        string passwordHash
        string avatar
    }
    DOCUMENT ||--o{ FLASHCARD_SET : generates
    DOCUMENT ||--o{ QUIZ : evaluates
    DOCUMENT {
        string id
        string title
        text extractedText
        text summary
    }
    FLASHCARD_SET ||--|{ FLASHCARD : contains
    QUIZ ||--|{ QUESTION : contains`}
          </div>

          <p className="mt-8 text-slate-500 font-medium leading-relaxed">
            The schema follows a <strong>Relational Document Model</strong>. Every educational asset (Sets, Quizzes) is hard-linked to a source Document, which in turn is owned by a verified User session.
          </p>
        </div>
      </div>

      {/* API Flow & Security */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <Cpu size={24} />
          </div>
          <h2 className="text-2xl font-black">Gemini API Data Flow</h2>
        </div>
        
        <div className="mermaid">
          {/* Wrap mermaid diagram in template literal to avoid parsing issues */}
          {`sequenceDiagram
    participant U as User Component
    participant S as Gemini Service
    participant A as Google API Gateway
    participant M as Gemini-3-Flash
    U->>S: Request Summary (Parsed Text)
    S->>S: Apply System Instructions
    S->>A: POST /generateContent (Secure API Key)
    A->>M: Process Context Window
    M->>A: Stream JSON Response
    A->>S: Return Formatted Text
    S->>U: Update Document State`}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-slate-900 font-black text-sm uppercase tracking-widest">
              <ShieldCheck size={18} className="text-green-600" /> Security
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Passwords are hashed using SHA-256 before storage. Sessions persist via base64 encoded JWT-style tokens with 24h expiry.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-slate-900 font-black text-sm uppercase tracking-widest">
              <Zap size={18} className="text-blue-600" /> Latency
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Utilizes gemini-3-flash-preview for high-speed content generation while maintaining complex reasoning capabilities.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-slate-900 font-black text-sm uppercase tracking-widest">
              <Activity size={18} className="text-purple-600" /> Scalability
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">Frontend-driven persistence allows for offline-first capabilities and minimal server-side overhead.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
