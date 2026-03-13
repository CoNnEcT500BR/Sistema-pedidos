import { ChevronLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
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

  const isEmpty = items.length === 0;

  useEffect(() => {
    trackKioskEvent('cart_viewed', {
      itemsCount: items.length,
      totalPrice,
    });
  }, [items.length, totalPrice]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
          aria-label={t('Voltar')}
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-semibold">{t('Voltar')}</span>
        </button>

        <h1 className="flex items-center gap-2 text-xl font-black text-gray-900">
          <ShoppingCart className="h-6 w-6 text-primary-500" />
          {t('CARRINHO')}
        </h1>

        {!isEmpty && (
          <button
            onClick={() => {
              clear();
            }}
            className="flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-red-500 transition hover:bg-red-50 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
            aria-label={t('Limpar carrinho')}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-semibold">{t('Limpar')}</span>
          </button>
        )}
        {isEmpty && <div className="w-24" />}
      </header>

      <main className="flex flex-1 flex-col gap-3 p-4 pb-40">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
            <span className="text-7xl">🛒</span>
            <p className="text-xl font-bold text-gray-600">{t('Seu carrinho está vazio')}</p>
            <p className="text-gray-400">{t('Adicione itens do cardápio para continuar')}</p>
            <button
              onClick={() => navigate('/kiosk/menu')}
              className="mt-2 rounded-2xl bg-primary-500 px-8 py-4 text-lg font-bold text-white shadow transition hover:bg-primary-600 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
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
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-base text-gray-600">{t('Total')}</span>
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
            className="w-full rounded-2xl bg-primary-500 py-5 text-xl font-black text-white shadow-md transition hover:bg-primary-600 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
          >
            {t('Finalizar Pedido →')}
          </button>
        </div>
      )}
    </div>
  );
}
