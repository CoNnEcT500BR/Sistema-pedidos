import type { Category } from '../types/menu.types';

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
  const emoji = getCategoryEmoji(category.name, category.icon);

  return (
    <button
      onClick={onClick}
      className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 active:scale-95 hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
    >
      <span className="text-5xl leading-none" role="img" aria-label={category.name}>
        {emoji}
      </span>
      <span className="text-center text-lg font-bold text-gray-800">{category.name}</span>
      {itemCount !== undefined && (
        <span className="text-sm text-gray-400">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
      )}
    </button>
  );
}
