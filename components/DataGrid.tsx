
import React, { useState, useMemo } from 'react';
import { 
  Search, Download, ChevronRight, CheckSquare, Square,
  MoreHorizontal, Trash2, CheckCircle, FileDiff, Filter
} from 'lucide-react';
import { ExtractedDocument, SchemaField, ExtractionValue, FileWithPreview } from '../types';

interface DataGridProps {
  documents: ExtractedDocument[];
  files: FileWithPreview[];
  schema: SchemaField[];
  onCellClick: (doc: ExtractedDocument, fieldKey: string) => void;
  documentType: string;
  filteredIds: string[] | null;
  selectedIds: string[];
  activeTagFilter: string | null;
  onFilterTag: (tag: string | null) => void;
  onToggleSelect: (id: string) => void;
  onCompare: () => void;
  onSelectAll: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onMarkReviewed: (ids: string[]) => void;
  onUpdateDocument: (id: string, updates: Partial<ExtractedDocument>) => void;
}

const DataGrid: React.FC<DataGridProps> = ({ 
  documents, files, schema, onCellClick, filteredIds, selectedIds, activeTagFilter, onFilterTag, onToggleSelect, onCompare, onSelectAll, onDelete, onMarkReviewed, onUpdateDocument
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  const TAGS = ['Needs Review', 'Approved', 'Flagged', 'In Progress'];

  const filteredAndSortedDocs = useMemo(() => {
    let docs = [...documents];
    if (filteredIds) docs = docs.filter(doc => filteredIds.includes(doc.id));
    if (activeTagFilter) docs = docs.filter(doc => doc.tags?.includes(activeTagFilter));
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      docs = docs.filter(doc => doc.fileName.toLowerCase().includes(lowerTerm) || Object.values(doc.data).some((val: ExtractionValue) => val.value.toLowerCase().includes(lowerTerm)));
    }
    if (sortConfig) {
      docs.sort((a, b) => {
        if (sortConfig.key === 'risk') {
           const score = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
           return sortConfig.direction === 'asc' ? score[a.risk.level] - score[b.risk.level] : score[b.risk.level] - score[a.risk.level];
        }
        const aVal = a.data[sortConfig.key]?.value || '';
        const bVal = b.data[sortConfig.key]?.value || '';
        return sortConfig.direction === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
      });
    }
    return docs;
  }, [documents, searchTerm, sortConfig, filteredIds, activeTagFilter]);

  const handleExportCSV = () => {
    const docs = selectedIds.length > 0 ? filteredAndSortedDocs.filter(d => selectedIds.includes(d.id)) : filteredAndSortedDocs;
    const headers = ['File Name', 'Risk', ...schema.map(f => f.label)];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...docs.map(doc => [doc.fileName, doc.risk.level, ...schema.map(f => `"${(doc.data[f.key]?.value || '').replace(/"/g, '""')}"`)].join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "docugrid_export.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Needs Review': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'Flagged': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-4">
           {selectedIds.length > 0 ? (
             <div className="flex items-center gap-3">
               <span className="text-sm font-semibold text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">{selectedIds.length} selected</span>
               <div className="relative">
                 <button onClick={() => setShowBulkActions(!showBulkActions)} className="flex items-center gap-2 text-sm font-medium bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-md hover:opacity-90">Actions <MoreHorizontal className="w-4 h-4" /></button>
                 {showBulkActions && (
                   <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-30 flex flex-col p-1">
                     <button onClick={() => { onCompare(); setShowBulkActions(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"><FileDiff className="w-4 h-4" /> Compare</button>
                     <button onClick={() => { onMarkReviewed(selectedIds); setShowBulkActions(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-brand-600"><CheckCircle className="w-4 h-4" /> Mark Reviewed</button>
                     <button onClick={() => { onDelete(selectedIds); setShowBulkActions(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-600"><Trash2 className="w-4 h-4" /> Delete</button>
                   </div>
                 )}
               </div>
             </div>
           ) : (
             <div className="flex items-center gap-3">
               <Filter className="w-4 h-4 text-slate-400" />
               <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button onClick={() => onFilterTag(null)} className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${activeTagFilter === null ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>All</button>
                  {TAGS.map(tag => (
                    <button key={tag} onClick={() => onFilterTag(tag)} className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all whitespace-nowrap ${activeTagFilter === tag ? getTagColor(tag) + ' ring-2 ring-brand-500' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>{tag}</button>
                  ))}
               </div>
             </div>
           )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 w-44" />
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"><Download className="w-4 h-4" /> Export</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full border-collapse text-left min-w-max">
          <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border-b border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-50 dark:bg-slate-950 z-20 w-12 text-center">
                 <button onClick={() => onSelectAll(filteredAndSortedDocs.map(d => d.id))} className="text-slate-400 hover:text-brand-600">{filteredAndSortedDocs.length > 0 && selectedIds.length === filteredAndSortedDocs.length ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5" />}</button>
              </th>
              <th className="p-4 border-b border-r border-slate-200 dark:border-slate-800 font-bold text-slate-600 text-[10px] uppercase tracking-wider sticky left-12 bg-slate-50 dark:bg-slate-950 z-20 w-64">Document Name</th>
              <th className="p-4 border-b border-r border-slate-200 font-bold text-slate-600 text-[10px] uppercase tracking-wider cursor-pointer w-32" onClick={() => setSortConfig({ key: 'risk', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' })}>Risk Level</th>
              {schema.map(field => (
                <th key={field.key} className="p-4 border-b border-slate-200 font-bold text-slate-600 text-[10px] uppercase tracking-wider min-w-[160px]">{field.label}</th>
              ))}
              <th className="p-4 border-b border-slate-200 sticky right-0 bg-slate-50 z-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAndSortedDocs.map((doc) => (
              <tr key={doc.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${doc.reviewed ? 'opacity-60' : ''}`}>
                <td className="p-4 border-r border-slate-100 bg-white dark:bg-slate-900 group-hover:bg-slate-50 sticky left-0 z-10 text-center"><button onClick={() => onToggleSelect(doc.id)} className="text-slate-400 hover:text-brand-600">{selectedIds.includes(doc.id) ? <CheckSquare className="w-5 h-5 text-brand-600" /> : <Square className="w-5 h-5" />}</button></td>
                <td className="p-4 border-r border-slate-100 bg-white dark:bg-slate-900 group-hover:bg-slate-50 sticky left-12 z-10">
                  <div className="flex flex-col truncate max-w-[180px]">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{doc.fileName}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags?.map(tag => <span key={tag} className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${getTagColor(tag)}`}>{tag}</span>)}
                    </div>
                  </div>
                </td>
                <td className="p-4 border-r border-slate-100 cursor-pointer" onClick={() => onCellClick(doc, 'risk')}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${doc.risk.level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' : doc.risk.level === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900' : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'}`}>{doc.risk.level}</span>
                </td>
                {schema.map(field => (
                  <td key={field.key} className={`p-4 text-sm cursor-pointer ${field.key === 'riskFlags' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`} onClick={() => onCellClick(doc, field.key)}>
                    <div className="flex items-center justify-between group/cell truncate max-w-[150px]">
                      {doc.data[field.key]?.value || '—'}
                      <ChevronRight className="w-3 h-3 text-brand-500 opacity-0 group-hover/cell:opacity-100" />
                    </div>
                  </td>
                ))}
                <td className="p-4 bg-white dark:bg-slate-900 group-hover:bg-slate-50 sticky right-0 z-10">
                  <div className="relative">
                    <button onClick={() => setActiveActionMenuId(activeActionMenuId === doc.id ? null : doc.id)} className="p-1 rounded hover:bg-slate-200 text-slate-400"><MoreHorizontal className="w-4 h-4" /></button>
                    {activeActionMenuId === doc.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-1 flex flex-col text-left">
                        {TAGS.map(tag => (
                          <button key={tag} onClick={() => { onUpdateDocument(doc.id, { tags: doc.tags?.includes(tag) ? doc.tags.filter(t => t !== tag) : [...(doc.tags || []), tag] }); setActiveActionMenuId(null); }} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 rounded-md">
                            {tag} {doc.tags?.includes(tag) && <CheckCircle className="w-3 h-3 text-brand-600" />}
                          </button>
                        ))}
                        <button onClick={() => onDelete([doc.id])} className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t mt-1">Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataGrid;
