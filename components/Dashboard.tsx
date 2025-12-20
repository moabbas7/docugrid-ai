
import React, { useState } from 'react';
import { CheckCircle, TrendingUp, Lightbulb, X, ClipboardCheck, AlertCircle } from 'lucide-react';
import { ExtractedDocument, BatchInsight } from '../types';

interface DashboardProps {
  documents: ExtractedDocument[];
  insights: BatchInsight[];
  activeRiskFilter: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  onFilterRisk: (level: 'HIGH' | 'MEDIUM' | 'LOW' | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ documents, insights, activeRiskFilter, onFilterRisk }) => {
  const [showInsightModal, setShowInsightModal] = useState(false);
  
  const riskCounts = documents.reduce((acc, doc) => {
    acc[doc.risk.level]++;
    return acc;
  }, { HIGH: 0, MEDIUM: 0, LOW: 0 });

  const total = documents.length;
  const keyInsightText = insights.length > 0 ? insights[0].text : "Analysing document patterns...";

  // Compliance Checklist Logic
  const checklist = {
    parties: documents.filter(d => d.data.partyA?.value && d.data.partyB?.value).length,
    dates: documents.filter(d => d.data.effectiveDate?.value).length,
    notice: documents.filter(d => d.data.noticePeriod?.value).length,
    termination: documents.filter(d => d.data.terminationClause?.value).length,
    jurisdiction: documents.filter(d => d.data.jurisdiction?.value).length
  };

  const checkItem = (count: number) => {
    const isComplete = count === total && total > 0;
    return {
      isComplete,
      icon: isComplete ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />
    };
  };

  const getRiskCardStyle = (level: string, isActive: boolean) => {
    if (isActive) {
      return 'bg-slate-900 dark:bg-white ring-2 ring-brand-500';
    }
    switch (level) {
      case 'HIGH':
        return 'bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60';
      case 'MEDIUM':
        return 'bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60';
      case 'LOW':
        return 'bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60';
      default:
        return 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700';
    }
  };

  const getRiskTextStyle = (level: string, isActive: boolean) => {
    if (isActive) {
      return level === 'HIGH' ? 'text-red-400' : 'text-brand-500';
    }
    switch (level) {
      case 'HIGH': return 'text-red-700 dark:text-red-400';
      case 'MEDIUM': return 'text-amber-700 dark:text-amber-400';
      case 'LOW': return 'text-green-700 dark:text-green-400';
      default: return 'text-slate-600 dark:text-slate-300';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        {/* Total & Risk (Combined 2 columns) */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
           <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative group min-h-[160px]">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Docs</p>
              <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{total}</p>
           </div>
           
           <div className="col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Risk Analysis</p>
              </div>
              <div className="flex gap-2 h-full py-1">
                {(['HIGH', 'MEDIUM', 'LOW'] as const).map(level => (
                  <button 
                    key={level}
                    onClick={() => onFilterRisk(level)}
                    className={`flex-1 rounded-lg p-2 flex flex-col items-center justify-center transition-all ${getRiskCardStyle(level, activeRiskFilter === level)}`}
                  >
                    <span className={`text-2xl font-bold ${getRiskTextStyle(level, activeRiskFilter === level)}`}>
                        {riskCounts[level]}
                    </span>
                    <span className={`text-[8px] uppercase font-bold ${activeRiskFilter === level ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}>
                        {level}
                    </span>
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* Compliance Checklist */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full min-h-[160px]">
          <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3 flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5 text-brand-600" /> Compliance Checklist
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Parties Defined', count: checklist.parties },
              { label: 'Effective Dates', count: checklist.dates },
              { label: 'Notice Periods', count: checklist.notice },
              { label: 'Term. Clauses', count: checklist.termination },
              { label: 'Jurisdiction', count: checklist.jurisdiction },
            ].map((item, idx) => {
              const status = checkItem(item.count);
              return (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    {status.icon}
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                  </div>
                  <span className={`text-xs font-bold ${status.isComplete ? 'text-green-600' : 'text-slate-400'}`}>
                    {item.count}/{total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Insight */}
        <div className="bg-gradient-to-br from-indigo-50 to-brand-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-xl border border-brand-100 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Lightbulb className="w-16 h-16 text-brand-600" />
          </div>
          <div>
             <p className="text-[10px] text-brand-600 dark:text-brand-300 uppercase font-bold mb-2 flex items-center gap-1.5 tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" /> Key Insight
             </p>
             <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium line-clamp-4">
                {keyInsightText}
             </p>
          </div>
          {insights.length > 0 && (
             <button onClick={() => setShowInsightModal(true)} className="mt-2 text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline self-start uppercase">
               Show more
             </button>
          )}
        </div>
      </div>

      {showInsightModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Lightbulb className="w-5 h-5 text-brand-600" /> Key Insight Details</h3>
              <button onClick={() => setShowInsightModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
               <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">{keyInsightText}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
