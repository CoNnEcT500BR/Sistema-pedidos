import { isAxiosError } from 'axios';
import { Banknote, CheckCircle2, CreditCard, QrCode, ShoppingBag, StepForward, StepBack } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CartItemRow } from '@/features/cart/components/CartItem';
import { useStaffCartStore } from '@/features/cart/store/staff-cart.store';
import type { CartAddon, CartItem as CartItemType } from '@/features/cart/store/cart.store';
import { ComboTouchModal } from '@/features/menu/components/ComboTouchModal';
import { MenuItemTouchModal } from '@/features/menu/components/MenuItemTouchModal';
import { useCategories, useCombos, useMenuItems } from '@/features/menu/hooks/useMenu';
import type { Combo, MenuItem } from '@/features/menu/types/menu.types';
import type { ItemValidationError, OrderValidationErrorResponse } from '@/features/orders/services/orders.service';
import { ordersService } from '@/features/orders/services/orders.service';
import { useI18n } from '@/i18n';

type PaymentMethod = 'CASH' | 'CARD' | 'PIX';

type Step = 'items' | 'payment';

const ITEMS_PER_PAGE = 8;
const AUTO_RETURN_SECONDS = 8;
const CART_PAGE_CAPACITY_DESKTOP = 10;
const CART_PAGE_CAPACITY_MEDIUM = 8;
const CART_PAGE_CAPACITY_SMALL = 6;

const paymentOptions: Array<{
  value: PaymentMethod;
  label: string;
  helper: string;
  icon: typeof Banknote;
}> = [
  { value: 'CASH', label: 'Dinheiro', helper: 'Com cálculo de troco', icon: Banknote },
  { value: 'CARD', label: 'Cartão', helper: 'Débito ou crédito', icon: CreditCard },
  { value: 'PIX', label: 'Pix', helper: 'Chave ou QR Code', icon: QrCode },
];

