
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, MessageSquare, Sparkles, BookOpen, Target, 
  ChevronLeft, Send, Sparkle, Star, CheckCircle, 
  RotateCcw, ChevronRight, XCircle, FileSearch, Download, AlertCircle, HelpCircle, X, Hash
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Document, ChatMessage, FlashcardSet, Quiz } from '../types';

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'chat' | 'actions' | 'flashcards' | 'quiz'>('content');
  const [contentView, setContentView] = useState<'pdf' | 'text'>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Actions State
  const [conceptInput, setConceptInput] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);

  // Flashcard State
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(8);

  // Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);

  useEffect(() => {
    if (id) {
      const found = storageService.getDocuments().find(d => d.id === id);
      if (found) {
        setDoc(found);
        setMessages(storageService.getChats(id));
        setFlashcardSets(storageService.getFlashcardSets().filter(s => s.documentId === id));

        // Create Blob URL for PDF
        if (found.filePath && found.filePath.startsWith('data:application/pdf;base64,')) {
          try {
            const base64Content = found.filePath.split(',')[1];
            const binaryString = window.atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
          } catch (e) {
            console.error("Error creating PDF blob", e);
            setPdfBlobUrl(found.filePath);
          }
        } else {
          setPdfBlobUrl(found.filePath);
        }
      }
    }

    return () => {
      if (pdfBlobUrl && pdfBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [id]);

  // Smoother scrolling for streaming
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || !doc || isTyping) return;
    
    const user = storageService.getCurrentSession();
    const currentInput = input;
    const userMsg: ChatMessage = { role: 'user', content: currentInput, timestamp: Date.now(), userId: user?.id || '1' };
    
    // 1. Update UI with user message
    setMessages(prev => [...prev, userMsg]);
    storageService.saveChatMessage(doc.id, userMsg);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      // 2. Prepare a placeholder AI message
      const aiMsg: ChatMessage = { role: 'model', content: "", timestamp: Date.now(), userId: user?.id || '1' };
      setMessages(prev => [...prev, aiMsg]);

      // 3. Start streaming
      const finalResponse = await geminiService.chatWithDocumentStream(
        doc.extractedText, 
        history, 
        currentInput, 
        (chunkedText) => {
          // Update the last message (the placeholder) with the accumulated chunks
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: chunkedText };
            return updated;
          });
        }
      );

      // 4. Save the finalized message to storage
      storageService.saveChatMessage(doc.id, { role: 'model', content: finalResponse, timestamp: Date.now(), userId: user?.id || '1' });
      
    } catch (error) {
      console.error("Chat failed", error);
      const errorMsg: ChatMessage = { role: 'model', content: "Sorry, I encountered an error while processing your request.", timestamp: Date.now(), userId: user?.id || '1' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSummary = async () => {
    if (!doc) return;
    setIsLoading(true);
    try {
      const summary = await geminiService.generateSummary(doc.extractedText);
      storageService.updateDocument(doc.id, { summary: summary || "" });
      setDoc(prev => prev ? { ...prev, summary: summary || "" } : null);
    } catch (error) {
      console.error("Summary failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const explainConcept = async () => {
    if (!doc || !conceptInput.trim()) return;
    setIsLoading(true);
    setExplanation(null);
    try {
      const user = storageService.getCurrentSession();
      const result = await geminiService.explainConcept(doc.extractedText, conceptInput);
      setExplanation(result || "Could not generate explanation.");
      storageService.addActivity({
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.id || '1',
        type: 'concept',
        description: `Asked for explanation of: ${conceptInput}`,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Explanation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!doc) return;
    setIsLoading(true);
    try {
      const user = storageService.getCurrentSession();
      const cards = await geminiService.generateFlashcards(doc.extractedText, flashcardCount);
      const newSet: FlashcardSet = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.id || '1',
        documentId: doc.id,
        title: `Cards from ${doc.title}`,
        cards: cards.map((c: any) => ({
          ...c,
          id: Math.random().toString(36).substr(2, 9),
          isStarred: false,
          isReviewed: false
        })),
        createdAt: Date.now()
      };
      storageService.saveFlashcardSet(newSet);
      setFlashcardSets(prev => [...prev, newSet]);
    } catch (error) {
      console.error("Flashcard generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!doc) return;
    setIsLoading(true);
    try {
      const user = storageService.getCurrentSession();
      const questions = await geminiService.generateQuiz(doc.extractedText, quizQuestionCount);
      const newQuiz: Quiz = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.id || '1',
        documentId: doc.id,
        title: `Quiz for ${doc.title}`,
        questions: questions.map((q: any) => ({ ...q, id: Math.random().toString(36).substr(2, 9) }))
      };
      storageService.saveQuiz(newQuiz);
      setActiveQuiz(newQuiz);
      setUserAnswers(new Array(newQuiz.questions.length).fill(-1));
      setQuizStep(0);
      setShowResults(false);
    } catch (error) {
      console.error("Quiz generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuiz = () => {
    if (!activeQuiz) return;
    let correct = 0;
    activeQuiz.questions.forEach((q, i) => {
      if (userAnswers[i] === q.correctIndex) correct++;
    });
    const score = Math.round((correct / activeQuiz.questions.length) * 100);
    storageService.updateQuiz(activeQuiz.id, { score, attemptedAt: Date.now() });
    setShowResults(true);
  };

  if (!doc) return <div className="p-8 text-center font-bold">Document not found.</div>;

  return (
    <div className="w-full max-w-[1800px] mx-auto h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/documents" className="p-3 text-gray-400 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 rounded-2xl transition-all">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <FileText className="text-red-500" size={24} />
              </div>
              {doc.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-bold uppercase tracking-widest ml-12">Session active since {new Date(doc.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs Nav */}
      <div className="flex items-center border-b border-gray-200 gap-4 overflow-x-auto scrollbar-hide px-2">
        {[
          { id: 'content', icon: FileText, label: 'Content' },
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'actions', icon: Sparkles, label: 'AI Actions' },
          { id: 'flashcards', icon: BookOpen, label: 'Flashcards' },
          { id: 'quiz', icon: Target, label: 'Quiz' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 text-sm font-bold transition-all border-b-4 whitespace-nowrap ${
              activeTab === tab.id ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-md z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-6 shadow-sm" />
            <p className="text-xl text-green-900 font-black tracking-tight">AI is processing your request...</p>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <div className="flex items-center gap-3 px-4">
                <FileSearch size={20} className="text-gray-400" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">KNOWLEDGE SOURCE</span>
              </div>
              <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm mr-4">
                <button 
                  onClick={() => setContentView('pdf')}
                  className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${contentView === 'pdf' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  PDF View
                </button>
                <button 
                  onClick={() => setContentView('text')}
                  className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${contentView === 'text' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  Parsed Text
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-gray-100">
              {contentView === 'pdf' ? (
                <div className="w-full h-full flex items-center justify-center">
                  {pdfBlobUrl ? (
                    <embed
                      src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      type="application/pdf"
                      className="w-full h-full border-none"
                    />
                  ) : (
                    <div className="p-12 text-center max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100">
                      <AlertCircle size={64} className="mx-auto text-red-100 mb-6" />
                      <h3 className="text-2xl font-black mb-4">Display Restricted</h3>
                      <p className="text-lg text-gray-500 mb-8 font-medium">For security reasons, some browsers require you to open large PDFs in a dedicated viewer.</p>
                      <a 
                        href={doc.filePath} 
                        download={`${doc.title}.pdf`}
                        className="inline-flex items-center gap-3 bg-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all"
                      >
                        <Download size={24} /> Download for Local View
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full p-12 overflow-y-auto bg-white">
                  <div className="max-w-5xl mx-auto space-y-10">
                    <div className="bg-gray-50 p-12 rounded-[3rem] border border-gray-100 shadow-inner">
                      <h3 className="font-black mb-10 uppercase text-xs tracking-[0.3em] text-gray-400 border-b border-gray-200 pb-4 flex items-center gap-3">
                        <Sparkle size={18} className="text-green-500" />
                        SYSTEM EXTRACTED KNOWLEDGE
                      </h3>
                      <p className="text-gray-800 leading-[2] whitespace-pre-wrap font-medium text-lg">{doc.extractedText}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab - Real-time Streaming Version */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-6 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-green-50 ring-8 ring-white">
                    <MessageSquare size={48} />
                  </div>
                  <h3 className="text-3xl font-black mb-4">Deep Knowledge Search</h3>
                  <p className="text-xl text-gray-500 font-medium">Ask specific questions about definitions, formulas, or concepts. I'm listening in real-time.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}>
                  <div className={`max-w-[70%] rounded-[2rem] px-8 py-6 shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-br-none shadow-green-100 ring-4 ring-white' 
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm ring-4 ring-white'
                  }`}>
                    {msg.content === "" && msg.role === 'model' ? (
                      <div className="flex gap-2 py-4">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    ) : (
                      <div className="text-lg leading-relaxed font-semibold whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}
                    <p className={`text-[10px] mt-4 font-black uppercase tracking-[0.2em] opacity-60 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                      {msg.role === 'user' ? 'SENT' : 'AI RESPONSE'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-8 border-t border-gray-100 bg-white flex gap-4">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
                placeholder="Ask a specific question about this document's content..."
                className="flex-1 bg-gray-50 border border-gray-100 rounded-[1.5rem] px-8 py-5 text-lg outline-none focus:ring-4 focus:ring-green-100 focus:bg-white transition-all font-semibold placeholder:text-gray-400"
                disabled={isTyping}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="bg-green-600 text-white p-5 rounded-[1.5rem] hover:bg-green-700 disabled:bg-gray-200 transition-all shadow-xl shadow-green-100 active:scale-95 flex items-center justify-center"
              >
                <Send size={28} />
              </button>
            </div>
          </div>
        )}

        {/* AI Actions Tab */}
        {activeTab === 'actions' && (
          <div className="h-full p-8 lg:p-12 overflow-y-auto bg-gray-50/20">
            <div className="max-w-5xl mx-auto space-y-10">
              {/* Main AI Assistant Header */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">AI Assistant</h2>
                  <p className="text-sm font-medium text-gray-400">Powered by advanced AI</p>
                </div>
              </div>

              {/* Generate Summary Action */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">Generate Summary</h3>
                    <p className="text-sm font-medium text-gray-500">Get a concise summary of the entire document.</p>
                  </div>
                </div>
                <button 
                  onClick={generateSummary}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-green-50 hover:bg-green-700 active:scale-95 transition-all"
                >
                  Summarize
                </button>
              </div>

              {/* Explain a Concept Action */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">Explain a Concept</h3>
                    <p className="text-sm font-medium text-gray-500">Enter a topic or concept from the document to get a detailed explanation.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={conceptInput}
                      onChange={(e) => setConceptInput(e.target.value)}
                      placeholder="e.g. 'React Hooks'"
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-green-600 focus:bg-white px-8 py-5 rounded-[1.5rem] outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 shadow-sm"
                    />
                  </div>
                  <button 
                    onClick={explainConcept}
                    disabled={!conceptInput.trim() || isLoading}
                    className="bg-green-600/80 text-white px-10 py-5 rounded-[1.5rem] font-black hover:bg-green-700 active:scale-95 transition-all shadow-lg"
                  >
                    Explain
                  </button>
                </div>

                {/* Concept Results Display */}
                {explanation && (
                  <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 relative">
                    <div className="bg-gray-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      <button 
                        onClick={() => setExplanation(null)}
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                      <h4 className="font-black text-xs uppercase tracking-[0.3em] text-green-400 mb-6 flex items-center gap-2">
                        <Sparkle size={16} /> Explanation of "{conceptInput}"
                      </h4>
                      <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-lg whitespace-pre-wrap">
                        {explanation}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Master Summary Result (if generated via top button) */}
              {doc.summary && (
                <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl animate-in fade-in slide-in-from-bottom-8">
                  <div className="flex items-center gap-4 text-green-600 mb-10 border-b border-gray-50 pb-6">
                    <Sparkles size={28} />
                    <h4 className="font-black uppercase text-sm tracking-[0.4em]">MASTER DOCUMENT SUMMARY</h4>
                  </div>
                  <div className="prose prose-lg max-w-none text-gray-700 leading-[2] whitespace-pre-wrap font-semibold italic text-lg">
                    {doc.summary}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flashcards Tab */}
        {activeTab === 'flashcards' && (
          <div className="h-full p-12 flex flex-col items-center overflow-y-auto bg-gray-50/20">
            {flashcardSets.length === 0 ? (
              <div className="text-center py-24 max-w-2xl mx-auto bg-white p-16 rounded-[4rem] shadow-xl border border-gray-100">
                <div className="w-32 h-32 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-lg border border-green-100">
                  <BookOpen size={64} />
                </div>
                <h3 className="text-4xl font-black mb-6 tracking-tight">No Study Assets Yet</h3>
                <p className="text-xl text-gray-500 mb-12 font-medium leading-relaxed">Instantly transform the passive text in this document into an active learning study set with flashcards.</p>
                
                {/* Flashcard Count Selector */}
                <div className="max-w-xs mx-auto mb-12 space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Hash size={14} className="text-green-600" /> Card Density
                    </label>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-black shadow-lg shadow-green-100">{flashcardCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={flashcardCount}
                    onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">
                    <span>Essential (1)</span>
                    <span>Comprehensive (20)</span>
                  </div>
                </div>

                <button 
                  onClick={generateFlashcards} 
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-widest"
                >
                  Create Study Deck
                  <ChevronRight size={24} />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-2xl space-y-12 animate-in fade-in duration-700">
                <div className="flex items-center justify-between px-6 bg-white py-4 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-black text-xl text-gray-900">{flashcardSets[currentSetIdx].title}</h3>
                  <div className="px-5 py-2 bg-green-100 text-green-800 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                    CARD {cardIdx + 1} OF {flashcardSets[currentSetIdx].cards.length}
                  </div>
                </div>

                <div className={`perspective-1000 w-full aspect-[16/10] cursor-pointer group ${isFlipped ? 'flashcard-flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                  <div className="flashcard-inner relative w-full h-full text-center transition-transform duration-700 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[3rem]">
                    <div className="flashcard-front absolute inset-0 w-full h-full bg-white border-2 border-gray-100 rounded-[3rem] flex flex-col items-center justify-center p-16 shadow-inner ring-8 ring-white">
                      <p className="text-gray-300 text-xs font-black uppercase tracking-[0.4em] mb-10">KNOWLEDGE PROMPT</p>
                      <h4 className="text-2xl lg:text-4xl font-black text-gray-800 leading-tight">{flashcardSets[currentSetIdx].cards[cardIdx].question}</h4>
                      <div className="mt-auto flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-8 py-3 rounded-full border border-gray-100">
                        <RotateCcw size={16} /> Tap to reveal answer
                      </div>
                    </div>
                    <div className="flashcard-back absolute inset-0 w-full h-full bg-green-600 text-white rounded-[3rem] flex flex-col items-center justify-center p-16 shadow-2xl shadow-green-200 ring-8 ring-green-500">
                      <p className="text-green-200 text-xs font-black uppercase tracking-[0.4em] mb-10">THE DEFINITION</p>
                      <p className="text-2xl lg:text-3xl font-bold leading-relaxed">{flashcardSets[currentSetIdx].cards[cardIdx].answer}</p>
                      <div className="mt-auto flex items-center gap-3 text-xs font-black text-green-100 uppercase tracking-widest bg-green-700/50 px-8 py-3 rounded-full">
                        <RotateCcw size={16} /> Tap to see prompt
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-10">
                  <button 
                    disabled={cardIdx === 0}
                    onClick={() => { setCardIdx(cardIdx - 1); setIsFlipped(false); }}
                    className="w-20 h-20 flex items-center justify-center bg-white border-2 border-gray-100 text-gray-400 rounded-[2rem] shadow-xl disabled:opacity-20 hover:text-green-600 hover:border-green-100 transition-all hover:scale-110 active:scale-90"
                  >
                    <ChevronLeft size={36} />
                  </button>
                  <button 
                    onClick={() => {
                      const updated = [...flashcardSets];
                      updated[currentSetIdx].cards[cardIdx].isStarred = !updated[currentSetIdx].cards[cardIdx].isStarred;
                      setFlashcardSets(updated);
                      storageService.updateFlashcardSet(updated[currentSetIdx].id, { cards: updated[currentSetIdx].cards });
                    }}
                    className={`w-20 h-20 flex items-center justify-center rounded-[2rem] shadow-xl transition-all hover:scale-110 active:scale-90 ${
                      flashcardSets[currentSetIdx].cards[cardIdx].isStarred ? 'bg-yellow-400 text-white border-none' : 'bg-white border-2 border-gray-100 text-gray-300 hover:border-yellow-200'
                    }`}
                  >
                    <Star size={36} fill={flashcardSets[currentSetIdx].cards[cardIdx].isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    disabled={cardIdx === flashcardSets[currentSetIdx].cards.length - 1}
                    onClick={() => { setCardIdx(cardIdx + 1); setIsFlipped(false); }}
                    className="w-20 h-20 flex items-center justify-center bg-green-600 text-white rounded-[2rem] shadow-2xl shadow-green-100 disabled:bg-gray-200 hover:bg-green-700 transition-all hover:scale-110 active:scale-90"
                  >
                    <ChevronRight size={36} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="h-full p-12 overflow-y-auto bg-gray-50/10">
            {!activeQuiz ? (
              <div className="max-w-3xl mx-auto text-center py-24 bg-white p-20 rounded-[4rem] shadow-xl border border-gray-100">
                <div className="w-32 h-32 bg-purple-50 text-purple-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-lg border border-purple-100">
                  <Target size={64} />
                </div>
                <h3 className="text-4xl font-black mb-6 tracking-tight">Active Recall Challenge</h3>
                <p className="text-xl text-gray-500 mb-8 font-medium leading-relaxed">Our AI has mapped the core concepts of this document. Choose your assessment depth to begin.</p>
                
                {/* Question Count Selector */}
                <div className="max-w-xs mx-auto mb-12 space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Hash size={14} className="text-purple-600" /> Question Volume
                    </label>
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-black shadow-lg shadow-purple-100">{quizQuestionCount}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={quizQuestionCount}
                    onChange={(e) => setQuizQuestionCount(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    <span>Quick (1)</span>
                    <span>Intensive (20)</span>
                  </div>
                </div>

                <button 
                  onClick={generateQuiz} 
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-widest"
                >
                  Initialize Assessment
                  <ChevronRight size={24} />
                </button>
              </div>
            ) : showResults ? (
              <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
                <div className="text-center p-16 bg-gradient-to-br from-green-50 to-green-100 rounded-[4rem] border border-green-200 shadow-inner ring-8 ring-white">
                  <div className="w-32 h-32 bg-green-600 text-white rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-10 shadow-2xl ring-8 ring-white">
                    {activeQuiz.score}%
                  </div>
                  <h2 className="text-4xl font-black text-green-900 mb-4 tracking-tight">Certification Complete!</h2>
                  <p className="text-green-700 font-bold text-lg">You've successfully processed the core concepts of this material.</p>
                </div>

                <div className="space-y-8 pt-6">
                  <h3 className="font-black text-gray-900 border-b-2 border-gray-100 pb-4 flex items-center gap-4 text-xl">
                    <Sparkle size={24} className="text-green-600" />
                    KNOWLEDGE GAP ANALYSIS
                  </h3>
                  {activeQuiz.questions.map((q, i) => (
                    <div key={q.id} className={`p-10 rounded-[3.5rem] border-4 transition-all ${userAnswers[i] === q.correctIndex ? 'bg-white border-green-50 shadow-sm' : 'bg-red-50 border-red-50'}`}>
                      <div className="flex items-start gap-8">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xl shadow-lg ${
                          userAnswers[i] === q.correctIndex ? 'bg-green-600 text-white shadow-green-100' : 'bg-red-500 text-white shadow-red-100'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-gray-900 text-2xl mb-10 leading-tight">{q.question}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className={`p-6 rounded-[1.5rem] text-base border-2 flex items-center justify-between transition-all ${
                                optIdx === q.correctIndex ? 'bg-green-100 border-green-300 text-green-900 font-black shadow-inner' :
                                optIdx === userAnswers[i] ? 'bg-red-100 border-red-300 text-red-900 font-black shadow-inner' : 'bg-white border-gray-100 text-gray-400'
                              }`}>
                                <span className="flex-1 mr-4">{opt}</span>
                                {optIdx === q.correctIndex && <CheckCircle size={24} className="text-green-600 shrink-0" />}
                                {optIdx === userAnswers[i] && optIdx !== q.correctIndex && <XCircle size={24} className="text-red-600 shrink-0" />}
                              </div>
                            ))}
                          </div>
                          <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-lg text-gray-700 leading-relaxed shadow-inner">
                            <span className="font-black block mb-4 text-xs text-gray-400 uppercase tracking-[0.3em]">AI LOGIC EXPLANATION</span>
                            {q.explanation}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 pb-24">
                  <button 
                    onClick={() => { setActiveQuiz(null); setQuizStep(0); setShowResults(false); }} 
                    className="flex-1 flex items-center justify-center gap-4 bg-white border-4 border-gray-100 py-6 rounded-3xl font-black text-xl text-gray-700 hover:bg-gray-50 transition-all hover:border-gray-200 active:scale-95 shadow-lg"
                  >
                    <RotateCcw size={28} /> RESET & RETRY
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700">
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-black text-green-600 uppercase tracking-[0.4em]">ASSESSMENT PROGRESS</span>
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">STEP {quizStep + 1} / {activeQuiz.questions.length}</span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50 ring-4 ring-white">
                    <div className="h-full bg-green-500 transition-all duration-1000 ease-out shadow-lg" style={{ width: `${((quizStep + 1) / activeQuiz.questions.length) * 100}%` }}></div>
                  </div>
                </div>

                <div className="space-y-10 bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100 ring-8 ring-white">
                  <h2 className="text-3xl font-black text-gray-900 leading-snug">{activeQuiz.questions[quizStep].question}</h2>
                  <div className="grid gap-5">
                    {activeQuiz.questions[quizStep].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const updated = [...userAnswers];
                          updated[quizStep] = idx;
                          setUserAnswers(updated);
                        }}
                        className={`w-full text-left p-8 rounded-[2rem] border-4 transition-all group flex items-center justify-between shadow-sm ${
                          userAnswers[quizStep] === idx ? 'border-green-600 bg-green-50 shadow-green-50 ring-4 ring-green-100' : 'border-gray-50 hover:border-green-200 hover:bg-gray-50 hover:shadow-xl'
                        }`}
                      >
                        <span className={`text-xl font-bold transition-colors ${userAnswers[quizStep] === idx ? 'text-green-900' : 'text-gray-700 group-hover:text-gray-900'}`}>{option}</span>
                        <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all ${userAnswers[quizStep] === idx ? 'border-green-600 bg-green-600 scale-125 shadow-lg' : 'border-gray-200 bg-white group-hover:border-green-300'}`}>
                          {userAnswers[quizStep] === idx && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-inner animate-in zoom-in-50"></div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-10">
                  <button 
                    disabled={quizStep === 0}
                    onClick={() => setQuizStep(quizStep - 1)}
                    className="px-10 py-5 text-gray-400 font-black text-sm uppercase tracking-[0.3em] disabled:opacity-20 hover:text-gray-900 transition-all flex items-center gap-3"
                  >
                    <ChevronLeft size={20} /> GO BACK
                  </button>
                  {quizStep === activeQuiz.questions.length - 1 ? (
                    <button 
                      onClick={submitQuiz}
                      disabled={userAnswers[quizStep] === -1}
                      className="bg-green-600 text-white px-16 py-6 rounded-3xl font-black text-lg shadow-2xl shadow-green-100 hover:bg-green-700 transition-all disabled:bg-gray-200 active:scale-95 flex items-center gap-4 uppercase tracking-[0.2em]"
                    >
                      FINISH ASSESSMENT
                      <CheckCircle size={24} />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setQuizStep(quizStep + 1)}
                      disabled={userAnswers[quizStep] === -1}
                      className="bg-green-600 text-white px-16 py-6 rounded-3xl font-black text-lg shadow-2xl shadow-green-100 hover:bg-green-700 transition-all disabled:bg-gray-200 active:scale-95 flex items-center gap-4 uppercase tracking-[0.2em]"
                    >
                      PROCEED
                      <ChevronRight size={24} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetail;
