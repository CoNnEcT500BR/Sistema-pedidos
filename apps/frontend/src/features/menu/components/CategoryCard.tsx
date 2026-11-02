import type { Category } from '../types/menu.types';
import { useI18n } from '@/i18n';

interface CategoryCardProps {
  category: Category;
  itemCount?: number;
  onClick: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  hambúrgueres: '🍔',
  hamburgueres: '🍔',
  hamburger: '🍔',
  lanches: '🍔',
  acompanhamentos: '🍟',
  batata: '🍟',
  bebidas: '🥤',
  refrigerantes: '🥤',
  sucos: '🍹',
  sobremesas: '🍰',
  doces: '🍰',
  kids: '🧒',
  infantil: '🧒',
  molhos: '🫙',
  extras: '🫙',
  compartilhaveis: '🍗',
  compartilháveis: '🍗',
  combos: '⭐',
  promoções: '🎯',
  promocoes: '🎯',
  pizzas: '🍕',
  saladas: '🥗',
  wraps: '🌯',
  default: '🍽️',
};

function getCategoryEmoji(name: string, icon?: string): string {
  if (icon) return icon;
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return CATEGORY_EMOJIS.default;
}

export function CategoryCard({ category, itemCount, onClick }: CategoryCardProps) {
  const { t } = useI18n();
  const emoji = getCategoryEmoji(category.name, category.icon);

  return (
    <button
      onClick={onClick}
      className="touch-target flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 bg-white p-4 shadow-sm transition-all duration-200 active:scale-[0.99] hover:border-primary-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-800 sm:min-h-44 sm:gap-3 sm:p-6"
    >
      <span className="text-4xl leading-none sm:text-5xl" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-center text-lg font-bold text-gray-800">{t(category.name)}</span>
      {itemCount !== undefined && (
        <span className="text-sm text-gray-600">{itemCount} {itemCount === 1 ? t('item') : t('itens')}</span>
      )}
    </button>
  );
}
