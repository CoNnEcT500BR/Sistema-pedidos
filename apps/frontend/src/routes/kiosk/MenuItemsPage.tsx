import { ChevronLeft, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MenuItemCard } from '@/features/menu/components/MenuItemCard';
import { ComboModal } from '@/features/menu/components/ComboModal';
import { MenuItemModal } from '@/features/menu/components/MenuItemModal';
import { useCategories, useCombos, useMenuItems } from '@/features/menu/hooks/useMenu';
import type { Combo, MenuItem } from '@/features/menu/types/menu.types';
import type { CartAddon } from '@/features/cart/store/cart.store';
import { useCartStore } from '@/features/cart/store/cart.store';
import { CartSummary } from '@/features/cart/components/CartSummary';
import { useToast } from '@/hooks/useToast';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { useI18n } from '@/i18n';

const INACTIVITY_TIMEOUT_MS = 120_000;

export function MenuItemsPage() {
  const { t } = useI18n();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { items, loading, error, refetch } = useMenuItems(categoryId);
  const {
    combos,
    loading: combosLoading,
    error: combosError,
    refetch: refetchCombos,
  } = useCombos();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const addMenuItem = useCartStore((s) => s.addMenuItem);
  const addCombo = useCartStore((s) => s.addCombo);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const { toasts, toast, dismiss } = useToast();
  const latestToast = toasts[toasts.length - 1];

  const category = categories.find((c) => c.id === categoryId);
  const isComboCategory = category?.name.toLowerCase().includes('combo') ?? false;

  // Timeout de inatividade
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    trackKioskEvent('screen_view', {
      screen: 'menu_items',
      categoryId,
      isComboCategory,
    });

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
  }, [navigate, categoryId, isComboCategory]);

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  function handleAddItem(item: MenuItem) {
    trackKioskEvent('item_modal_opened', { itemId: item.id, itemName: item.name });
    setSelectedItem(item);
    setModalOpen(true);
  }

  function handleConfirmAdd(item: MenuItem, quantity: number, addons: CartAddon[]) {
    addMenuItem(item, quantity, addons);
    trackKioskEvent('item_added_to_cart', {
      itemId: item.id,
      itemName: item.name,
      quantity,
      addonsCount: addons.length,
    });
    toast({
      title: t('✓ Adicionado!'),
      description: t('{name} foi adicionado ao carrinho.', { name: item.name }),
      variant: 'success',
    });
  }

  function handleAddCombo(combo: Combo) {
    trackKioskEvent('combo_modal_opened', { comboId: combo.id, comboName: combo.name });
    setSelectedCombo(combo);
    setComboModalOpen(true);
  }

  function handleConfirmAddCombo(combo: Combo, quantity: number, addons: CartAddon[]) {
    addCombo(combo, quantity, addons);
    trackKioskEvent('combo_added_to_cart', {
      comboId: combo.id,
      comboName: combo.name,
      quantity,
      addonsCount: addons.length,
    });
    toast({
      title: t('✓ Combo adicionado!'),
      description: t('{name} foi adicionado ao carrinho.', { name: combo.name }),
      variant: 'success',
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 shadow-sm sm:px-4">
        <button
          onClick={() => navigate('/kiosk/menu')}
          className="touch-target flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-gray-700 transition hover:bg-gray-100 active:scale-95 sm:px-3"
          aria-label={t('Voltar')}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-semibold">{t('Voltar')}</span>
        </button>

        <h1 id="kiosk-page-title" className="min-w-0 flex-1 px-1 text-center text-sm font-black uppercase leading-tight text-gray-900 sm:px-2 sm:text-xl">
          {category?.name ? t(category.name) : t('Cardápio')}
        </h1>

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
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 p-3 pb-32 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-900 sm:p-5 sm:pb-36 lg:p-6 lg:pb-36"
      >
        {((isComboCategory && combosLoading) || (!isComboCategory && loading)) && (
          <div className="flex flex-1 items-center justify-center py-20">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-primary-700" />
          </div>
        )}

        {!isComboCategory && error && !loading && (
          <div className="rounded-2xl bg-red-50 p-6 text-center">
            <p className="text-lg font-semibold text-red-700">{t('Erro ao carregar itens.')}</p>
            <p className="mt-1 text-sm text-red-700">{t('Confira a conexão e tente novamente.')}</p>
            <button
              onClick={refetch}
              className="touch-target mt-4 rounded-xl bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-700"
            >
              {t('Tentar novamente')}
            </button>
          </div>
        )}

        {isComboCategory && combosError && !combosLoading && (
          <div className="rounded-2xl bg-red-50 p-6 text-center">
            <p className="text-lg font-semibold text-red-700">{t('Erro ao carregar combos.')}</p>
            <p className="mt-1 text-sm text-red-700">{t('Confira a conexão e tente novamente.')}</p>
            <button
              onClick={refetchCombos}
              className="touch-target mt-4 rounded-xl bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-700"
            >
              {t('Tentar novamente')}
            </button>
          </div>
        )}

        {!isComboCategory && !loading && !error && items.length === 0 && (
          <p className="mt-10 text-center text-gray-600">{t('Nenhum item disponível nesta categoria.')}</p>
        )}

        {isComboCategory && !combosLoading && !combosError && combos.filter((combo) => combo.isActive).length === 0 && (
          <p className="mt-10 text-center text-gray-600">{t('Nenhum combo disponível nesta categoria.')}</p>
        )}

        {!isComboCategory && !loading &&
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 sm:gap-4">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} onAdd={handleAddItem} />
          ))}
          </div>}

        {isComboCategory && !combosLoading && !combosError &&
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 sm:gap-4">
          {combos
            .filter((combo) => combo.isActive)
            .map((combo) => {
              const comboAsMenuItem: MenuItem = {
                id: combo.id,
                categoryId: categoryId ?? '',
                name: combo.name,
                description: combo.description,
                price: combo.price,
                imageUrl: combo.icon?.startsWith('http') ? combo.icon : undefined,
                isAvailable: combo.isActive,
              };

              return (
                <MenuItemCard
                  key={combo.id}
                  item={comboAsMenuItem}
                  onAdd={() => handleAddCombo(combo)}
                />
              );
            })}
          </div>}
      </main>

      {/* Barra flutuante do carrinho */}
      {totalItems > 0 && (
        <div className="safe-area-bottom fixed bottom-0 left-0 right-0 px-3 pt-3 sm:px-5">
          <CartSummary />
        </div>
      )}

      {/* Modal de personalização */}
      <MenuItemModal
        item={selectedItem}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedItem(null); }}
        onAddToCart={handleConfirmAdd}
      />

      <ComboModal
        combo={selectedCombo}
        open={comboModalOpen}
        onClose={() => { setComboModalOpen(false); setSelectedCombo(null); }}
        onAddToCart={handleConfirmAddCombo}
      />

      {/* Toast notifications */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {latestToast
          ? [latestToast.title, latestToast.description].filter(Boolean).join(' ')
          : ''}
      </p>
      <div className="fixed inset-x-3 top-20 z-50 flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-auto">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-lg sm:px-5"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">{toastItem.title}</span>
              {toastItem.description && <span className="text-sm text-gray-700">{toastItem.description}</span>}
            </div>
            <button type="button" onClick={() => dismiss(toastItem.id)} aria-label={t('Fechar notificação')} className="touch-target shrink-0 text-gray-700 hover:text-gray-900">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
