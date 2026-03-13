import { isAxiosError } from 'axios';
import { Banknote, CheckCircle2, CreditCard, QrCode, Search, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CartItemRow } from '@/features/cart/components/CartItem';
import { useStaffCartStore } from '@/features/cart/store/staff-cart.store';
import type { CartAddon } from '@/features/cart/store/cart.store';
import { ComboModal } from '@/features/menu/components/ComboModal';
import { MenuItemModal } from '@/features/menu/components/MenuItemModal';
import { useCategories, useCombos, useMenuItems } from '@/features/menu/hooks/useMenu';
import type { Combo, MenuItem } from '@/features/menu/types/menu.types';
import type { ItemValidationError, OrderValidationErrorResponse } from '@/features/orders/services/orders.service';
import { ordersService } from '@/features/orders/services/orders.service';
import { useI18n } from '@/i18n';

type PaymentMethod = 'CASH' | 'CARD' | 'PIX';

const AUTO_RETURN_SECONDS = 8;
const FAVORITES_CATEGORY_ID = '__favorites__';

const paymentOptions: Array<{
  value: PaymentMethod;
  label: string;
  helper: string;
  icon: typeof Banknote;
}> = [
  { value: 'CASH', label: 'Dinheiro', helper: 'Calcula troco automaticamente', icon: Banknote },
  { value: 'CARD', label: 'Cartão', helper: 'Pagamento confirmado no balcão', icon: CreditCard },
  { value: 'PIX', label: 'Pix', helper: 'Pagamento confirmado por chave ou QR', icon: QrCode },
];

function parseCurrency(value: string): number {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',');
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

function getFallbackFeaturedItems(items: MenuItem[]): MenuItem[] {
  const preferredKeywords = [
    'x-bacon',
    'x bacon',
    'x-salada',
    'x salada',
    'hamburguer',
    'hambúrguer',
    'burger',
    'batata',
    'combo',
    'refrigerante',
    'suco',
  ];

  const scored = items
    .filter((item) => item.isAvailable)
    .map((item, index) => {
      const haystack = `${item.name} ${item.description ?? ''}`.toLowerCase();
      const keywordScore = preferredKeywords.reduce((score, keyword, keywordIndex) => {
        return haystack.includes(keyword) ? score + (preferredKeywords.length - keywordIndex) : score;
      }, 0);

      return {
        item,
        score: keywordScore + Math.max(0, 3 - index),
      };
    })
    .sort((left, right) => right.score - left.score);

  return scored.slice(0, 4).map((entry) => entry.item);
}

interface StaffMenuCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

function StaffMenuCard({ item, onSelect }: StaffMenuCardProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      disabled={!item.isAvailable}
      className={`rounded-3xl border p-4 transition-all shadow-sm min-h-[220px]
        ${item.isAvailable
          ? 'border-stone-200 bg-white hover:-translate-y-1 hover:shadow-xl hover:border-primary-200'
          : 'border-stone-200 bg-stone-100 opacity-60 cursor-not-allowed'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-4xl overflow-hidden shrink-0">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={t(item.name)} className="h-full w-full object-cover" />
          ) : (
            item.icon ?? '🍔'
          )}
        </div>

        {!item.isAvailable && (
          <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">
            {t('Esgotado')}
          </span>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-bold text-stone-900 leading-tight">{t(item.name)}</h3>
        <p className="mt-2 text-sm leading-6 text-stone-700 min-h-[56px] line-clamp-3">
          {item.description ? t(item.description) : t('Toque para personalizar e adicionar ao pedido.')}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">{t('Preço')}</p>
          <p className="text-2xl font-bold text-primary-600">R$ {formatCurrency(item.price)}</p>
        </div>
        <div
          className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors
            ${item.isAvailable
              ? 'bg-primary-500 text-white group-hover:bg-primary-600'
              : 'bg-stone-200 text-stone-500'}`}
        >
          {t('Adicionar')}
        </div>
      </div>
    </button>
  );
}

