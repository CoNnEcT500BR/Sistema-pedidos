import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart.store';
import { useI18n } from '@/i18n';

export function CartSummary() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const totalPrice = useCartStore((s) => s.getTotalPrice());

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => navigate('/kiosk/cart')}
      className="flex w-full items-center justify-between rounded-2xl bg-primary-500 px-6 py-4 text-white shadow-lg transition hover:bg-primary-600 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-600">
            {totalItems}
          </span>
        </div>
        <span className="text-lg font-bold">{t('Ver Carrinho')}</span>
      </div>
      <span className="text-lg font-bold">
        R$ {totalPrice.toFixed(2).replace('.', ',')}
      </span>
    </button>
  );
}
