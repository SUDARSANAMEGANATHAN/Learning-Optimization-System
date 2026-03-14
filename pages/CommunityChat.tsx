
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { CommunityMessage } from '../types';
import { Send, Users, Sparkles, MessageCircle, ShieldCheck, Zap, Paperclip, File as FileIcon, Image as ImageIcon, Download, X, FileText, AlertCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>(storageService.getCommunityMessages());
  const [input, setInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File, preview: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io();

    socketRef.current.on('receive_message', (message: CommunityMessage) => {
      setMessages(prev => {
        // Avoid duplicates if the message was already added locally
        if (prev.some(m => m.id === message.id)) return prev;
        const newMessages = [...prev, message];
        storageService.saveCommunityMessage(message);
        return newMessages;
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Limit file size to 1MB for LocalStorage safety
    if (file.size > 1024 * 1024) {
      setFileError("File too large (max 1MB for community sharing)");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        file,
        preview: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || !user) return;
    
    const messageId = Math.random().toString(36).substr(2, 9);
    const userMessage: CommunityMessage = {
      id: messageId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar || '',
      content: input,
      timestamp: Date.now()
    };

    if (selectedFile) {
      userMessage.file = {
        url: selectedFile.preview,
        name: selectedFile.file.name,
        type: selectedFile.file.type,
        size: selectedFile.file.size
      };
    }

    // Emit message to server
    socketRef.current?.emit('send_message', userMessage);

    // Update UI locally immediately for responsiveness
    setMessages(prev => [...prev, userMessage]);
    storageService.saveCommunityMessage(userMessage);
    
    const currentInput = input;
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // If AI is toggled or specific conditions met, get AI response
    if (isAiActive || input.toLowerCase().includes('@ai') || input.toLowerCase().includes('bot')) {
      setIsAiTyping(true);
      try {
        const history = messages.slice(-5).map(m => ({ userName: m.userName, content: m.content }));
        const aiResponse = await geminiService.generateCommunityResponse(currentInput, history);
        
        const aiMessage: CommunityMessage = {
          id: 'ai-bot-' + Date.now(),
          userId: 'edu-ai-bot',
          userName: 'EduAI Bot',
          userAvatar: '', // Will be handled by ID in UI
          content: aiResponse || "I'm listening! How can I help with your studies?",
          timestamp: Date.now()
        };
        
        // Emit AI message to server so everyone sees it
        socketRef.current?.emit('send_message', aiMessage);
        
        setMessages(prev => [...prev, aiMessage]);
        storageService.saveCommunityMessage(aiMessage);
      } catch (e) {
        console.error("AI Community response failed", e);
      } finally {
        setIsAiTyping(false);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFileContent = (file: { url: string, name: string, type: string, size: number }, isMe: boolean) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (isImage) {
      return (
        <div className="mt-3 rounded-2xl overflow-hidden border border-black/5 shadow-sm group/img relative">
          <img src={file.url} alt={file.name} className="max-w-full max-h-80 object-contain bg-gray-50/50" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <a href={file.url} download={file.name} className="p-3 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-xl">
              <Download size={20} />
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className={`mt-3 flex items-center gap-4 p-4 rounded-2xl border shadow-sm group/file transition-all ${
        isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
      }`}>
        <div className={`p-3 rounded-xl ${isPdf ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
          {isPdf ? <FileText size={24} /> : <FileIcon size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${isMe ? 'text-white' : 'text-slate-900'}`}>{file.name}</p>
          <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
            {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
          </p>
        </div>
        <a href={file.url} download={file.name} className={`p-2 rounded-xl shadow-sm border transition-all hover:scale-110 ${
          isMe ? 'bg-white/20 border-white/10 text-white' : 'bg-white border-gray-100 text-slate-400 hover:text-green-600'
        }`}>
          <Download size={20} />
        </a>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden relative">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 p-8 text-white flex items-center justify-between shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
            <Users size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Community Hub</h1>
            <p className="text-green-100 text-xs font-black uppercase tracking-[0.2em]">Real-time Academic Network</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 z-10">
          <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
            <span className="text-xs font-bold uppercase tracking-widest">1,204 Active Now</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-50/30 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale pointer-events-none">
            <MessageCircle size={80} className="text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-gray-300">Start the conversation</h3>
            <p className="text-lg font-medium text-gray-400">Introduce yourself to your fellow scholars.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isBot = msg.userId === 'edu-ai-bot';
            const isMe = msg.userId === user?.id;

            return (
              <div key={msg.id} className={`flex gap-5 group ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className="shrink-0">
                  {isBot ? (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 ring-2 ring-white">
                      <Zap size={24} />
                    </div>
                  ) : (
                    <img 
                      src={msg.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.userName)}&background=random`} 
                      className="w-12 h-12 rounded-2xl shadow-md border-2 border-white group-hover:scale-110 transition-transform object-cover"
                      alt={msg.userName}
                    />
                  )}
                </div>
                <div className={`max-w-[75%] space-y-2 ${isMe ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-3 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${isBot ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {isBot && <ShieldCheck size={14} />}
                      {msg.userName}
                      {isBot && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[8px]">VERIFIED BOT</span>}
                    </span>
                    <span className="text-[10px] font-bold text-gray-300">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`px-6 py-4 rounded-[1.5rem] shadow-sm text-base font-semibold leading-relaxed ${
                    isMe 
                      ? 'bg-green-600 text-white rounded-tr-none shadow-green-100 ring-4 ring-white' 
                      : isBot
                      ? 'bg-gradient-to-br from-indigo-50 to-white text-indigo-900 border-2 border-indigo-100 rounded-tl-none shadow-indigo-50 ring-4 ring-white'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm ring-4 ring-white'
                  }`}>
                    {msg.content && <p>{msg.content}</p>}
                    {msg.file && renderFileContent(msg.file, isMe)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isAiTyping && (
          <div className="flex gap-5 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-400">
              <Zap size={24} />
            </div>
            <div className="bg-white border border-indigo-100 px-6 py-4 rounded-[1.5rem] rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-8 bg-white border-t border-gray-100 flex flex-col gap-4 shrink-0 shadow-2xl z-10">
        {fileError && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
            <AlertCircle size={18} />
            <p className="text-xs font-bold">{fileError}</p>
            <button onClick={() => setFileError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
              <X size={14} />
            </button>
          </div>
        )}

        {selectedFile && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-bottom-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
              {selectedFile.file.type.startsWith('image/') ? (
                <img src={selectedFile.preview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <FileIcon className="text-gray-400" size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{selectedFile.file.name}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatFileSize(selectedFile.file.size)}</p>
            </div>
            <button onClick={() => setSelectedFile(null)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:scale-110 transition-all">
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex gap-4">
          <div className="flex-1 relative group flex items-center">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,text/plain,.doc,.docx"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-4 p-2.5 rounded-xl bg-white text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all border border-gray-100 shadow-sm z-10"
              title="Attach File"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isAiActive ? "Ask the AI Bot a question..." : "Share an insight or file..."}
              className={`w-full border-2 pl-16 pr-16 py-5 rounded-[1.5rem] outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 shadow-sm ${
                isAiActive ? 'bg-indigo-50 border-indigo-200 focus:border-indigo-600 focus:bg-white' : 'bg-gray-50 border-transparent focus:border-green-600 focus:bg-white'
              }`}
            />
            <button 
              onClick={() => setIsAiActive(!isAiActive)}
              className={`absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                isAiActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-100'
              }`}
              title="Toggle AI Assistant"
            >
              <Sparkles size={20} />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || isAiTyping}
            className={`p-5 rounded-[1.5rem] text-white transition-all shadow-xl active:scale-95 flex items-center justify-center disabled:bg-gray-200 disabled:shadow-none ${
              isAiActive ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' : 'bg-green-600 shadow-green-100 hover:bg-green-700'
            }`}
          >
            <Send size={28} />
          </button>
        </div>
        <div className="flex items-center gap-6 px-2">
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
             Real-time Academic Sync Active
           </p>
           {isAiActive && (
             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] animate-pulse flex items-center gap-2">
               <Zap size={10} />
               EduAI Bot is standing by
             </p>
           )}
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;
