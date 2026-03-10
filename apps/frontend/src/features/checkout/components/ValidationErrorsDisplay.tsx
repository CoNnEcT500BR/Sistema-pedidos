import type { ItemValidationError } from '@/features/orders/services/orders.service';
import { AlertCircle } from 'lucide-react';

interface ValidationErrorsDisplayProps {
  errors: ItemValidationError[];
  onEditItem: () => void;
}

export function ValidationErrorsDisplay({
  errors,
  onEditItem,
}: ValidationErrorsDisplayProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-3">Itens com problemas</h3>
          <div className="space-y-2">
            {errors.map((error, idx) => (
              <div
                key={idx}
                className="bg-white rounded p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{error.itemName}</p>
                  <p className="text-xs text-red-700 mt-1">{error.message}</p>
                </div>
                <button
                  onClick={onEditItem}
                  className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-3">
            Por favor, ajuste os itens marcados acima antes de continuar.
          </p>
        </div>
      </div>
    </div>
  );
}
