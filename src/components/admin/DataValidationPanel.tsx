import { AlertCircle, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { ValidationResult } from '../../utils/dataValidator';

interface DataValidationPanelProps {
  validation: ValidationResult | null;
  isValidating: boolean;
}

export default function DataValidationPanel({ validation, isValidating }: DataValidationPanelProps) {
  if (isValidating) {
    return (
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-blue-700 font-semibold">Validating data...</span>
        </div>
      </div>
    );
  }

  if (!validation) {
    return null;
  }

  const { valid, errors, warnings, stats } = validation;

  if (valid && errors.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-emerald-700 mb-2">All checks passed! Ready to publish.</div>
            <div className="text-sm text-emerald-600 space-y-1">
              <div>✓ {stats.productCount} products</div>
              <div>✓ {stats.categoryCount} categories</div>
              {stats.reviewCount > 0 && <div>✓ {stats.reviewCount} reviews</div>}
              {stats.offerCount > 0 && <div>✓ {stats.offerCount} offers</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-red-700 mb-2">Data Validation Issues</div>

          {errors.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-semibold text-red-700 mb-1">Errors ({errors.length}):</div>
              <div className="space-y-1">
                {errors.slice(0, 5).map((error, idx) => (
                  <div key={idx} className="text-sm text-red-600 flex items-start gap-2">
                    <span className="text-red-500 font-bold mt-0.5">•</span>
                    <span>{error}</span>
                  </div>
                ))}
                {errors.length > 5 && (
                  <div className="text-sm text-red-600 italic">
                    ... and {errors.length - 5} more errors
                  </div>
                )}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-amber-700 mb-1">Warnings ({warnings.length}):</div>
              <div className="space-y-1">
                {warnings.slice(0, 5).map((warning, idx) => (
                  <div key={idx} className="text-sm text-amber-600 flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
                {warnings.length > 5 && (
                  <div className="text-sm text-amber-600 italic">
                    ... and {warnings.length - 5} more warnings
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded">
            Data: {stats.productCount} products • {stats.categoryCount} categories
            {stats.reviewCount > 0 && ` • ${stats.reviewCount} reviews`}
            {stats.offerCount > 0 && ` • ${stats.offerCount} offers`}
          </div>
        </div>
      </div>
    </div>
  );
}
