import { ChevronLeft, Search, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryCard } from '@/features/menu/components/CategoryCard';
import { useCategories, useCombos, useMenuItems } from '@/features/menu/hooks/useMenu';
import { useCartStore } from '@/features/cart/store/cart.store';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { useI18n } from '@/i18n';

const INACTIVITY_TIMEOUT_MS = 120_000;

export function CategoriesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { categories, loading, error, refetch } = useCategories();
  const { items } = useMenuItems();
  const { combos } = useCombos();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const [search, setSearch] = useState('');
  const mainRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

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
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 shadow-sm sm:px-4">
        <button
          onClick={() => navigate('/kiosk')}
          className="touch-target flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-gray-700 transition hover:bg-gray-100 active:scale-95 sm:px-3"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-semibold">{t('Início')}</span>
        </button>

        <h1 id="kiosk-page-title" className="min-w-0 truncate text-center text-base font-black text-gray-900 sm:text-xl">{t('CARDÁPIO')}</h1>

        <button
          onClick={() => navigate('/kiosk/cart')}
          className="touch-target relative flex shrink-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-gray-700 transition hover:bg-gray-100 active:scale-95 sm:px-3"
          aria-label={
            totalItems === 1
              ? t('Carrinho, 1 item')
              : totalItems > 1
                ? t('Carrinho, {count} itens', { count: totalItems })
                : t('Carrinho')
          }
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <main
        ref={mainRef}
        id="kiosk-main"
        tabIndex={-1}
        aria-labelledby="kiosk-page-title"
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-900 sm:p-5 lg:p-6"
      >
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Buscar categoria...')}
            aria-label={t('Buscar categoria...')}
            className="min-h-12 w-full rounded-xl border border-gray-500 bg-white py-3 pl-11 pr-4 text-base text-gray-900 placeholder-gray-600 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {!loading && !error
            ? filtered.length === 0
              ? t('Nenhuma categoria encontrada.')
              : filtered.length === 1
                ? t('1 categoria encontrada.')
                : t('{count} categorias encontradas.', { count: filtered.length })
            : ''}
        </p>

        {/* Estados */}
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary-700" />
              <span className="text-gray-700">{t('Carregando cardápio...')}</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-2xl bg-red-50 p-6 text-center">
              <p className="text-lg font-semibold text-red-600">{t('Ops! Não foi possível carregar o cardápio.')}</p>
              <p className="mt-1 text-sm text-red-700">{t('Verifique a conexão e tente novamente.')}</p>
              <button
                onClick={refetch}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
              >
                {t('Tentar novamente')}
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {filtered.length === 0 ? (
              <p className="mt-8 text-center text-gray-600">{t('Nenhuma categoria encontrada.')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
