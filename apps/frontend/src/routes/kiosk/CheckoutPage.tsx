import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/features/cart/store/cart.store';
import type { ItemValidationError, OrderValidationErrorResponse } from '@/features/orders/services/orders.service';
import { ordersService } from '@/features/orders/services/orders.service';
import { deliveryService } from '@/features/delivery/services/delivery.service';
import type { DeliveryZone } from '@/features/delivery/types/delivery.types';
import { trackKioskEvent } from '@/features/telemetry/telemetry.service';
import { ValidationErrorsDisplay } from '@/features/checkout/components/ValidationErrorsDisplay';
import { isAxiosError } from 'axios';
import { useI18n } from '@/i18n';

export function CheckoutPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const clear = useCartStore((s) => s.clear);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH_ON_DELIVERY' | 'CARD_ON_DELIVERY' | 'PIX_ON_DELIVERY'
  >('CASH_ON_DELIVERY');
  const [cashChangeFor, setCashChangeFor] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryComplement, setDeliveryComplement] = useState('');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [deliveryZoneId, setDeliveryZoneId] = useState('');
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [zoneAnnouncement, setZoneAnnouncement] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ItemValidationError[]>([]);
  const [deliveryFieldError, setDeliveryFieldError] = useState<{
    field: 'name' | 'zone' | 'address';
    message: string;
  } | null>(null);
  const checkoutHeadingRef = useRef<HTMLHeadingElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const deliveryZoneInputRef = useRef<HTMLSelectElement>(null);
  const deliveryAddressInputRef = useRef<HTMLInputElement>(null);
  const selectedZone = deliveryZones.find((zone) => zone.id === deliveryZoneId);
  const deliveryFee = fulfillmentType === 'DELIVERY' ? selectedZone?.fee ?? 0 : 0;
  const checkoutTotal = totalPrice + deliveryFee;

  useEffect(() => {
    let active = true;
    setZoneAnnouncement(t('Carregando áreas atendidas...'));
    deliveryService
      .getZones()
      .then((zones) => {
        if (active) {
          setDeliveryZones(zones);
          setZoneAnnouncement(
            zones.length > 0
              ? t('{count} zonas de entrega disponíveis.', { count: zones.length })
              : t('Delivery indisponível no momento.'),
          );
        }
      })
      .catch(() => {
        if (active) {
          const message = t('Não foi possível carregar as zonas de entrega.');
          setZonesError(message);
          setZoneAnnouncement(message);
        }
      })
      .finally(() => {
        if (active) setLoadingZones(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  async function handleConfirm() {
    if (items.length === 0) return;
    setError(null);
    setValidationErrors([]);
    setDeliveryFieldError(null);
    setPhoneError(null);
    if (fulfillmentType === 'DELIVERY') {
      if (!customerName.trim()) {
        setDeliveryFieldError({ field: 'name', message: t('Informe seu nome.') });
        customerNameInputRef.current?.focus();
        return;
      }

      if (customerPhone.replace(/\D/g, '').length < 10) {
        setPhoneError(t('Informe um telefone com pelo menos 10 dígitos.'));
        phoneInputRef.current?.focus();
        return;
      }

      if (!selectedZone) {
        setDeliveryFieldError({ field: 'zone', message: t('Selecione sua região de entrega.') });
        deliveryZoneInputRef.current?.focus();
        return;
      }

      if (!deliveryAddress.trim()) {
        setDeliveryFieldError({ field: 'address', message: t('Informe a rua e o número da entrega.') });
        deliveryAddressInputRef.current?.focus();
        return;
      }

      setPhoneError(null);
      const changeForValue = cashChangeFor.trim() ? Number(cashChangeFor) : undefined;
      if (
        paymentMethod === 'CASH_ON_DELIVERY' &&
        changeForValue !== undefined &&
        (!Number.isFinite(changeForValue) || changeForValue < checkoutTotal)
      ) {
        setError(t('O valor para troco deve ser igual ou maior que o total do pedido.'));
        return;
      }
    }

    setLoading(true);
    setError(null);
    setValidationErrors([]);

    trackKioskEvent('order_submit_attempt', {
      itemsCount: items.length,
      totalPrice: checkoutTotal,
    });

    try {
      const order = await ordersService.createOrder(
        items,
        customerName.trim() || undefined,
        notes.trim() || undefined,
        fulfillmentType === 'DELIVERY'
          ? {
              fulfillmentType,
              customerPhone: customerPhone.trim(),
              paymentMethod,
              cashChangeFor: cashChangeFor.trim() ? Number(cashChangeFor) : undefined,
              deliveryAddress: deliveryAddress.trim(),
              deliveryComplement: deliveryComplement.trim() || undefined,
              deliveryReference: deliveryReference.trim() || undefined,
              deliveryZoneId,
            }
          : { fulfillmentType: 'PICKUP' },
      );

      trackKioskEvent('order_submit_success', {
        orderNumber: order.orderNumber,
        totalPrice: order.finalPrice,
      });

      clear();
      navigate(`/kiosk/confirmation/${order.orderNumber}`, {
        state: {
          fulfillmentType: order.fulfillmentType,
          paymentMethod: order.paymentMethod,
          finalPrice: order.finalPrice,
          deliveryZoneName: order.deliveryZoneName,
        },
      });
    } catch (err) {
      trackKioskEvent('order_submit_failed', {
        itemsCount: items.length,
        totalPrice: checkoutTotal,
      });

      if (isAxiosError(err)) {
        const response = err.response?.data as OrderValidationErrorResponse | undefined;
        if (response?.itemErrors && response.itemErrors.length > 0) {
          setValidationErrors(response.itemErrors);
          setError(null);
        } else {
          setError(response?.message || t('Não foi possível enviar o pedido. Tente novamente.'));
          setValidationErrors([]);
        }
      } else {
        setError(t('Não foi possível enviar o pedido. Tente novamente.'));
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
    checkoutHeadingRef.current?.focus();
  }, []);

  function clearDeliveryFieldError(field: 'name' | 'zone' | 'address') {
    if (deliveryFieldError?.field === field) {
      setDeliveryFieldError(null);
    }
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
        <h1
          ref={checkoutHeadingRef}
          tabIndex={-1}
          className="min-w-0 flex-1 truncate rounded text-center text-base font-black text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-700 sm:text-xl"
        >
          {t('CONFIRMAR PEDIDO')}
        </h1>
        <div className="w-12 shrink-0 sm:w-24" aria-hidden="true" />
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-3 pb-40 sm:gap-5 sm:p-5 sm:pb-44 lg:p-6">
        <form
          id="checkout-form"
          className="flex flex-col gap-4 sm:gap-5"
          aria-busy={loading}
          onSubmit={(event) => {
            event.preventDefault();
            void handleConfirm();
          }}
        >
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {loading ? t('Enviando pedido...') : ''}
        </p>
        {/* Erros de validação */}
        {validationErrors.length > 0 && (
          <div role="alert" aria-live="assertive">
            <ValidationErrorsDisplay
              errors={validationErrors}
              onEditItem={handleEditItem}
            />
          </div>
        )}

        {/* Resumo do pedido */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            {t('Resumo do Pedido')}
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((item) => {
              const removedAddons = item.addons.filter((addon) => addon.removed);
              const extraAddons = item.addons.filter((addon) => !addon.removed);

              return (
                <li key={item.cartId} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                      {item.quantity}× {t(item.name)}
                    </span>

                    {removedAddons.length > 0 && (
                      <div className="mt-1 rounded-lg border border-red-100 bg-red-50 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">{t('Removidos')}</p>
                        {removedAddons.map((a, index) => (
                          <span key={`${a.addonId}-removed-${index}`} className="block text-xs font-medium text-red-700 pl-1">
                            - {t('Sem {name}', { name: t(a.name) })}
                          </span>
                        ))}
                      </div>
                    )}

                    {extraAddons.length > 0 && (
                      <div className="mt-1 rounded-lg border border-gray-100 bg-gray-50 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">{t('Adicionais')}</p>
                        {extraAddons.map((a, index) => (
                          <span key={`${a.addonId}-${index}`} className="block text-xs text-gray-700 pl-1">
                            + {t(a.name)} ×{a.quantity}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <span className="mt-1 text-xs italic text-gray-600 pl-2">"{item.notes}"</span>
                    )}
                  </div>
                  <span className="shrink-0 font-bold text-gray-900">
                    R$ {item.subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4" aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-gray-700">{t('Subtotal')}</dt>
              <dd className="font-semibold text-gray-900">R$ {totalPrice.toFixed(2).replace('.', ',')}</dd>
            </div>
            {fulfillmentType === 'DELIVERY' && (
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-700">{t('Taxa de entrega')}</dt>
                <dd className="font-semibold text-gray-900">
                  {selectedZone
                    ? `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`
                    : t('Selecione uma zona')}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <dt className="text-base font-semibold text-gray-700">{t('Total')}</dt>
              <dd className="text-2xl font-black text-primary-600">
                R$ {checkoutTotal.toFixed(2).replace('.', ',')}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
              {t('Como deseja receber?')}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-gray-300 p-4 text-gray-900 has-[:checked]:border-primary-700 has-[:checked]:bg-primary-50">
                <input
                  type="radio"
                  name="fulfillmentType"
                  value="PICKUP"
                  checked={fulfillmentType === 'PICKUP'}
                  onChange={() => setFulfillmentType('PICKUP')}
                  className="h-5 w-5 accent-primary-700"
                />
                <span>
                  <span className="block font-semibold">{t('Retirar no local')}</span>
                  <span className="block text-sm text-gray-600">{t('Pagamento no balcão')}</span>
                </span>
              </label>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-gray-300 p-4 text-gray-900 has-[:checked]:border-primary-700 has-[:checked]:bg-primary-50">
                <input
                  type="radio"
                  name="fulfillmentType"
                  value="DELIVERY"
                  checked={fulfillmentType === 'DELIVERY'}
                  onChange={() => setFulfillmentType('DELIVERY')}
                  disabled={loadingZones || deliveryZones.length === 0}
                  className="h-5 w-5 accent-primary-700"
                />
                <span>
                  <span className="block font-semibold">{t('Receber em casa')}</span>
                  <span className="block text-sm text-gray-600">
                    {loadingZones
                      ? t('Carregando áreas atendidas...')
                      : deliveryZones.length > 0
                        ? t('Entrega própria')
                        : t('Delivery indisponível no momento')}
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {zoneAnnouncement}
          </p>
          {zonesError && <p className="mt-3 text-sm text-red-700">{zonesError}</p>}

          {fulfillmentType === 'DELIVERY' && (
            <p className="mt-5 text-sm text-gray-700">
              {t('Os campos marcados com * são obrigatórios para delivery.')}
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkoutCustomerName" className="mb-1 block text-sm font-medium text-gray-800">
                {t('Nome')}{fulfillmentType === 'DELIVERY' ? ' *' : ` (${t('opcional')})`}
              </label>
              <input
                id="checkoutCustomerName"
                ref={customerNameInputRef}
                autoComplete="name"
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  clearDeliveryFieldError('name');
                }}
                placeholder={t('Seu nome')}
                required={fulfillmentType === 'DELIVERY'}
                aria-invalid={deliveryFieldError?.field === 'name'}
                aria-describedby={deliveryFieldError?.field === 'name' ? 'checkoutCustomerNameError' : undefined}
                className="min-h-12 w-full rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-600 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
                maxLength={100}
              />
              {deliveryFieldError?.field === 'name' && (
                <p id="checkoutCustomerNameError" className="mt-1 text-sm text-red-800">
                  {deliveryFieldError.message}
                </p>
              )}
            </div>
            {fulfillmentType === 'DELIVERY' && (
              <div>
                <label htmlFor="checkoutCustomerPhone" className="mb-1 block text-sm font-medium text-gray-800">
                  {t('Telefone')} *
                </label>
                <input
                  id="checkoutCustomerPhone"
                  ref={phoneInputRef}
                  autoComplete="tel"
                  type="tel"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (e.target.value.replace(/\D/g, '').length >= 10) setPhoneError(null);
                  }}
                  placeholder="(00) 00000-0000"
                  required
                  minLength={10}
                  maxLength={30}
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? 'checkoutCustomerPhoneError' : undefined}
                  className="min-h-12 w-full rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-600 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
                {phoneError && (
                  <p id="checkoutCustomerPhoneError" className="mt-1 text-sm text-red-700">
                    {phoneError}
                  </p>
                )}
              </div>
            )}
          </div>

          {fulfillmentType === 'DELIVERY' && (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="deliveryZone" className="mb-1 block text-sm font-medium text-gray-800">
                  {t('Bairro ou zona atendida')} *
                </label>
                <select
                  id="deliveryZone"
                  ref={deliveryZoneInputRef}
                  value={deliveryZoneId}
                  onChange={(event) => {
                    setDeliveryZoneId(event.target.value);
                    clearDeliveryFieldError('zone');
                  }}
                  required
                  disabled={loadingZones || deliveryZones.length === 0}
                  aria-invalid={deliveryFieldError?.field === 'zone'}
                  aria-describedby={deliveryFieldError?.field === 'zone' ? 'deliveryZoneError' : undefined}
                  className="min-h-12 w-full rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
                >
                  <option value="">{t('Selecione sua região')}</option>
                  {deliveryZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} · R$ {zone.fee.toFixed(2).replace('.', ',')} · {zone.estimatedMinutes} min
                    </option>
                  ))}
                </select>
                  {deliveryFieldError?.field === 'zone' && (
                    <p id="deliveryZoneError" className="mt-1 text-sm text-red-800">
                      {deliveryFieldError.message}
                    </p>
                  )}
                  {selectedZone && (
                  <p className="mt-1 text-sm text-gray-600">
                    {t('Prazo estimado')}: {selectedZone.estimatedMinutes} {t('minutos')}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="deliveryAddress" className="mb-1 block text-sm font-medium text-gray-800">
                  {t('Rua e número')} *
                </label>
                <input
                  id="deliveryAddress"
                  ref={deliveryAddressInputRef}
                  autoComplete="street-address"
                  type="text"
                  value={deliveryAddress}
                  onChange={(event) => {
                    setDeliveryAddress(event.target.value);
                    clearDeliveryFieldError('address');
                  }}
                  required
                  maxLength={250}
                  aria-invalid={deliveryFieldError?.field === 'address'}
                  aria-describedby={deliveryFieldError?.field === 'address' ? 'deliveryAddressError' : undefined}
                  placeholder={t('Rua, avenida e número')}
                  className="min-h-12 w-full rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-600 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
                {deliveryFieldError?.field === 'address' && (
                  <p id="deliveryAddressError" className="mt-1 text-sm text-red-800">
                    {deliveryFieldError.message}
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="deliveryComplement" className="mb-1 block text-sm font-medium text-gray-800">
                    {t('Complemento')} ({t('opcional')})
                  </label>
                  <input
                    id="deliveryComplement"
                    autoComplete="address-line2"
                    type="text"
                    value={deliveryComplement}
                    onChange={(event) => setDeliveryComplement(event.target.value)}
                    maxLength={120}
                    className="min-h-12 w-full rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
                <div>
                  <label htmlFor="deliveryReference" className="mb-1 block text-sm font-medium text-gray-800">
                    {t('Ponto de referência')} ({t('opcional')})
                  </label>
                  <input
                    id="deliveryReference"
                    type="text"
                    value={deliveryReference}
                    onChange={(event) => setDeliveryReference(event.target.value)}
                    maxLength={160}
                    className="min-h-12 w-full rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-gray-800">{t('Pagamento na entrega')}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {([
                    ['CASH_ON_DELIVERY', t('Dinheiro')],
                    ['CARD_ON_DELIVERY', t('Cartão na entrega')],
                    ['PIX_ON_DELIVERY', t('Pix na entrega')],
                  ] as const).map(([method, label]) => (
                    <label key={method} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 has-[:checked]:border-primary-700 has-[:checked]:bg-primary-50">
                      <input
                        type="radio"
                        name="deliveryPaymentMethod"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                        className="h-4 w-4 accent-primary-700"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {paymentMethod === 'CASH_ON_DELIVERY' && (
                <div>
                  <label htmlFor="cashChangeFor" className="mb-1 block text-sm font-medium text-gray-800">
                    {t('Precisa de troco para quanto?')} ({t('opcional')})
                  </label>
                  <input
                    id="cashChangeFor"
                    type="number"
                    inputMode="decimal"
                    min={checkoutTotal}
                    step="0.01"
                    value={cashChangeFor}
                    onChange={(event) => setCashChangeFor(event.target.value)}
                    placeholder={`R$ ${checkoutTotal.toFixed(2).replace('.', ',')}`}
                    className="min-h-12 w-full rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-600 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700 sm:max-w-sm"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
            {t('Observações gerais (opcional)')}
          </h2>
          <label htmlFor="checkoutOrderNotes" className="sr-only">{t('Observações gerais (opcional)')}</label>
          <textarea
            id="checkoutOrderNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('Alguma observação geral para o pedido...')}
            className="min-h-24 w-full resize-y rounded-xl border border-gray-500 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-600 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
            rows={3}
            maxLength={300}
          />
        </section>

        {/* Informação de pagamento */}
        <section className="rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-5">
          <p className="text-center text-base font-semibold text-primary-700">
            {fulfillmentType === 'DELIVERY'
              ? t('O pagamento será realizado ao receber o pedido. Nenhum pagamento online será cobrado agora.')
              : t('O pagamento é realizado no balcão ao retirar o pedido.')}
          </p>
        </section>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-center text-red-700" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        </form>
      </main>

      {/* Footer com botão de confirmar */}
      <div className="safe-area-bottom fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-3 pt-3 shadow-lg sm:px-5">
        <button
          type="submit"
          form="checkout-form"
          disabled={loading || items.length === 0}
          className="touch-target mx-auto block w-full max-w-4xl rounded-2xl bg-primary-700 py-4 text-lg font-black text-white shadow-md transition hover:bg-primary-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-800 sm:py-5 sm:text-xl"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t('Enviando pedido...')}
            </span>
          ) : (
            t('✓ Confirmar Pedido')
          )}
        </button>
      </div>
    </div>
  );
}
