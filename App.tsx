
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  FileUp, Moon, Sun, Database, Search, FolderOpen, Sparkles,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { AppState, AppStatus, FileWithPreview, ExtractedDocument, SavedProject, UNIVERSAL_SCHEMA } from './types';
import { extractDocumentData, processFile, generateBatchInsights, processNaturalLanguageQuery } from './services/geminiService';
import DataGrid from './components/DataGrid';
import DetailPanel from './components/DetailPanel';
import Dashboard from './components/Dashboard';
import ComparisonModal from './components/ComparisonModal';
import { Toast, ToastMessage } from './components/Toast';
import { SaveProjectModal } from './components/SaveProjectModal';
import { ConfirmDialog } from './components/ConfirmDialog';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [state, setState] = useState<AppState>({
    status: AppStatus.IDLE,
    statusMessage: '',
    schema: UNIVERSAL_SCHEMA,
    documents: [],
    files: [],
    insights: [],
    filteredDocIds: null,
    compareMode: false,
    selectedDocIds: [],
    activeRiskFilter: null,
    activeTagFilter: null
  });
  
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
    localStorage.setItem('sidebar_expanded', JSON.stringify(!isSidebarExpanded));
  };
  
  const [searchQuery, setSearchQuery] = useState('');
  const [detailView, setDetailView] = useState<{ doc: ExtractedDocument | null; fieldKey: string | null; }>({ doc: null, fieldKey: null });
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean; confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => setToast({ id: Date.now().toString(), message, type });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    let interval: any;
    if (state.status === AppStatus.EXTRACTING_DATA) {
      setProcessingTime(0);
      interval = setInterval(() => setProcessingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    const saved = localStorage.getItem('docugrid_projects');
    if (saved) setSavedProjects(JSON.parse(saved));
  }, []);

  const handleUpdateDocument = (id: string, updates: Partial<ExtractedDocument>) => {
    setState(prev => {
      const newDocs = prev.documents.map(d => d.id === id ? { ...d, ...updates } : d);
      if (detailView.doc?.id === id) setDetailView(curr => ({ ...curr, doc: { ...curr.doc!, ...updates } }));
      return { ...prev, documents: newDocs };
    });
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    
    setState(prev => ({ ...prev, status: AppStatus.EXTRACTING_DATA, statusMessage: `Preprocessing ${fileList.length} files...` }));

    try {
      const newFiles: FileWithPreview[] = await Promise.all(fileList.map(async f => {
        const { base64 } = await processFile(f);
        let type: 'pdf' | 'image' | 'docx' = 'pdf';
        if (f.type.startsWith('image/')) type = 'image';
        if (f.name.endsWith('.docx')) type = 'docx';
        return { file: f, id: Math.random().toString(36).substring(7), base64, type };
      }));

      const extractedDocs: ExtractedDocument[] = [];
      for (let i = 0; i < newFiles.length; i++) {
          setState(prev => ({ ...prev, statusMessage: `AI Extraction (${i + 1}/${newFiles.length})...` }));
          const processed = await processFile(newFiles[i].file);
          const doc = await extractDocumentData(processed, newFiles[i].file.name, newFiles[i].id, UNIVERSAL_SCHEMA);
          extractedDocs.push(doc);
      }

      const insights = await generateBatchInsights(extractedDocs);
      setState(prev => ({ ...prev, status: AppStatus.COMPLETE, documents: extractedDocs, files: [...prev.files, ...newFiles], insights, statusMessage: 'Ready' }));
      showToast('Matter processed successfully', 'success');
    } catch (e: any) {
      setState(prev => ({ ...prev, status: AppStatus.ERROR, statusMessage: e.message }));
      showToast('Processing failed', 'error');
    }
  }, []);

  const handleNLQuery = async (query: string = searchQuery) => {
    if (!query) return;
    try {
      const ids = await processNaturalLanguageQuery(query, state.documents);
      setState(prev => ({ ...prev, filteredDocIds: ids }));
    } catch (e) { showToast("AI query failed", "error"); }
  };

  const isComplete = state.status === AppStatus.COMPLETE;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <SaveProjectModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={(name) => {
        const newProject: SavedProject = { id: Date.now().toString(), name, createdAt: new Date().toLocaleDateString(), updatedAt: new Date().toLocaleDateString(), files: state.files.map(f => ({ id: f.id, name: f.file.name, type: f.file.type, data: f.base64 || '', docType: f.type })), documents: state.documents, insights: state.insights };
        const updated = [newProject, ...savedProjects];
        localStorage.setItem('docugrid_projects', JSON.stringify(updated));
        setSavedProjects(updated);
        showToast(`'${name}' saved.`, 'success');
      }} defaultName={`Matter ${new Date().toLocaleDateString()}`} />
      
      <ConfirmDialog isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} />

      {/* Sidebar */}
      <div className={`${isSidebarExpanded ? 'w-64' : 'w-20'} flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300`}>
        <div className="p-6 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Database className="w-6 h-6" /></div>
              {isSidebarExpanded && <span className="font-bold text-lg">DocuGrid AI</span>}
           </div>
           <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
             {isSidebarExpanded ? <ChevronLeft /> : <ChevronRight />}
           </button>
        </div>
        <nav className="flex-1 px-3 space-y-2">
          <button onClick={() => setState(prev => ({ ...prev, status: AppStatus.IDLE }))} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium transition-all">
            <FileUp className="w-6 h-6" /> 
            {isSidebarExpanded && "New Extraction"}
          </button>
          <button onClick={() => setShowProjectMenu(!showProjectMenu)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium transition-all">
            <FolderOpen className="w-6 h-6" /> 
            {isSidebarExpanded && "Saved Matters"}
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-6 flex items-center justify-between shadow-sm backdrop-blur-md">
          <div className="flex-1 flex items-center gap-4">
            {isComplete && (
              <div className="w-full max-w-xl relative">
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-full bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:text-slate-200" 
                  placeholder="AI Search: 'Find high risk leases'..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleNLQuery()} 
                />
                <Sparkles className="absolute left-3 top-2.5 w-4 h-4 text-brand-500" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 ml-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="p-2 w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isComplete && (
              <button 
                onClick={() => setShowSaveModal(true)} 
                className="px-4 py-2 bg-slate-900 text-white dark:bg-brand-600 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:bg-slate-800 dark:hover:bg-brand-700 transition-all active:scale-95"
              >
                Save Matter
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden p-6 relative">
          {state.status === AppStatus.IDLE && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
               <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl"><Sparkles /></div>
               <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">DocuGrid AI</h2>
               <p className="text-slate-500 mb-8 max-w-md text-lg">Enterprise Document Intelligence</p>
               <label className="w-full max-w-lg h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all bg-white/50 dark:bg-slate-900/50 group">
                  <FileUp className="w-10 h-10 text-brand-500 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Drop legal files here</span>
                  <p className="text-xs text-slate-400 mt-2">Support for PDF, DOCX, and Images</p>
                  <input type="file" className="hidden" multiple onChange={handleFileUpload} />
               </label>
            </div>
          )}

          {state.status === AppStatus.EXTRACTING_DATA && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin"></div>
              <p className="mt-8 font-black text-lg text-slate-900 dark:text-white uppercase tracking-widest">{state.statusMessage}</p>
              <p className="text-slate-400 mt-2 text-sm">Processing time: {processingTime}s</p>
            </div>
          )}

          {isComplete && (
            <div className="flex flex-col h-full gap-6">
              <Dashboard documents={state.documents} insights={state.insights} activeRiskFilter={state.activeRiskFilter} onFilterRisk={(l) => setState(prev => ({ ...prev, activeRiskFilter: l }))} />
              <div className="flex-1 min-h-0">
                <DataGrid 
                  documents={state.documents} 
                  files={state.files} 
                  schema={state.schema} 
                  documentType="Universal" 
                  filteredIds={state.filteredDocIds} 
                  selectedIds={state.selectedDocIds} 
                  activeTagFilter={state.activeTagFilter}
                  onFilterTag={(t) => setState(prev => ({ ...prev, activeTagFilter: t }))}
                  onToggleSelect={(id) => setState(prev => ({ ...prev, selectedDocIds: prev.selectedDocIds.includes(id) ? prev.selectedDocIds.filter(i => i !== id) : [...prev.selectedDocIds, id] }))} 
                  onCellClick={(doc, fieldKey) => setDetailView({ doc, fieldKey })} 
                  onCompare={() => setState(prev => ({ ...prev, compareMode: true }))} 
                  onSelectAll={(ids) => setState(prev => ({ ...prev, selectedDocIds: prev.selectedDocIds.length === ids.length ? [] : ids }))} 
                  onDelete={(ids) => setState(prev => ({ ...prev, documents: prev.documents.filter(d => !ids.includes(d.id)), selectedDocIds: [] }))} 
                  onMarkReviewed={(ids) => setState(prev => ({ ...prev, documents: prev.documents.map(d => ids.includes(d.id) ? { ...d, reviewed: true } : d), selectedDocIds: [] }))} 
                  onUpdateDocument={handleUpdateDocument} 
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {detailView.doc && <DetailPanel document={detailView.doc} file={state.files.find(f => f.id === detailView.doc?.id)} schema={state.schema} selectedFieldKey={detailView.fieldKey} onClose={() => setDetailView({ doc: null, fieldKey: null })} onUpdateDocument={handleUpdateDocument} />}
      {state.compareMode && <ComparisonModal documents={state.documents.filter(d => state.selectedDocIds.includes(d.id))} schema={state.schema} onClose={() => setState(prev => ({ ...prev, compareMode: false }))} />}
    </div>
  );
};

export default App;
