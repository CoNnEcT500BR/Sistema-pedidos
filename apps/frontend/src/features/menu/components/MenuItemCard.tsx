import { Plus } from 'lucide-react';
import type { MenuItem } from '../types/menu.types';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
        !item.isAvailable && 'opacity-60',
      )}
    >
      {/* Imagem ou emoji placeholder */}
      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-4xl">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          '🍽️'
        )}
      </div>

      {/* Informações */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-800 leading-tight">{item.name}</h3>
          {!item.isAvailable && (
            <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-500">
              Esgotado
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">
            R$ {item.price.toFixed(2).replace('.', ',')}
          </span>
          {item.isAvailable && (
            <button
              onClick={() => onAdd(item)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow transition-colors hover:bg-primary-600 active:scale-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
              aria-label={`Adicionar ${item.name}`}
            >
              <Plus className="h-6 w-6" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
