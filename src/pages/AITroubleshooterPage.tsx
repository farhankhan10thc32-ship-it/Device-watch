import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { requestAIDiagnosis } from '../services/api';
import { AIDiagnosisCard } from '../components/ai/AIDiagnosisCard';
import { AIDiagnosis } from '../types';
import { Sparkles, Send, Loader2, Info, RefreshCw, Cpu, Layers, Thermometer } from 'lucide-react';

export const AITroubleshooterPage: React.FC = () => {
  const { metrics, processes } = useDevice();
  const [question, setQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AIDiagnosis | null>(() => ({
    problem: 'High Memory Usage',
    metricLabel: 'Current RAM usage',
    metricValue: `${metrics.memoryUsage}%`,
    possibleCause: 'Several browser processes and developer tools are consuming a large amount of memory.',
    recommendation: 'Close unused browser tabs and quit background applications.',
    severity: 'Medium',
    actionableSteps: [
      'Close inactive browser tabs, especially media streaming or spreadsheet tabs',
      'Check top memory consumers like Google Chrome and VS Code in the Processes tab',
      'Restart applications running longer than 24 hours to reclaim leaked RAM',
    ],
    timestamp: 'Initial diagnosis',
  }));

  const quickQuestions = [
    'Why is my laptop slow?',
    'Why is my CPU usage high?',
    'Why is my laptop heating?',
    'Why is my RAM usage high?',
  ];

  const handleAnalyze = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await requestAIDiagnosis(q, metrics, processes);
      setDiagnosis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          <span>Diagnostic Engine</span>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
          What's wrong with your device?
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
          Enter an issue or symptom. The troubleshooter reviews your live telemetry and process list
          to identify the exact root cause and actionable resolution.
        </p>

        {/* Live Context Telemetry Chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="text-[11px] font-medium text-slate-400">Live Context:</span>
          <span className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            <Cpu className="w-3 h-3 text-slate-500" /> CPU: {metrics.cpuUsage}%
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            <Layers className="w-3 h-3 text-slate-500" /> RAM: {metrics.memoryUsage}%
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            <Thermometer className="w-3 h-3 text-slate-500" /> Temp: {metrics.temperature}°C
          </span>
        </div>

        {/* Search & Prompt Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Example: Why is my laptop slow?"
            className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || !question.trim()}
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium px-4 py-2.5 rounded-md text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Quick Questions below input */}
        <div className="mt-4">
          <div className="text-[11px] font-medium text-slate-400 mb-2">
            Quick questions:
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  handleAnalyze(q);
                }}
                disabled={isAnalyzing}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer text-left shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnosis Output Card */}
      {diagnosis && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Diagnosis Result</span>
            <button
              onClick={() => handleAnalyze()}
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Re-analyze live state</span>
            </button>
          </div>
          <AIDiagnosisCard diagnosis={diagnosis} />
        </div>
      )}
    </div>
  );
};
