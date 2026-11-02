import { ChevronLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/features/cart/store/cart.store';
import { CartItemRow } from '@/features/cart/components/CartItem';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { useI18n } from '@/i18n';

export function CartPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clear = useCartStore((s) => s.clear);
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const mainRef = useRef<HTMLElement>(null);
  const emptyCartButtonRef = useRef<HTMLButtonElement>(null);
  const focusEmptyCartButtonRef = useRef(false);

  const isEmpty = items.length === 0;

  useEffect(() => {
    trackKioskEvent('cart_viewed', {
      itemsCount: items.length,
      totalPrice,
    });
  }, [items.length, totalPrice]);

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isEmpty && focusEmptyCartButtonRef.current) {
      emptyCartButtonRef.current?.focus();
      focusEmptyCartButtonRef.current = false;
    }
  }, [isEmpty]);

  function handleClearCart() {
    focusEmptyCartButtonRef.current = true;
    clear();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 shadow-sm sm:px-4">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-gray-700 transition hover:bg-gray-100 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-700 sm:px-3"
          aria-label={t('Voltar')}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-semibold">{t('Voltar')}</span>
        </button>

        <h1 id="kiosk-page-title" className="flex min-w-0 items-center gap-1 text-base font-black text-gray-900 sm:gap-2 sm:text-xl">
          <ShoppingCart className="h-6 w-6 text-primary-500" />
          {t('CARRINHO')}
        </h1>

        {!isEmpty && (
          <button
            onClick={handleClearCart}
            className="touch-target flex shrink-0 items-center gap-1 rounded-xl px-2 py-2 text-red-700 transition hover:bg-red-50 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-700 sm:px-3"
            aria-label={t('Limpar carrinho')}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{t('Limpar')}</span>
          </button>
        )}
        {isEmpty && <div className="w-10 shrink-0 sm:w-24" aria-hidden="true" />}
      </header>

      <main
        ref={mainRef}
        id="kiosk-main"
        tabIndex={-1}
        aria-labelledby="kiosk-page-title"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3 p-3 pb-44 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-900 sm:p-5 sm:pb-44 lg:p-6"
      >
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
            <span className="text-7xl">🛒</span>
            <p className="text-xl font-bold text-gray-600">{t('Seu carrinho está vazio')}</p>
            <p className="text-gray-600">{t('Adicione itens do cardápio para continuar')}</p>
            <button
              ref={emptyCartButtonRef}
              onClick={() => navigate('/kiosk/menu')}
              className="touch-target mt-2 rounded-2xl bg-primary-700 px-8 py-4 text-lg font-bold text-white shadow transition hover:bg-primary-800 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700"
            >
              {t('Ver Cardápio')}
            </button>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <CartItemRow
                key={item.cartId}
                item={item}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
              />
            ))}
          </>
        )}
      </main>

      {/* Footer com total e botão */}
      {!isEmpty && (
        <div className="safe-area-bottom fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-3 shadow-lg sm:px-6">
          <div className="mx-auto mb-3 flex max-w-4xl items-center justify-between" role="status" aria-live="polite" aria-atomic="true">
            <span className="text-base text-gray-700">{t('Total')}</span>
            <span className="text-2xl font-black text-gray-900">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <button
            onClick={() => {
              trackKioskEvent('checkout_started', {
                itemsCount: items.length,
                totalPrice,
              });
              navigate('/kiosk/checkout');
            }}
            className="touch-target mx-auto block w-full max-w-4xl rounded-2xl bg-primary-700 py-4 text-lg font-black text-white shadow-md transition hover:bg-primary-800 active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-700 sm:py-5 sm:text-xl"
          >
            {t('Finalizar Pedido →')}
          </button>
        </div>
      )}
    </div>
  );
}