export function NewOrderPage() {
  const { t } = useI18n();
  const cartItems = useStaffCartStore((s) => s.items);
  const addMenuItem = useStaffCartStore((s) => s.addMenuItem);
  const addCombo = useStaffCartStore((s) => s.addCombo);
  const removeItem = useStaffCartStore((s) => s.removeItem);
  const updateQuantity = useStaffCartStore((s) => s.updateQuantity);
  const clearCart = useStaffCartStore((s) => s.clear);
  const totalPrice = useStaffCartStore((s) => s.getTotalPrice());

  const { categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined);
  const isFavoritesSelected = activeCategoryId === FAVORITES_CATEGORY_ID;
  const categoryIdForApi = isFavoritesSelected ? undefined : activeCategoryId;
  const { items: menuItems, loading: itemsLoading } = useMenuItems(categoryIdForApi);
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

  const [search, setSearch] = useState('');
  const [featuredItemIds, setFeaturedItemIds] = useState<string[]>([]);

  const featuredItems = useMemo(() => {
    const backendDriven = featuredItemIds
      .map((id) => menuItems.find((item) => item.id === id))
      .filter((item): item is MenuItem => Boolean(item));

    if (backendDriven.length > 0) {
      return backendDriven;
    }

    return getFallbackFeaturedItems(menuItems);
  }, [featuredItemIds, menuItems]);

  const sourceItems = isComboCategorySelected
    ? comboAsMenuItems
    : (isFavoritesSelected ? featuredItems : menuItems);
  const filteredItems = useMemo(() => {
    if (!search.trim()) return sourceItems;
    const q = search.toLowerCase();
    return sourceItems.filter((i) => i.name.toLowerCase().includes(q));
  }, [sourceItems, search]);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [comboModalOpen, setComboModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ItemValidationError[]>([]);
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState(AUTO_RETURN_SECONDS);

  const cashReceivedValue = parseCurrency(cashReceived);
  const changeDue = paymentMethod === 'CASH' ? cashReceivedValue - totalPrice : 0;
  const hasInsufficientCash = paymentMethod === 'CASH' && cashReceived.trim() !== '' && changeDue < 0;
  const isPaymentValid =
    cartItems.length > 0 &&
    (paymentMethod !== 'CASH' || (cashReceived.trim().length > 0 && changeDue >= 0));

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
      setSearch('');
      setActiveCategoryId(undefined);
      setAutoReturnCountdown(AUTO_RETURN_SECONDS);
    }, AUTO_RETURN_SECONDS * 1000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(resetTimeout);
    };
  }, [lastOrderNumber]);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedFromOrders() {
      try {
        const orders = await ordersService.getOrders();
        const counts = new Map<string, number>();

        orders.forEach((order) => {
          order.items?.forEach((item) => {
            if (!item.menuItemId) return;
            counts.set(item.menuItemId, (counts.get(item.menuItemId) ?? 0) + item.quantity);
          });
        });

        const topIds = [...counts.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 4)
          .map(([id]) => id);

        if (!cancelled) {
          setFeaturedItemIds(topIds);
        }
      } catch {
        if (!cancelled) {
          setFeaturedItemIds([]);
        }
      }
    }

    loadFeaturedFromOrders();

    return () => {
      cancelled = true;
    };
  }, []);

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

      const order = await ordersService.createOrder(
        cartItems,
        customerName.trim() || undefined,
        combinedNotes || undefined,
      );

      clearCart();
      setCustomerName('');
      setNotes('');
      setCashReceived('');
      setPaymentMethod('CASH');
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
      <div className="flex min-h-full items-center justify-center bg-stone-100 p-6 lg:p-8">
        <div className="w-full max-w-3xl rounded-[2.5rem] bg-white p-8 text-center shadow-2xl border border-stone-200 lg:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={42} />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-green-700">
            {t('Pedido confirmado')}
          </p>
          <h1 className="mt-3 text-4xl font-bold text-stone-900 lg:text-5xl">
            {t('Pedido')} #{lastOrderNumber}
          </h1>
          <p className="mt-4 text-lg leading-8 text-stone-700">
            {t('O pedido foi registrado com pagamento confirmado. A tela voltará automaticamente para um novo atendimento.')}
          </p>

          <div className="mt-8 rounded-[2rem] bg-stone-900 px-6 py-5 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/75">{t('Próximo atendimento')}</p>
            <p className="mt-2 text-3xl font-bold">{t('em {seconds}s', { seconds: autoReturnCountdown })}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLastOrderNumber(null);
              setSearch('');
              setActiveCategoryId(undefined);
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
    <div className="grid h-full overflow-hidden bg-stone-100 xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="flex min-h-0 flex-col p-4 lg:p-6">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6">
          <section className="rounded-[2rem] bg-white border border-stone-200 p-4 shadow-sm">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div>
                <label htmlFor="search-item" className="mb-2 block text-sm font-semibold text-stone-800">
                  {t('Buscar lanche ou bebida')}
                </label>
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    id="search-item"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('Ex.: X-Bacon, batata, refrigerante...')}
                    className="w-full rounded-2xl border border-stone-300 bg-stone-50 py-4 pl-12 pr-4 text-base font-medium text-stone-900 placeholder:text-stone-500
                      focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800">
                {search.trim()
                  ? t('Resultados para "{value}"', { value: search.trim() })
                  : isFavoritesSelected
                    ? t('Exibindo somente os favoritos do restaurante')
                    : t('Use as categorias para acelerar o atendimento')}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategoryId(undefined)}
                className={`rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors
                  ${activeCategoryId === undefined
                    ? 'bg-primary-500 text-white shadow'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
              >
                {t('Todos')}
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryId(FAVORITES_CATEGORY_ID)}
                className={`rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors
                  ${isFavoritesSelected
                    ? 'bg-amber-500 text-white shadow'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
              >
                {t('Favoritos')}
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors
                    ${activeCategoryId === cat.id
                      ? 'bg-primary-500 text-white shadow'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
                >
                  {cat.icon ? `${cat.icon} ` : ''}
                  {t(cat.name)}
                </button>
              ))}
            </div>
          </section>

          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            <div className="space-y-6 pb-2">
              {!search.trim() && !isFavoritesSelected && !isComboCategorySelected && featuredItems.length > 0 ? (
                <section className="rounded-[2rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">{t('Mais vendidos')}</p>
                      <h2 className="mt-2 text-2xl font-bold text-stone-900">{t('Itens puxados do histórico de pedidos')}</h2>
                      <p className="mt-2 text-sm font-medium text-stone-700">
                        {t('Destaques baseados nos itens mais registrados no backend para acelerar o atendimento.')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
                    {featuredItems.map((item) => (
                      <StaffMenuCard
                        key={`featured-${item.id}`}
                        item={item}
                        onSelect={handleOpenModal}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                {(isComboCategorySelected ? combosLoading : itemsLoading) ? (
                  <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center text-stone-400">
                    {isComboCategorySelected ? t('Carregando combos...') : t('Carregando itens...')}
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="rounded-[2rem] border border-stone-200 bg-white p-8 text-center text-stone-400">
                    {isComboCategorySelected ? t('Nenhum combo ativo encontrado.') : t('Nenhum item encontrado.')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                    {filteredItems.map((item) => (
                      <StaffMenuCard
                        key={item.id}
                        item={item}
                        onSelect={handleOpenModal}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      <aside className="flex flex-col border-t border-stone-200 bg-white xl:sticky xl:top-0 xl:h-[calc(100vh-81px)] xl:border-l xl:border-t-0">
        <div className="px-5 py-5 border-b border-stone-100 bg-white xl:sticky xl:top-0 xl:z-10">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-stone-900 flex items-center gap-2 text-lg">
              <ShoppingBag size={18} />
              {t('Resumo do pedido')}
            </h2>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
                {t('Limpar')}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {lastOrderNumber ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
              <p className="text-xs font-semibold uppercase tracking-wide">{t('Pedido registrado')}</p>
              <p className="mt-1 text-lg font-bold">{t('Pedido #{number} confirmado com pagamento.', { number: lastOrderNumber })}</p>
            </div>
          ) : null}

          {cartItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center text-stone-600 text-sm font-medium">
              {t('Selecione os lanches do lado esquerdo para montar o pedido.')}
            </div>
          ) : (
            cartItems.map((item) => (
              <CartItemRow
                key={item.cartId}
                item={item}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
              />
            ))
          )}

          <div className="space-y-3 rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('Nome do cliente')}
              </label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('Opcional')}
                className="w-full px-3 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-500
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="orderNotes" className="block text-sm font-semibold text-stone-800 mb-1.5">
                {t('Observações do pedido')}
              </label>
              <textarea
                id="orderNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('Sem cebola, entregar rápido, etc.')}
                rows={3}
                className="w-full px-3 py-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-500 resize-none
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-base font-bold text-stone-900">{t('Pagamento')}</p>
              <p className="text-sm text-stone-700 mt-1">{t('Escolha como o cliente pagou para liberar o registro do pedido.')}</p>
            </div>

            <div className="space-y-2">
              {paymentOptions.map(({ value, label, helper, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors
                    ${paymentMethod === value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-stone-200 hover:bg-stone-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl p-2 ${paymentMethod === value ? 'bg-primary-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{t(label)}</p>
                      <p className="text-xs text-stone-700 mt-0.5">{t(helper)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {paymentMethod === 'CASH' && (
              <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <label htmlFor="cashReceived" className="block text-sm font-semibold text-stone-700">
                  {t('Valor recebido')}
                </label>
                <input
                  id="cashReceived"
                  type="text"
                  inputMode="decimal"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={t('0,00')}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-base font-medium text-stone-900 placeholder:text-stone-500
                    focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm border border-stone-200">
                  <span className="font-medium text-stone-700">{t('Troco')}</span>
                  <span className={`font-semibold ${changeDue < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    R$ {formatCurrency(Math.max(changeDue, 0))}
                  </span>
                </div>
                {hasInsufficientCash && (
                  <p className="text-xs font-medium text-red-600">
                    {t('Valor insuficiente para cobrir o pedido.')}
                  </p>
                )}
              </div>
            )}
          </div>

          {validationErrors.length > 0 && (
            <ul className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              {validationErrors.map((e, i) => (
                <li key={i}>• {t(e.itemName)}: {t(e.message)}</li>
              ))}
            </ul>
          )}
          {submitError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              {submitError}
            </p>
          )}

          <div className="rounded-3xl bg-gradient-to-r from-primary-700 to-primary-600 p-5 text-white shadow-lg shadow-primary-200/70">
            <div className="flex items-center justify-between text-sm text-white/90">
              <span>{t('Total do pedido')}</span>
              <span>{t('{count} item(ns)', { count: cartItems.length })}</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <span className="text-3xl font-bold">R$ {formatCurrency(totalPrice)}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {getPaymentLabel(paymentMethod, t)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={!isPaymentValid || submitting}
            className="w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50
              disabled:cursor-not-allowed text-white font-bold text-base transition-colors shadow-lg shadow-primary-200"
          >
            {submitting ? t('Registrando pedido...') : t('Registrar pedido e confirmar pagamento')}
          </button>
        </div>
      </aside>

      <MenuItemModal
        item={selectedItem}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <ComboModal
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
