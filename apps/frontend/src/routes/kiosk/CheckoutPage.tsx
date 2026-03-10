import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/features/cart/store/cart.store';
import type { ItemValidationError, OrderValidationErrorResponse } from '@/features/orders/services/orders.service';
import { ordersService } from '@/features/orders/services/orders.service';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { ValidationErrorsDisplay } from '@/features/checkout/components/ValidationErrorsDisplay';
import { isAxiosError } from 'axios';

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const clear = useCartStore((s) => s.clear);

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ItemValidationError[]>([]);

  async function handleConfirm() {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    trackKioskEvent('order_submit_attempt', {
      itemsCount: items.length,
      totalPrice,
    });

    try {
      const order = await ordersService.createOrder(
        items,
        customerName.trim() || undefined,
        notes.trim() || undefined,
      );

      trackKioskEvent('order_submit_success', {
        orderNumber: order.orderNumber,
        totalPrice: order.finalPrice,
      });

      clear();
      navigate(`/kiosk/confirmation/${order.orderNumber}`);
    } catch (err) {
      trackKioskEvent('order_submit_failed', {
        itemsCount: items.length,
        totalPrice,
      });

      if (isAxiosError(err)) {
        const response = err.response?.data as OrderValidationErrorResponse | undefined;
        if (response?.itemErrors && response.itemErrors.length > 0) {
          setValidationErrors(response.itemErrors);
          setError(null);
        } else {
          setError(response?.message || 'Não foi possível enviar o pedido. Tente novamente.');
          setValidationErrors([]);
        }
      } else {
        setError('Não foi possível enviar o pedido. Tente novamente.');
        setValidationErrors([]);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEditItem() {
    // Voltar para o carrinho para que o usuário possa editar o item
    navigate('/kiosk/cart');
  }

  useEffect(() => {
    trackKioskEvent('screen_view', { screen: 'checkout' });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-200"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-6 w-6" />
          <span className="font-semibold">Voltar</span>
        </button>
        <h1 className="text-xl font-black text-gray-900">CONFIRMAR PEDIDO</h1>
        <div className="w-24" />
      </header>

      <main className="flex flex-1 flex-col gap-5 p-4 pb-40">
        {/* Erros de validação */}
        {validationErrors.length > 0 && (
          <ValidationErrorsDisplay
            errors={validationErrors}
            onEditItem={handleEditItem}
          />
        )}

        {/* Resumo do pedido */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Resumo do Pedido
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((item) => {
              const removedAddons = item.addons.filter((addon) => addon.removed);
              const extraAddons = item.addons.filter((addon) => !addon.removed);

              return (
                <li key={item.cartId} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                      {item.quantity}× {item.name}
                    </span>

                    {removedAddons.length > 0 && (
                      <div className="mt-1 rounded-lg border border-red-100 bg-red-50 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Removidos</p>
                        {removedAddons.map((a, index) => (
                          <span key={`${a.addonId}-removed-${index}`} className="block text-xs font-medium text-red-600 pl-1">
                            - Sem {a.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {extraAddons.length > 0 && (
                      <div className="mt-1 rounded-lg border border-gray-100 bg-gray-50 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Adicionais</p>
                        {extraAddons.map((a, index) => (
                          <span key={`${a.addonId}-${index}`} className="block text-xs text-gray-500 pl-1">
                            + {a.name} ×{a.quantity}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <span className="mt-1 text-xs italic text-gray-400 pl-2">"{item.notes}"</span>
                    )}
                  </div>
                  <span className="shrink-0 font-bold text-gray-900">
                    R$ {item.subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-base font-semibold text-gray-700">Total</span>
            <span className="text-2xl font-black text-primary-600">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </section>

        {/* Dados opcionais */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Identificação (opcional)
          </h2>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Seu nome..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800 placeholder-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            maxLength={100}
          />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Observações gerais (opcional)
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação geral para o pedido..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            rows={3}
            maxLength={300}
          />
        </section>

        {/* Informação de pagamento */}
        <section className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-5">
          <p className="text-center text-base font-semibold text-primary-700">
            💳 O pagamento é realizado no balcão ao retirar o pedido.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        )}
      </main>

      {/* Footer com botão de confirmar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-4 shadow-lg">
        <button
          onClick={handleConfirm}
          disabled={loading || items.length === 0}
          className="w-full rounded-2xl bg-primary-500 py-5 text-xl font-black text-white shadow-md transition hover:bg-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Enviando pedido...
            </span>
          ) : (
            '✓ Confirmar Pedido'
          )}
        </button>
      </div>
    </div>
  );
}