function parseCurrency(value: string): number {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function estimateCartItemSize(item: CartItemType): number {
  const removedCount = item.addons.filter((addon) => addon.removed).length;
  const extraCount = item.addons.filter((addon) => !addon.removed).length;
  const notesPenalty = item.notes ? Math.min(2, Math.ceil(item.notes.length / 40)) : 0;

  // Base do card + blocos extras (removidos/adicionais/obs) para paginação por tamanho visual.
  return 3 + (removedCount > 0 ? 2 : 0) + (extraCount > 0 ? 2 : 0) + notesPenalty;
}

function buildCartPagesBySize(items: CartItemType[], capacity: number): CartItemType[][] {
  if (items.length === 0) return [];

  const pages: CartItemType[][] = [];
  let currentPage: CartItemType[] = [];
  let currentSize = 0;

  items.forEach((item) => {
    const itemSize = estimateCartItemSize(item);

    if (currentPage.length === 0) {
      currentPage.push(item);
      currentSize = itemSize;
      return;
    }

    if (currentSize + itemSize > capacity) {
      pages.push(currentPage);
      currentPage = [item];
      currentSize = itemSize;
      return;
    }

    currentPage.push(item);
    currentSize += itemSize;
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function getCartPageCapacity(viewportHeight: number): number {
  if (viewportHeight <= 760) return CART_PAGE_CAPACITY_SMALL;
  if (viewportHeight <= 900) return CART_PAGE_CAPACITY_MEDIUM;
  return CART_PAGE_CAPACITY_DESKTOP;
}

function getPaymentLabel(method: PaymentMethod, t: (text: string) => string): string {
  switch (method) {
    case 'CASH':
      return t('Dinheiro');
    case 'CARD':
      return t('Cartão');
    case 'PIX':
      return t('Pix');
  }
}

function TouchMenuCard({ item, onSelect }: { item: MenuItem; onSelect: (item: MenuItem) => void }) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      disabled={!item.isAvailable}
      className={`min-h-[208px] rounded-3xl border p-3.5 text-left transition-all
        ${item.isAvailable
          ? 'border-stone-200 bg-white shadow-sm hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg'
          : 'cursor-not-allowed border-stone-200 bg-stone-100 opacity-60'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-3xl shrink-0">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={t(item.name)} className="h-full w-full object-cover" />
          ) : (
            item.icon ?? '🍔'
          )}
        </div>
        {!item.isAvailable && (
          <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
            {t('Esgotado')}
          </span>
        )}
      </div>

      <h3 className="mt-2.5 line-clamp-1 text-lg font-bold text-stone-900">{t(item.name)}</h3>
      <p className="mt-1 line-clamp-2 min-h-[40px] text-xs leading-5 text-stone-700">
        {item.description ? t(item.description) : t('Toque para personalizar e adicionar ao pedido.')}
      </p>

      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-xl font-bold text-primary-600">R$ {formatCurrency(item.price)}</p>
        <span className="inline-flex min-h-11 min-w-[106px] items-center justify-center rounded-xl bg-primary-800 px-3 py-2 text-xs font-bold text-white shadow-sm">
          + {t('Adicionar')}
        </span>
      </div>
    </button>
  );
}

export function TouchOrderPage() {
  const { t } = useI18n();
  const { categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const { items: menuItems, loading: itemsLoading } = useMenuItems(activeCategoryId);
  const { items: allMenuItems } = useMenuItems();
  const { combos, loading: combosLoading } = useCombos();
  const activeCombos = useMemo(() => combos.filter((combo) => combo.isActive), [combos]);
  const comboCategoryIds = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes('combo')).map((category) => category.id),
    [categories],
  );
  const isComboCategorySelected = Boolean(activeCategoryId && comboCategoryIds.includes(activeCategoryId));

  const comboAsMenuItems = useMemo<MenuItem[]>(
    () =>
      activeCombos.map((combo) => ({
        id: combo.id,
        categoryId: activeCategoryId ?? '',
        name: combo.name,
        description: combo.description,
        price: combo.price,
        imageUrl: combo.icon?.startsWith('http') ? combo.icon : undefined,
        icon: combo.icon,
        isAvailable: combo.isActive,
      })),
    [activeCategoryId, activeCombos],
  );

  const cartItems = useStaffCartStore((s) => s.items);
  const addMenuItem = useStaffCartStore((s) => s.addMenuItem);
  const addCombo = useStaffCartStore((s) => s.addCombo);
  const removeItem = useStaffCartStore((s) => s.removeItem);
  const updateQuantity = useStaffCartStore((s) => s.updateQuantity);
  const clearCart = useStaffCartStore((s) => s.clear);
  const totalPrice = useStaffCartStore((s) => s.getTotalPrice());

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [step, setStep] = useState<Step>('items');
  const [pageIndex, setPageIndex] = useState(0);
  const [cartPageIndex, setCartPageIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900,
  );

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ItemValidationError[]>([]);
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(AUTO_RETURN_SECONDS);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const cartPageCapacity = useMemo(
    () => getCartPageCapacity(viewportHeight),
    [viewportHeight],
  );

  const itemCountByCategory = useMemo(() => {
    const countMap = new Map<string, number>();

    allMenuItems.forEach((item) => {
      countMap.set(item.categoryId, (countMap.get(item.categoryId) ?? 0) + 1);
    });

    return countMap;
  }, [allMenuItems]);

  const visibleCategories = useMemo(() => {
    return categories.filter((category) => {
      if (comboCategoryIds.includes(category.id)) {
        return activeCombos.length > 0;
      }
      return (itemCountByCategory.get(category.id) ?? 0) > 0;
    });
  }, [activeCombos.length, categories, comboCategoryIds, itemCountByCategory]);

  const sourceItems = isComboCategorySelected ? comboAsMenuItems : menuItems;

  const pagesCount = Math.max(1, Math.ceil(sourceItems.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = pageIndex * ITEMS_PER_PAGE;
    return sourceItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sourceItems, pageIndex]);

  const cartPages = useMemo(
    () => buildCartPagesBySize(cartItems, cartPageCapacity),
    [cartItems, cartPageCapacity],
  );
  const cartPagesCount = Math.max(1, cartPages.length);
  const paginatedCartItems = cartPages[cartPageIndex] ?? [];

  const cashReceivedValue = parseCurrency(cashReceived);
  const changeDue = paymentMethod === 'CASH' ? cashReceivedValue - totalPrice : 0;
  const hasInsufficientCash = paymentMethod === 'CASH' && cashReceived.trim() !== '' && changeDue < 0;
  const isPaymentValid = cartItems.length > 0 && (paymentMethod !== 'CASH' || (cashReceived.trim().length > 0 && changeDue >= 0));

  useEffect(() => {
    if (!activeCategoryId) return;

    const isCategoryVisible = visibleCategories.some((category) => category.id === activeCategoryId);
    if (!isCategoryVisible) {
      setActiveCategoryId(undefined);
      setPageIndex(0);
    }
  }, [activeCategoryId, visibleCategories]);

  useEffect(() => {
    if (pageIndex <= pagesCount - 1) return;
    setPageIndex(Math.max(0, pagesCount - 1));
  }, [pageIndex, pagesCount]);

  useEffect(() => {
    function handleResize() {
      setViewportHeight(window.innerHeight);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (cartPageIndex <= cartPagesCount - 1) return;
    setCartPageIndex(Math.max(0, cartPagesCount - 1));
  }, [cartPageIndex, cartPagesCount]);

  useEffect(() => {
    if (!lastOrderNumber) {
      setAutoReturnCountdown(AUTO_RETURN_SECONDS);
      return;
    }

    const countdownInterval = setInterval(() => {
      setAutoReturnCountdown((current) => (current > 1 ? current - 1 : 1));
    }, 1000);

    const resetTimeout = setTimeout(() => {
      setLastOrderNumber(null);
      setActiveCategoryId(undefined);
      setStep('items');
      setAutoReturnCountdown(AUTO_RETURN_SECONDS);
    }, AUTO_RETURN_SECONDS * 1000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(resetTimeout);
    };
  }, [lastOrderNumber]);

  useEffect(() => {
    if (lastOrderNumber) {
      successHeadingRef.current?.focus();
    }
  }, [lastOrderNumber]);

  function handleOpenModal(item: MenuItem) {
    setLastOrderNumber(null);

    if (isComboCategorySelected) {
      const combo = activeCombos.find((entry) => entry.id === item.id);
      if (combo) {
        setSelectedCombo(combo);
        setComboModalOpen(true);
      }
      return;
    }

    setSelectedItem(item);
    setModalOpen(true);
  }

  function handleAddToCart(item: MenuItem, quantity: number, addons: CartAddon[]) {
    addMenuItem(item, quantity, addons);
  }

  function handleAddComboToCart(combo: Combo, quantity: number, addons: CartAddon[]) {
    addCombo(combo, quantity, addons);
  }

  function handleNextPage() {
    setPageIndex((current) => (current + 1 >= pagesCount ? current : current + 1));
  }

  function handlePreviousPage() {
    setPageIndex((current) => (current - 1 < 0 ? 0 : current - 1));
  }

  async function handleSubmitOrder() {
    if (!isPaymentValid) return;

    setSubmitting(true);
    setSubmitError(null);
    setValidationErrors([]);

    try {
      const paymentSummary =
        paymentMethod === 'CASH'
          ? `${t('Pagamento')}: ${t('Dinheiro')} | ${t('Recebido')} R$ ${formatCurrency(cashReceivedValue)} | ${t('Troco')} R$ ${formatCurrency(Math.max(changeDue, 0))}`
          : `${t('Pagamento')}: ${getPaymentLabel(paymentMethod, t)} | ${t('Confirmado no balcão')}`;

      const combinedNotes = [notes.trim(), paymentSummary].filter(Boolean).join(' | ');

      const order = await ordersService.createOrder(cartItems, customerName.trim() || undefined, combinedNotes || undefined);

      clearCart();
      setCustomerName('');
      setNotes('');
      setCashReceived('');
      setPaymentMethod('CASH');
      setStep('items');
      setLastOrderNumber(order.orderNumber);
      setAutoReturnCountdown(AUTO_RETURN_SECONDS);
    } catch (err) {
      if (isAxiosError(err)) {
        const response = err.response?.data as OrderValidationErrorResponse | undefined;
        if (response?.itemErrors && response.itemErrors.length > 0) {
          setValidationErrors(response.itemErrors);
        } else {
          setSubmitError(response?.message ?? t('Não foi possível criar o pedido.'));
        }
      } else {
        setSubmitError(t('Não foi possível criar o pedido.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (lastOrderNumber) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-stone-100 p-4 sm:p-6">
        <div className="w-full max-w-3xl rounded-[2.5rem] border border-stone-200 bg-white p-8 text-center shadow-2xl lg:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={42} />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-green-700">{t('Pagamento confirmado')}</p>
          <h2
            ref={successHeadingRef}
            tabIndex={-1}
            className="mt-3 text-4xl font-bold text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-900 lg:text-5xl"
          >
            {t('Pedido')} #{lastOrderNumber}
          </h2>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {t('Pedido {number} registrado com sucesso.', { number: lastOrderNumber })}
          </p>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            {t('O pedido foi registrado com sucesso. A tela voltara automaticamente para um novo atendimento.')}
          </p>

          <div className="mt-8 rounded-[2rem] bg-stone-900 px-6 py-5 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/75">{t('Próximo atendimento')}</p>
            <p className="mt-2 text-3xl font-bold">{t('em {seconds}s', { seconds: autoReturnCountdown })}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLastOrderNumber(null);
              setActiveCategoryId(undefined);
              setStep('items');
              setAutoReturnCountdown(AUTO_RETURN_SECONDS);
            }}
            className="mt-8 inline-flex items-center justify-center rounded-2xl border border-stone-300 px-6 py-3 text-base font-bold text-stone-800 transition-colors hover:bg-stone-50"
          >
            {t('Iniciar novo pedido agora')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-full min-w-0 grid-cols-1 gap-4 overflow-visible bg-stone-100 xl:h-full xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-0 xl:overflow-hidden">
      <section className="flex min-h-[65dvh] min-w-0 flex-col p-3 sm:p-4 xl:min-h-0 xl:p-5">
        <div className="grid min-h-[65dvh] flex-1 gap-4 overflow-visible rounded-[2rem] border border-stone-200 bg-white p-3 shadow-sm sm:p-4 xl:min-h-0 xl:overflow-hidden">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0">
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryId(undefined);
                  setPageIndex(0);
                }}
                aria-pressed={activeCategoryId === undefined}
                className={`touch-target shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors
                  ${activeCategoryId === undefined ? 'bg-primary-800 text-white ring-2 ring-primary-950 ring-offset-2' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                {t('Todos')}
              </button>
              {visibleCategories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setPageIndex(0);
                  }}
                  aria-pressed={activeCategoryId === cat.id}
                  className={`touch-target shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors
                    ${activeCategoryId === cat.id ? 'bg-primary-800 text-white ring-2 ring-primary-950 ring-offset-2' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {t(cat.name)}
                  <span className="ml-1 opacity-80">
                    ({comboCategoryIds.includes(cat.id) ? activeCombos.length : (itemCountByCategory.get(cat.id) ?? 0)})
                  </span>
                </button>
              ))}
            </div>

            <div className="inline-flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 xl:justify-center">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={pageIndex === 0}
                aria-label={t('Página anterior')}
                className="touch-target inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white disabled:opacity-40"
              >
                <StepBack size={16} aria-hidden="true" />
              </button>
              <span role="status" aria-live="polite" aria-atomic="true">
                {t('Página {current}/{total}', { current: pageIndex + 1, total: pagesCount })}
                {' · '}
                {t('Exibindo {first}-{last} de {total}', {
                  first: sourceItems.length === 0 ? 0 : pageIndex * ITEMS_PER_PAGE + 1,
                  last: pageIndex * ITEMS_PER_PAGE + paginatedItems.length,
                  total: sourceItems.length,
                })}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={pageIndex + 1 >= pagesCount}
                aria-label={t('Próxima página')}
                className="touch-target inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white disabled:opacity-40"
              >
                <StepForward size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 min-h-[45dvh] overflow-y-auto xl:min-h-0">
            {(isComboCategorySelected ? combosLoading : itemsLoading) ? (
              <div className="grid h-full place-items-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-500">
                {isComboCategorySelected ? t('Carregando combos...') : t('Carregando itens...')}
              </div>
            ) : paginatedItems.length === 0 ? (
              <div className="grid h-full place-items-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-500">
                {isComboCategorySelected ? t('Nenhum combo ativo nesta categoria.') : t('Nenhum item nesta categoria.')}
              </div>
            ) : (
              <div className="grid min-h-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginatedItems.map((item) => (
                  <TouchMenuCard key={item.id} item={item} onSelect={handleOpenModal} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="flex min-w-0 flex-col border-t border-stone-200 bg-white p-3 sm:p-4 xl:h-full xl:overflow-y-auto xl:border-l xl:border-t-0">
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900">
              <ShoppingBag size={18} />
              {t('Pedido atual')}
            </h2>
            <button
              type="button"
              onClick={clearCart}
              className="touch-target rounded-lg px-3 text-xs font-semibold text-stone-700 hover:text-red-700"
            >
              {t('Limpar')}
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
            {t('Total')}: <span className="font-bold text-stone-900">R$ {formatCurrency(totalPrice)}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setStep('items')}
              aria-pressed={step === 'items'}
              className={`touch-target flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${step === 'items' ? 'bg-primary-800 text-white ring-2 ring-primary-950 ring-offset-2' : 'border border-stone-200 bg-white text-stone-700'}`}
            >
              {t('Itens')}
            </button>
            <button
              type="button"
              onClick={() => setStep('payment')}
              aria-pressed={step === 'payment'}
              className={`touch-target flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${step === 'payment' ? 'bg-primary-800 text-white ring-2 ring-primary-950 ring-offset-2' : 'border border-stone-200 bg-white text-stone-700'}`}
              disabled={cartItems.length === 0}
            >
              {t('Pagamento')}
            </button>
          </div>
        </div>

        {step === 'items' ? (
          <div className="mt-4 min-h-[12rem] flex-1 space-y-3 xl:min-h-0">
            <div className="space-y-3 xl:h-full xl:overflow-hidden">
              {cartItems.length === 0 ? (
                <div className="grid h-full place-items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-600">
                  {t('Selecione os itens ao lado.')}
                </div>
              ) : (
                <div className="flex flex-col xl:h-full xl:overflow-hidden">
                  <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-700">
                    <button
                      type="button"
                      onClick={() => setCartPageIndex((current) => (current > 0 ? current - 1 : 0))}
                      disabled={cartPageIndex === 0}
                      className="touch-target rounded border border-stone-300 px-3 py-1 disabled:opacity-40"
                    >
                      {t('Ant.')}
                    </button>
                    <span>{cartPageIndex + 1}/{cartPagesCount}</span>
                    <button
                      type="button"
                      onClick={() => setCartPageIndex((current) => (current + 1 < cartPagesCount ? current + 1 : current))}
                      disabled={cartPageIndex + 1 >= cartPagesCount}
                      className="touch-target rounded border border-stone-300 px-3 py-1 disabled:opacity-40"
                    >
                      {t('Prox.')}
                    </button>
                  </div>

                  <div className="grid flex-1 auto-rows-fr gap-3 xl:overflow-hidden">
                    {paginatedCartItems.map((item) => (
                      <CartItemRow key={item.cartId} item={item} onRemove={removeItem} onUpdateQuantity={updateQuantity} />
                    ))}
                  </div>

                  {cartItems.length > paginatedCartItems.length && (
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      {t('Exibindo {shown} de {total} item(ns).', {
                        shown: paginatedCartItems.length,
                        total: cartItems.length,
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex-1 space-y-3 pr-1 xl:min-h-0 xl:overflow-y-auto">
            <div>
              <label htmlFor="touchCustomerName" className="mb-1.5 block text-sm font-semibold text-stone-700">
                {t('Nome do cliente')}
              </label>
              <input
                id="touchCustomerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('Opcional')}
                className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-800"
              />
            </div>

            <div>
              <label htmlFor="touchOrderNotes" className="mb-1.5 block text-sm font-semibold text-stone-700">
                {t('Observações')}
              </label>
              <textarea
                id="touchOrderNotes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Sem cebola, bem passado, etc.')}
                className="min-h-11 w-full resize-y rounded-xl border border-stone-500 px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-800"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-stone-800">{t('Forma de pagamento')}</legend>
              {paymentOptions.map(({ value, label, helper, icon: Icon }) => (
                <label
                  key={value}
                  htmlFor={`touch-payment-${value.toLowerCase()}`}
                  className={`touch-target flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-800 ${paymentMethod === value ? 'border-primary-700 bg-primary-50' : 'border-stone-200 bg-white hover:bg-stone-50'}`}
                >
                  <input
                    id={`touch-payment-${value.toLowerCase()}`}
                    type="radio"
                    name="touch-payment-method"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                    className="h-5 w-5 shrink-0 accent-primary-800"
                  />
                  <div className={`rounded-xl p-2 ${paymentMethod === value ? 'bg-primary-800 text-white' : 'bg-stone-100 text-stone-700'}`}>
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{t(label)}</p>
                    <p className="text-xs text-stone-700">{t(helper)}</p>
                  </div>
                </label>
              ))}
            </fieldset>

            {paymentMethod === 'CASH' && (
              <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <label htmlFor="touchCashReceived" className="block text-sm font-semibold text-stone-700">
                  {t('Valor recebido')}
                </label>
                <input
                  id="touchCashReceived"
                  type="text"
                  inputMode="decimal"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={t('0,00')}
                  className="min-h-11 w-full rounded-xl border border-stone-500 bg-white px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-primary-800"
                />
                <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm">
                  <span className="text-stone-700">{t('Troco')}</span>
                  <span className={changeDue < 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-700'}>
                    R$ {formatCurrency(Math.max(changeDue, 0))}
                  </span>
                </div>
                {hasInsufficientCash && <p className="text-xs font-medium text-red-600">{t('Valor insuficiente para cobrir o pedido.')}</p>}
              </div>
            )}

            {validationErrors.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {validationErrors.map((e, i) => (
                  <li key={i}>• {t(e.itemName)}: {t(e.message)}</li>
                ))}
              </ul>
            )}

            {submitError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{submitError}</p>
            )}

            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={!isPaymentValid || submitting}
              className="touch-target w-full rounded-2xl bg-primary-800 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t('Registrando pedido...') : t('Confirmar pagamento ({method})', { method: getPaymentLabel(paymentMethod, t) })}
            </button>
          </div>
        )}
      </aside>

      <MenuItemTouchModal
        item={selectedItem}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <ComboTouchModal
        combo={selectedCombo}
        open={comboModalOpen}
        onClose={() => {
          setComboModalOpen(false);
          setSelectedCombo(null);
        }}
        onAddToCart={handleAddComboToCart}
      />
    </div>
  );
}
