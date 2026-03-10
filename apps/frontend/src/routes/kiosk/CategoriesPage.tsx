import { ChevronLeft, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryCard } from '@/features/menu/components/CategoryCard';
import { useCategories, useCombos, useMenuItems } from '@/features/menu/hooks/useMenu';
import { useCartStore } from '@/features/cart/store/cart.store';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';

const INACTIVITY_TIMEOUT_MS = 120_000;

export function CategoriesPage() {
  const navigate = useNavigate();
  const { categories, loading, error, refetch } = useCategories();
  const { items } = useMenuItems();
  const { combos } = useCombos();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const [search, setSearch] = useState('');

  // Timeout de inatividade volta para splash
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    trackKioskEvent('screen_view', { screen: 'categories' });

    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => navigate('/kiosk'), INACTIVITY_TIMEOUT_MS);
    };
    reset();
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [navigate]);

  function getItemCount(categoryId: string) {
    const category = categories.find((c) => c.id === categoryId);
    if (category?.name.toLowerCase().includes('combo')) {
      return combos.filter((combo) => combo.isActive).length;
    }
    return items.filter((i) => i.categoryId === categoryId && i.isAvailable).length;
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate('/kiosk')}
          className="flex items-center gap-1 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 active:scale-95"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-semibold">Início</span>
        </button>

        <h1 className="text-xl font-black text-gray-900">CARDÁPIO</h1>

        <button
          onClick={() => navigate('/kiosk/cart')}
          className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 active:scale-95"
          aria-label="Carrinho"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-base text-gray-800 placeholder-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500" />
              <span>Carregando cardápio...</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-2xl bg-red-50 p-6 text-center">
              <p className="text-lg font-semibold text-red-600">Ops! Não foi possível carregar o cardápio.</p>
              <p className="mt-1 text-sm text-red-400">Verifique a conexão e tente novamente.</p>
              <button
                onClick={refetch}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 mt-8">Nenhuma categoria encontrada.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {filtered.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    itemCount={getItemCount(category.id)}
                    onClick={() => {
                      trackKioskEvent('category_selected', {
                        categoryId: category.id,
                        categoryName: category.name,
                      });
                      navigate(`/kiosk/menu/${category.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
