
import React, { useState, useRef } from 'react';
import { Plus, FileText, Search, ExternalLink, Trash2, Clock, Filter } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Document } from '../types';
import { Link } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';

// Set up the worker for PDF.js using a matching version from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

const Documents: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>(storageService.getDocuments());
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (dataUrl: string): Promise<string> => {
    try {
      const loadingTask = pdfjs.getDocument(dataUrl);
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Extract text items and join them with spaces
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText.trim() || "No readable text found in this PDF.";
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      return "Error extracting text content from the document.";
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please use a PDF under 10MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      const base64Data = await readFileAsBase64(file);
      
      // Perform actual text extraction instead of using a placeholder
      const extractedText = await extractTextFromPDF(base64Data);
      
      const user = storageService.getCurrentSession();
      const newDoc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user?.id || '1',
        title: file.name.replace('.pdf', ''),
        filePath: base64Data,
        extractedText: extractedText,
        createdAt: Date.now()
      };
      
      storageService.saveDocument(newDoc);
      setDocs(prev => [...prev, newDoc]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to process the document.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteDoc = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      storageService.deleteDocument(id);
      setDocs(docs.filter(d => d.id !== id));
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-gray-500 mt-1 font-medium text-lg">Manage your study documents and research materials.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-100 hover:shadow-green-200 active:scale-95 shrink-0"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus size={24} />
          )}
          {isUploading ? 'Extracting Content...' : 'Upload New PDF'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf" 
          onChange={handleFileUpload} 
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 flex items-center gap-3 bg-gray-50 px-5 py-3.5 rounded-2xl w-full border border-gray-100 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-200 transition-all">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-base w-full font-medium placeholder:text-gray-400"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 shrink-0">
            <Filter size={18} />
            Filters
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredDocs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                    <th className="px-8 py-4">Document Name</th>
                    <th className="px-8 py-4">Added On</th>
                    <th className="px-8 py-4">Size</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100 shadow-sm group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{doc.title}</p>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5 block">PDF File</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">2.4 MB</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            to={`/documents/${doc.id}`}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-green-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-50 hover:border-green-100 transition-all shadow-sm"
                          >
                            <ExternalLink size={16} /> Open
                          </Link>
                          <button 
                            onClick={() => deleteDoc(doc.id)}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-24 text-center">
              <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={64} className="text-gray-200" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Your research library is empty. Start by uploading your first PDF document.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg"
              >
                Upload Your First File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
