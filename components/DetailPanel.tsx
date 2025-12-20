
import React, { useRef, useEffect, useState } from 'react';
import { X, Quote, AlertTriangle, FileText, Eye, LayoutList, Download, Loader2, Sparkles, Send, Tag, Plus, MessageSquare, ExternalLink, ArrowRight, Copy, Check } from 'lucide-react';
import { ExtractedDocument, SchemaField, FileWithPreview, RedlineSuggestion } from '../types';
import mammoth from 'mammoth';
import { generateExecutiveSummary, askDocumentQuestion, suggestRedlines } from '../services/geminiService';

declare const pdfjsLib: any;

interface DetailPanelProps {
  document: ExtractedDocument | null;
  file?: FileWithPreview;
  schema: SchemaField[];
  selectedFieldKey: string | null;
  onClose: () => void;
  onUpdateDocument: (id: string, updates: Partial<ExtractedDocument>) => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ document, file, schema, selectedFieldKey, onClose, onUpdateDocument }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'data' | 'preview'>('data');
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // AI Feature States
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSuggestingRedlines, setIsSuggestingRedlines] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Q&A State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
    };
    if (document) {
      setTimeout(() => window.addEventListener('mousedown', handleClickOutside), 50);
      return () => window.removeEventListener('mousedown', handleClickOutside);
    }
  }, [document, onClose]);

  useEffect(() => {
    setActiveTab('data'); setDocxHtml(null); setQuestion(''); setAnswer(null); setPreviewError(null);
  }, [document?.id]);

  // PDF Rendering Logic
  useEffect(() => {
    if (activeTab === 'preview' && file?.type === 'pdf' && file.base64) {
      setIsLoadingPreview(true); setPreviewError(null);
      if (pdfContainerRef.current) pdfContainerRef.current.innerHTML = '';
      let isCancelled = false;

      const renderPdf = async () => {
        try {
          if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Convert base64 to Uint8Array for better stability in PDF.js
            const binaryString = atob(file.base64!);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const loadingTask = pdfjsLib.getDocument({ data: bytes });
            const pdf = await loadingTask.promise;
            
            if (isCancelled) return;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              if (isCancelled) break;
              const page = await pdf.getPage(pageNum);
              const canvas = window.document.createElement('canvas');
              canvas.className = "shadow-lg mb-6 max-w-full bg-white rounded-lg ring-1 ring-slate-200 dark:ring-slate-700";
              if (pdfContainerRef.current) pdfContainerRef.current.appendChild(canvas);
              
              const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for clarity
              canvas.height = viewport.height; 
              canvas.width = viewport.width;
              
              await page.render({ 
                canvasContext: canvas.getContext('2d'), 
                viewport 
              }).promise;
            }
          }
        } catch (e) { 
          console.error("PDF preview error:", e);
          if (!isCancelled) setPreviewError("Failed to render PDF preview."); 
        }
        finally { if (!isCancelled) setIsLoadingPreview(false); }
      };
      
      setTimeout(() => renderPdf(), 100);
      return () => { isCancelled = true; };
    }
  }, [activeTab, file]);

  // DOCX Rendering Logic
  useEffect(() => {
    if (activeTab === 'preview' && file?.type === 'docx' && file.base64 && !docxHtml) {
      setIsLoadingPreview(true);
      const renderDocx = async () => {
        try {
          const binaryString = atob(file.base64!);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
          setDocxHtml(result.value || '<p class="text-slate-400 italic">No content found in document.</p>');
        } catch (e) {
          console.error("DOCX preview error:", e);
          setDocxHtml('<p class="text-red-500">Failed to render document preview.</p>');
        } finally {
          setIsLoadingPreview(false);
        }
      };
      renderDocx();
    }
  }, [activeTab, file, docxHtml]);

  const handleGenerateSummary = async () => {
    if (!file || !document) return;
    setIsGeneratingSummary(true);
    try { const s = await generateExecutiveSummary(file); onUpdateDocument(document.id, { aiSummary: s }); }
    finally { setIsGeneratingSummary(false); }
  };

  const handleSuggestRedlines = async () => {
    if (!file || !document) return;
    setIsSuggestingRedlines(true);
    try { const r = await suggestRedlines(file); onUpdateDocument(document.id, { redlines: r }); }
    finally { setIsSuggestingRedlines(false); }
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!document) return null;
  const activeField = selectedFieldKey ? schema.find(f => f.key === selectedFieldKey) : null;
  
  return (
    <div ref={panelRef} className={`fixed inset-y-0 right-0 w-full ${activeTab === 'preview' ? 'md:w-[800px]' : 'md:w-[480px]'} bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 z-50 flex flex-col`}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
        <h2 className="text-lg font-bold flex items-center gap-2 truncate"><FileText className="w-5 h-5 text-brand-600" /> {document.fileName}</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('data')} className={`px-3 py-1 text-xs font-bold rounded-md ${activeTab === 'data' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>Data</button>
            <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 text-xs font-bold rounded-md ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>Preview</button>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
        </div>
      </div>

      {activeTab === 'data' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30">
            <h3 className="text-[10px] font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-widest flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4" /> AI Document Suite</h3>
            
            {!document.aiSummary ? (
              <button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="w-full py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors mb-3">
                {isGeneratingSummary ? "Generating..." : "Generate Summary"}
              </button>
            ) : (
              <div className="text-xs text-slate-700 dark:text-slate-300 mb-4 bg-white/50 dark:bg-slate-950/50 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 italic leading-relaxed">{document.aiSummary}</div>
            )}

            {!document.redlines ? (
              <button onClick={handleSuggestRedlines} disabled={isSuggestingRedlines} className="w-full py-2 bg-slate-900 text-white dark:bg-brand-600 rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                {isSuggestingRedlines ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />} Suggest Improvements
              </button>
            ) : (
              <div className="space-y-3 mt-4">
                 <h4 className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Redline Suggestions</h4>
                 {document.redlines.map((r, i) => (
                   <div key={i} className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-3 relative group">
                      <div className="text-[10px] text-red-500 font-bold mb-1 uppercase">Current</div>
                      <p className="text-xs text-slate-500 line-through mb-2 italic">{r.current}</p>
                      <div className="text-[10px] text-green-600 font-bold mb-1 uppercase">Suggested</div>
                      <p className="text-xs text-slate-900 dark:text-slate-100 font-medium">{r.suggested}</p>
                      <button onClick={() => handleCopyText(r.suggested, i)} className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200">
                        {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                   </div>
                 ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Extracted Fields</h3>
            {schema.map(f => {
              const item = document.data[f.key];
              if (!item) return null;
              const isSelected = selectedFieldKey === f.key;
              return (
                <div key={f.key} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-100' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
                   <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{f.label}</div>
                   <div className="text-sm font-bold text-slate-900 dark:text-white mb-2">{item.value}</div>
                   {isSelected && <div className="mt-3 pt-3 border-t border-brand-100 flex gap-2 italic text-xs text-brand-700"><Quote className="w-3.5 h-3.5 shrink-0" /> "{item.sourceQuote}"</div>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden relative p-4 flex flex-col">
          {file?.type === 'pdf' ? (
            <div className="w-full h-full flex flex-col relative overflow-y-auto custom-scrollbar bg-slate-200 dark:bg-slate-800 rounded-lg shadow-inner p-6">
              <div ref={pdfContainerRef} className="flex flex-col items-center"></div>
              {isLoadingPreview && <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>}
              {previewError && <div className="absolute inset-0 flex items-center justify-center text-red-500 font-medium">{previewError}</div>}
            </div>
          ) : file?.type === 'docx' ? (
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-lg shadow-inner p-8 overflow-y-auto custom-scrollbar prose dark:prose-invert max-w-none">
              {isLoadingPreview ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: docxHtml || '' }} />
              )}
            </div>
          ) : file?.type === 'image' ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-lg shadow-inner p-4 overflow-hidden">
               <img 
                 src={`data:${file.file.type};base64,${file.base64}`} 
                 alt="Document Preview" 
                 className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
               />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">Preview not available for this file type.</div>
          )}
          <div className="absolute bottom-6 right-6"><a href={`data:${file?.file.type};base64,${file?.base64}`} download={file?.file.name} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 text-xs font-bold transition-all uppercase tracking-wide"><Download className="w-3.5 h-3.5" /> Download</a></div>
        </div>
      )}
    </div>
  );
};

export default DetailPanel;
