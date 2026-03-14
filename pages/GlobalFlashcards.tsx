
import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, BookMarked, MoreVertical, Plus, X, FileText, Sparkles, Zap, ChevronLeft, ChevronRight, Star, RotateCcw, CheckCircle, Hash } from 'lucide-react';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Link } from 'react-router-dom';
import { Document, FlashcardSet, Flashcard } from '../types';

const GlobalFlashcards: React.FC = () => {
  const [sets, setSets] = useState(storageService.getFlashcardSets());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [flashcardCount, setFlashcardCount] = useState(8);
  
  // Study Mode State
  const [studyingSet, setStudyingSet] = useState<FlashcardSet | null>(null);
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const documents = storageService.getDocuments();

  const handleGenerateSet = async () => {
    if (!selectedDoc) return;
    setIsGenerating(true);
    try {
      const user = storageService.getCurrentSession();
      const cards = await geminiService.generateFlashcards(selectedDoc.extractedText, flashcardCount);
      const newSet: FlashcardSet = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.id || '1',
        documentId: selectedDoc.id,
        title: `Cards from ${selectedDoc.title}`,
        cards: cards.map((c: any) => ({
          ...c,
          id: Math.random().toString(36).substr(2, 9),
          isStarred: false,
          isReviewed: false
        })),
        createdAt: Date.now()
      };
      storageService.saveFlashcardSet(newSet);
      setSets(prev => [...prev, newSet]);
      setIsModalOpen(false);
      setSelectedDoc(null);
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate flashcards.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!studyingSet) return;
    const updatedCards = [...studyingSet.cards];
    updatedCards[cardIdx].isStarred = !updatedCards[cardIdx].isStarred;
    const updatedSet = { ...studyingSet, cards: updatedCards };
    setStudyingSet(updatedSet);
    storageService.updateFlashcardSet(studyingSet.id, { cards: updatedCards });
    setSets(storageService.getFlashcardSets());
  };

  const markReviewed = () => {
    if (!studyingSet) return;
    const updatedCards = [...studyingSet.cards];
    updatedCards[cardIdx].isReviewed = true;
    const updatedSet = { ...studyingSet, cards: updatedCards };
    setStudyingSet(updatedSet);
    storageService.updateFlashcardSet(studyingSet.id, { cards: updatedCards });
    setSets(storageService.getFlashcardSets());
  };

  const filteredSets = sets.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render Study Mode UI
  if (studyingSet) {
    const currentCard = studyingSet.cards[cardIdx];
    const reviewedCount = studyingSet.cards.filter(c => c.isReviewed).length;
    const progress = Math.round((reviewedCount / studyingSet.cards.length) * 100);

    return (
      <div className="fixed inset-0 z-[110] bg-gray-50 flex flex-col animate-in fade-in duration-300">
        {/* Study Header */}
        <div className="h-24 bg-white border-b border-gray-100 flex items-center justify-between px-8 lg:px-12 shrink-0">
          <button 
            onClick={() => { setStudyingSet(null); setCardIdx(0); setIsFlipped(false); }}
            className="flex items-center gap-3 text-gray-500 hover:text-green-600 font-bold transition-all"
          >
            <ChevronLeft size={24} />
            Exit Study Mode
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-black text-gray-900 leading-tight">{studyingSet.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">PROGRESS</span>
              <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-[10px] font-black text-green-600 tracking-widest">{progress}%</span>
            </div>
          </div>

          <div className="w-32"></div> {/* Spacer */}
        </div>

        {/* Study Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center gap-12">
          <div className="w-full max-w-3xl flex flex-col items-center gap-12">
            
            <div className="flex items-center justify-between w-full px-4">
              <div className="px-5 py-2 bg-green-100 text-green-800 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                CARD {cardIdx + 1} OF {studyingSet.cards.length}
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleStar}
                  className={`p-3 rounded-xl transition-all ${currentCard.isStarred ? 'bg-yellow-400 text-white shadow-lg' : 'bg-white text-gray-300 border border-gray-100'}`}
                >
                  <Star size={20} fill={currentCard.isStarred ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* The Flashcard */}
            <div 
              className={`perspective-1000 w-full aspect-[16/10] cursor-pointer group ${isFlipped ? 'flashcard-flipped' : ''}`} 
              onClick={() => {
                setIsFlipped(!isFlipped);
                if (!isFlipped) markReviewed();
              }}
            >
              <div className="flashcard-inner relative w-full h-full text-center transition-transform duration-700 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[3rem]">
                {/* Front */}
                <div className="flashcard-front absolute inset-0 w-full h-full bg-white border-2 border-gray-100 rounded-[3rem] flex flex-col items-center justify-center p-16 shadow-inner ring-8 ring-white">
                  <p className="text-gray-300 text-xs font-black uppercase tracking-[0.4em] mb-10">KNOWLEDGE PROMPT</p>
                  <h4 className="text-2xl lg:text-4xl font-black text-gray-800 leading-tight">{currentCard.question}</h4>
                  <div className="mt-auto flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-8 py-3 rounded-full border border-gray-100">
                    <RotateCcw size={16} /> Tap to reveal answer
                  </div>
                </div>
                {/* Back */}
                <div className="flashcard-back absolute inset-0 w-full h-full bg-green-600 text-white rounded-[3rem] flex flex-col items-center justify-center p-16 shadow-2xl shadow-green-200 ring-8 ring-green-500">
                  <p className="text-green-200 text-xs font-black uppercase tracking-[0.4em] mb-10">THE DEFINITION</p>
                  <p className="text-2xl lg:text-3xl font-bold leading-relaxed">{currentCard.answer}</p>
                  <div className="mt-auto flex items-center gap-3 text-xs font-black text-green-100 uppercase tracking-widest bg-green-700/50 px-8 py-3 rounded-full">
                    <RotateCcw size={16} /> Tap to see prompt
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center gap-10">
              <button 
                disabled={cardIdx === 0}
                onClick={() => { setCardIdx(cardIdx - 1); setIsFlipped(false); }}
                className="w-20 h-20 flex items-center justify-center bg-white border-2 border-gray-100 text-gray-400 rounded-[2rem] shadow-xl disabled:opacity-20 hover:text-green-600 hover:border-green-100 transition-all hover:scale-110 active:scale-90"
              >
                <ChevronLeft size={36} strokeWidth={3} />
              </button>

              <button 
                disabled={cardIdx === studyingSet.cards.length - 1}
                onClick={() => { setCardIdx(cardIdx + 1); setIsFlipped(false); }}
                className="w-20 h-20 flex items-center justify-center bg-green-600 text-white rounded-[2rem] shadow-2xl shadow-green-100 disabled:bg-gray-200 hover:bg-green-700 transition-all hover:scale-110 active:scale-90"
              >
                <ChevronRight size={36} strokeWidth={3} />
              </button>
            </div>

            {cardIdx === studyingSet.cards.length - 1 && isFlipped && (
               <button 
                  onClick={() => { setStudyingSet(null); setCardIdx(0); setIsFlipped(false); }}
                  className="mt-8 bg-white border-2 border-green-600 text-green-600 px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-green-50 transition-all"
               >
                 Complete Session <CheckCircle size={24} />
               </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Search Header Area */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-center w-full">
          <div className="relative w-full max-w-2xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Search across your library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-green-50 focus:border-green-200 transition-all text-lg font-medium placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Study Center</h1>
            <p className="text-gray-500 font-medium text-lg mt-1">Master your subjects with high-frequency active recall.</p>
          </div>
          <button 
            onClick={() => { setIsModalOpen(true); setSelectedDoc(null); }}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-100 hover:shadow-green-200 active:scale-95 shrink-0 uppercase tracking-widest text-sm"
          >
            <Plus size={24} strokeWidth={3} /> New Study Set
          </button>
        </div>
      </div>

      {/* Grid of Flashcard Sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {filteredSets.length > 0 ? filteredSets.map((set) => {
          const reviewed = set.cards.filter(c => c.isReviewed).length;
          const progress = Math.round((reviewed / set.cards.length) * 100) || 0;
          
          return (
            <div key={set.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden ring-1 ring-gray-50">
               <div className="absolute top-6 right-10 flex items-center gap-2">
                  <button className="p-2 text-gray-300 hover:text-gray-600 rounded-xl transition-all">
                    <MoreVertical size={24} />
                  </button>
               </div>

              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner border border-green-100 group-hover:scale-110 transition-transform">
                  <BookMarked size={36} />
                </div>
              </div>

              <h3 className="font-black text-2xl mb-2 text-gray-900 leading-tight group-hover:text-green-700 transition-colors line-clamp-2">{set.title}</h3>
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-12">{set.cards.length} INTERACTIVE CARDS</p>

              <div className="mt-auto space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">MASTERY</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600">{progress}% COMPLETE</span>
                </div>
                <div className="h-2 bg-gray-50 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-100">
                  <div 
                    className="h-full bg-green-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <button 
                  onClick={() => { setStudyingSet(set); setCardIdx(0); setIsFlipped(false); }}
                  className="w-full mt-8 bg-green-600 text-white py-5 rounded-[1.25rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl shadow-green-100 active:scale-95 uppercase tracking-widest"
                >
                  START STUDY SESSION <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-40 bg-white border-4 border-dashed border-gray-100 rounded-[4rem] text-center shadow-inner flex flex-col items-center">
            <div className="w-40 h-40 bg-gray-50 text-gray-100 rounded-full flex items-center justify-center mb-10 ring-8 ring-white shadow-xl">
              <BookOpen size={80} />
            </div>
            <h3 className="text-4xl font-black text-gray-200 tracking-tighter mb-4">No Study Assets Found</h3>
            <p className="text-gray-400 text-xl font-medium max-w-md mx-auto mb-12">Select a document to instantly generate professional revision flashcards.</p>
            <button 
              onClick={() => { setIsModalOpen(true); setSelectedDoc(null); }}
              className="bg-green-600 text-white px-12 py-5 rounded-3xl font-black text-lg shadow-2xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all flex items-center gap-4"
            >
              <Plus size={24} /> Initialize Revision Set
            </button>
          </div>
        )}
      </div>

      {/* New Study Set Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 relative">
            <div className="p-10 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-100">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedDoc ? 'Configure Study Set' : 'New Study Set'}</h2>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-0.5">
                    {selectedDoc ? 'Choose card count' : 'Select a source document'}
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsModalOpen(false); setSelectedDoc(null); }} className="p-3 text-gray-400 hover:bg-gray-100 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {!selectedDoc ? (
                <div className="space-y-4">
                  {documents.length > 0 ? documents.map(doc => {
                    const hasSet = sets.some(s => s.documentId === doc.id);
                    return (
                      <button 
                        key={doc.id}
                        disabled={hasSet || isGenerating}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full flex items-center justify-between p-6 rounded-[1.5rem] border-2 transition-all text-left ${
                          hasSet 
                            ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' 
                            : 'border-gray-50 hover:border-green-600 hover:bg-green-50/30 hover:shadow-xl hover:-translate-y-1'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`p-4 rounded-xl ${hasSet ? 'bg-gray-200 text-gray-400' : 'bg-red-50 text-red-500 shadow-sm'}`}>
                            <FileText size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-gray-800 line-clamp-1">{doc.title}</h4>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                              {hasSet ? 'Flashcards already exist' : 'Ready for AI Extraction'}
                            </p>
                          </div>
                        </div>
                        {!hasSet && <Zap size={20} className="text-green-500" />}
                      </button>
                    );
                  }) : (
                    <div className="text-center py-20">
                      <FileText size={48} className="mx-auto text-gray-200 mb-6" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No documents available</p>
                      <Link to="/documents" className="mt-4 text-green-600 font-black underline underline-offset-4">Upload PDFs first</Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-12 animate-in slide-in-from-right-4">
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                    <FileText className="text-red-500" size={32} />
                    <div>
                      <h4 className="font-black text-gray-900">{selectedDoc.title}</h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Source Material</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Hash size={14} className="text-green-600" /> Card Density
                      </label>
                      <span className="bg-green-600 text-white px-4 py-1 rounded-xl text-sm font-black shadow-lg shadow-green-100">{flashcardCount} CARDS</span>
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
                      <span>Quick Glance (1)</span>
                      <span>Deep Mastery (20)</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedDoc(null)}
                      className="flex-1 py-5 bg-gray-50 text-gray-400 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleGenerateSet}
                      className="flex-[2] py-5 bg-green-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-3"
                    >
                      Initialize Generation <Sparkles size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-8 shadow-sm"></div>
                <h3 className="text-3xl font-black text-green-900 tracking-tight">AI Content Mapping...</h3>
                <p className="text-green-600 font-bold text-lg mt-4 max-w-sm">We're analyzing the document to create high-frequency revision cards.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalFlashcards;
