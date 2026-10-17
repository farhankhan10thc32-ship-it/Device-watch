import React from 'react';
import { AIDiagnosis } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface AIDiagnosisCardProps {
  diagnosis: AIDiagnosis;
}

export const AIDiagnosisCard: React.FC<AIDiagnosisCardProps> = ({ diagnosis }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] space-y-6">
      {/* Header Pipeline Breadcrumb Indicator: Problem -> Cause -> Recommendation -> Severity */}
      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Problem</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Cause</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Recommendation</span>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Severity</span>
      </div>

      {/* 1. Diagnosis / Problem */}
      <div>
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
          Diagnosis
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {diagnosis.problem}
          </h3>
          <StatusBadge status={diagnosis.severity} variant="subtle" />
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>{diagnosis.metricLabel}:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {diagnosis.metricValue}
          </span>
        </div>
      </div>

      {/* 2. Possible Cause */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
          Possible Cause
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {diagnosis.possibleCause}
        </p>
      </div>

      {/* 3. Recommendation */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
          Recommendation
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
          {diagnosis.recommendation}
        </p>

        {diagnosis.actionableSteps && diagnosis.actionableSteps.length > 0 && (
          <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 rounded-md p-3 border border-slate-200/80 dark:border-slate-700/60">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Recommended actions:
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {diagnosis.actionableSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 4. Severity & Meta */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600 dark:text-slate-400">Severity Assessment:</span>
          <StatusBadge status={diagnosis.severity} />
        </div>
        <span className="text-slate-400">Generated: {diagnosis.timestamp}</span>
      </div>
    </div>
  );
};
