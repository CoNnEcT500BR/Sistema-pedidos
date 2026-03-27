import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, GripVertical, Pencil, Plus, Power, Trash2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { EmojiPickerField } from '@/components/ui/emoji-picker-field';
import { Input } from '@/components/ui/input';
import { adminService } from '@/features/admin/services/admin.service';
import { menuErrorRules } from '@/features/admin/utils/api-error-rules';
import { resolveApiErrorMessage } from '@/features/admin/utils/api-error';
import { useCatalogRealtimeRefresh } from '@/hooks/useCatalogRealtimeRefresh';
import type { AdminMenuItemDetail } from '@/features/admin/types/admin.types';
import type { Addon, Category, MenuItem } from '@/features/menu/types/menu.types';
import { resolveIngredientMeta, type ProductScope } from '@/features/menu/utils/ingredient-meta';
import { useI18n } from '@/i18n';

interface MenuFormState {
  id?: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  icon: string;
  imageUrl: string;
  displayOrder: string;
  isAvailable: boolean;
  assemblyAddonIds: string[];
  breadAddonIds: string[];
  extraAddonIds: string[];
}

const emptyForm: MenuFormState = {
  categoryId: '',
  name: '',
  description: '',
  price: '',
  icon: '',
  imageUrl: '',
  displayOrder: '0',
  isAvailable: true,
  assemblyAddonIds: [],
  breadAddonIds: [],
  extraAddonIds: [],
};

const productScopeLabels: Record<ProductScope, string> = {
  BURGER: 'Conjunto hambúrguer',
  BURGER_BUILD: 'Conjunto criação hambúrguer',
  DRINK: 'Conjunto bebida',
  SIDE: 'Conjunto acompanhamento',
  COMBO: 'Conjunto combo',
  GENERAL: 'Conjunto geral',
};

function normalizeScopeSource(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferMenuItemScope(categoryName?: string, itemName?: string): ProductScope {
  const value = normalizeScopeSource(`${categoryName ?? ''} ${itemName ?? ''}`);

  if (/(criacao|criar|monte|personaliz|custom)/.test(value) && /(hamburg|burger|lanche|sanduiche)/.test(value)) return 'BURGER_BUILD';
  if (/(bebida|refrigerante|suco|agua|cha|milkshake)/.test(value)) return 'DRINK';
  if (/(acompanhamento|batata|nugget|onion|side)/.test(value)) return 'SIDE';
  if (/(combo)/.test(value)) return 'COMBO';
  if (/(hamburg|burger|lanche|sanduiche)/.test(value)) return 'BURGER';

  return 'GENERAL';
}

function isNamedAsExtra(value: string): boolean {
  const normalized = normalizeScopeSource(value);
  return /\bextra\b|\bextras\b|\badicional\b|\badicionais\b/.test(normalized);
}

function isNamedAsBread(value: string): boolean {
  const normalized = normalizeScopeSource(value);
  return /\bpao\b|\bpao\s+de\b|\bbread\b|\bbun\b/.test(normalized);
}

function isAddonTypeAllowedForScope(addonType: Addon['addonType'], scope: ProductScope): boolean {
  if (scope === 'BURGER_BUILD') {
    return addonType === 'SUBSTITUTION' || addonType === 'REMOVAL';
  }

  if (addonType === 'SIZE_CHANGE') {
    return scope === 'DRINK' || scope === 'SIDE' || scope === 'COMBO';
  }

  return true;
}

function isAddonCompatibleWithScope(addon: Addon, scope: ProductScope): boolean {
  const addonScope = resolveIngredientMeta(addon).scope;

  if (!isAddonTypeAllowedForScope(addon.addonType, scope)) {
    return false;
  }

  if (scope === 'BURGER_BUILD') {
    if (isNamedAsExtra(addon.name)) return false;
  }

  if (addonScope === 'GENERAL' || scope === 'GENERAL') return true;
  if (scope === 'BURGER_BUILD') return addonScope === 'BURGER_BUILD' || addonScope === 'BURGER';
  return addonScope === scope;
}

function getAddonIncompatibilityReason(addon: Addon, scope: ProductScope): string {
  const addonScope = resolveIngredientMeta(addon).scope;

  if (!isAddonTypeAllowedForScope(addon.addonType, scope)) {
    if (scope === 'BURGER_BUILD') {
      return 'Itens de criação aceitam apenas montagem (remover/substituir).';
    }
    if (addon.addonType === 'SIZE_CHANGE') {
      return 'Variação de tamanho só é válida para bebida, acompanhamento ou combo.';
    }
    return 'Tipo de adicional não permitido para este item.';
  }

  if (scope === 'BURGER_BUILD' && isNamedAsExtra(addon.name)) {
    return 'Extras não são permitidos em criação de hambúrguer.';
  }

  if (scope === 'GENERAL' || addonScope === 'GENERAL') {
    return '';
  }

  if (scope === 'BURGER_BUILD' && !(addonScope === 'BURGER_BUILD' || addonScope === 'BURGER')) {
    return 'Escopo incompatível com criação de hambúrguer.';
  }

  if (addonScope !== scope) {
    return 'Escopo do ingrediente não corresponde ao escopo do item.';
  }

  return '';
}

export function MenuManagementPage() {
  const { t, language } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeAddonTab, setActiveAddonTab] = useState<'ASSEMBLY' | 'BREAD' | 'EXTRA'>('ASSEMBLY');
  const [showAllAddons, setShowAllAddons] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MenuItem | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState<MenuFormState>(emptyForm);

  const resolveMenuApiErrorMessage = useCallback(
    (err: unknown, fallbackMessage: string) =>
      resolveApiErrorMessage(err, fallbackMessage, t, menuErrorRules),
    [t],
  );

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    [language],
  );

  const categoryChartData = useMemo(() => {
    if (!items.length) return [];

    const totalsByCategory = items.reduce<Record<string, { total: number; available: number }>>(
      (acc, item) => {
        const name = item.category?.name ?? t('Sem categoria');
        if (!acc[name]) {
          acc[name] = { total: 0, available: 0 };
        }

        acc[name].total += 1;
        if (item.isAvailable) {
          acc[name].available += 1;
        }

        return acc;
      },
      {},
    );

    return Object.entries(totalsByCategory)
      .map(([name, values]) => ({
        name,
        total: values.total,
        available: values.available,
        percentage: Math.round((values.total / items.length) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [items, t]);

  const selectedCategoryName = useMemo(
    () => categories.find((category) => category.id === form.categoryId)?.name,
    [categories, form.categoryId],
  );

  const currentItemScope = useMemo(
    () => inferMenuItemScope(selectedCategoryName, form.name),
    [form.name, selectedCategoryName],
  );

  const selectedAddonIds = useMemo(
    () => [...form.assemblyAddonIds, ...form.breadAddonIds, ...form.extraAddonIds],
    [form.assemblyAddonIds, form.breadAddonIds, form.extraAddonIds],
  );

  const selectedAddonIdSet = useMemo(() => new Set(selectedAddonIds), [selectedAddonIds]);

  const addonById = useMemo(() => {
    const map = new Map<string, Addon>();
    addons.forEach((addon) => {
      map.set(addon.id, addon);
    });
    return map;
  }, [addons]);

  const addonCompatibilityById = useMemo(() => {
    const map = new Map<string, { compatible: boolean; scope: ProductScope }>();

    addons.forEach((addon) => {
      map.set(addon.id, {
        compatible: isAddonCompatibleWithScope(addon, currentItemScope),
        scope: resolveIngredientMeta(addon).scope,
      });
    });

    return map;
  }, [addons, currentItemScope]);

  const filteredAssemblyAddons = useMemo(() => {
    const assemblySource = addons.filter((addon) => addon.addonType !== 'EXTRA');
    if (showAllAddons) return assemblySource;

    return assemblySource.filter(
      (addon) =>
        (addonCompatibilityById.get(addon.id)?.compatible ?? false) ||
        form.assemblyAddonIds.includes(addon.id),
    );
  }, [addonCompatibilityById, addons, form.assemblyAddonIds, showAllAddons]);

  const showBreadTab = currentItemScope === 'BURGER';

  const filteredBreadAddons = useMemo(() => {
    if (!showBreadTab) {
      return [];
    }

    const breadSource = addons.filter((addon) => addon.addonType !== 'EXTRA' && isNamedAsBread(addon.name));

    if (showAllAddons) return breadSource;

    return breadSource.filter(
      (addon) =>
        (addonCompatibilityById.get(addon.id)?.compatible ?? false) ||
        form.breadAddonIds.includes(addon.id),
    );
  }, [addonCompatibilityById, addons, form.breadAddonIds, showAllAddons, showBreadTab]);

  const filteredExtraAddons = useMemo(() => {
    const extraSource = addons.filter((addon) => addon.addonType === 'EXTRA');
    if (currentItemScope === 'BURGER_BUILD') {
      return [];
    }

    if (showAllAddons) return extraSource;

    return extraSource.filter(
      (addon) =>
        (addonCompatibilityById.get(addon.id)?.compatible ?? false) ||
        form.extraAddonIds.includes(addon.id),
    );
  }, [addonCompatibilityById, addons, currentItemScope, form.extraAddonIds, showAllAddons]);

  const incompatibleVisibleCount = useMemo(() => {
    const source =
      activeAddonTab === 'ASSEMBLY'
        ? filteredAssemblyAddons
        : activeAddonTab === 'BREAD'
          ? filteredBreadAddons
          : filteredExtraAddons;

    return source.filter((addon) => !(addonCompatibilityById.get(addon.id)?.compatible ?? false)).length;
  }, [activeAddonTab, addonCompatibilityById, filteredAssemblyAddons, filteredBreadAddons, filteredExtraAddons]);

  const selectedCategoryItems = useMemo(
    () =>
      items.filter((item) => item.categoryId === form.categoryId && (!form.id || item.id !== form.id)),
    [form.categoryId, form.id, items],
  );

  const availableDisplayOrders = useMemo(() => {
    const usedOrders = new Set(
      selectedCategoryItems
        .map((item) => item.displayOrder)
        .filter((order): order is number => typeof order === 'number'),
    );
    const highestTaken = selectedCategoryItems.reduce(
      (max, item) => Math.max(max, item.displayOrder ?? -1),
      -1,
    );

    const available: number[] = [];
    for (let order = 0; order <= highestTaken + 1; order += 1) {
      if (!usedOrders.has(order)) {
        available.push(order);
      }
    }

    const currentOrder = Number(form.displayOrder || 0);
    if (
      Number.isInteger(currentOrder) &&
      currentOrder >= 0 &&
      !usedOrders.has(currentOrder) &&
      !available.includes(currentOrder)
    ) {
      available.push(currentOrder);
    }

    return available.sort((a, b) => a - b);
  }, [form.displayOrder, selectedCategoryItems]);

  const incompatibleSelectedAddons = useMemo(() => {
    return addons.filter(
      (addon) => selectedAddonIdSet.has(addon.id) && !(addonCompatibilityById.get(addon.id)?.compatible ?? false),
    );
  }, [addonCompatibilityById, addons, selectedAddonIdSet]);

  const loadBaseData = useCallback(async (categoryId = selectedCategory) => {
    setLoading(true);
    setError('');
    try {
      const [nextCategories, nextItems, nextAddons] = await Promise.all([
        adminService.getAdminCategories(),
        adminService.getAdminMenuItems(categoryId || undefined),
        adminService.getAllAddons(),
      ]);
      setCategories(nextCategories);
      setItems(nextItems);
      setAddons(nextAddons);

      if (!selectedCategory && nextCategories[0]?.id) {
        setForm((current) => ({ ...current, categoryId: current.categoryId || nextCategories[0].id }));
      }
    } catch {
      setError(t('Não foi possível carregar o gerenciamento de cardápio.'));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, t]);

  const loadMenuItemsOnly = useCallback(async (categoryId = selectedCategory) => {
    try {
      const nextItems = await adminService.getAdminMenuItems(categoryId || undefined);
      setItems(nextItems);
    } catch {
      setError(t('Nao foi possivel atualizar a lista de itens do cardapio.'));
    }
  }, [selectedCategory, t]);

  useEffect(() => {
    loadBaseData('');
  }, [loadBaseData]);

  useEffect(() => {
    if (selectedCategory === '') {
      loadBaseData('');
      return;
    }

    loadBaseData(selectedCategory);
  }, [selectedCategory, loadBaseData]);

  useCatalogRealtimeRefresh(() => {
    void loadMenuItemsOnly(selectedCategory);
  });

  useEffect(() => {
    if (!dialogOpen || !availableDisplayOrders.length) {
      return;
    }

    const currentOrder = Number(form.displayOrder || 0);
    if (availableDisplayOrders.includes(currentOrder)) {
      return;
    }

    setForm((current) => ({ ...current, displayOrder: String(availableDisplayOrders[0]) }));
  }, [availableDisplayOrders, dialogOpen, form.displayOrder]);

  useEffect(() => {
    if (activeAddonTab === 'BREAD' && !showBreadTab) {
      setActiveAddonTab('ASSEMBLY');
    }
  }, [activeAddonTab, showBreadTab]);

  function resetMessages() {
    setError('');
    setSuccess('');
  }

  function openCreate() {
    resetMessages();
    setShowAllAddons(false);
    setActiveAddonTab('ASSEMBLY');
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? '',
    });
    setDialogOpen(true);
  }

  function applyDetailToForm(detail: AdminMenuItemDetail, duplicate = false) {
    setShowAllAddons(false);
    setActiveAddonTab('ASSEMBLY');
    const assemblyAddonIds = detail.addons
      .filter((addon) => addon.assignmentType === 'ASSEMBLY')
      .map((addon) => addon.addonId);
    const breadAddonIds = detail.addons
      .filter((addon) => addon.assignmentType === 'BREAD')
      .map((addon) => addon.addonId);
    const extraAddonIds = detail.addons
      .filter((addon) => addon.assignmentType === 'EXTRA')
      .map((addon) => addon.addonId);

    // Compatibilidade com registros antigos sem assignmentType consistente.
    const fallbackExtraIds = detail.addons
      .filter((addon) => addon.addon.addonType === 'EXTRA')
      .map((addon) => addon.addonId);

    setForm({
      id: duplicate ? undefined : detail.id,
      categoryId: detail.categoryId,
      name: duplicate ? `${detail.name} ${t('(cópia)')}` : detail.name,
      description: detail.description ?? '',
      price: String(detail.price),
      icon: detail.icon ?? '',
      imageUrl: detail.imageUrl ?? '',
      displayOrder: String(detail.displayOrder ?? 0),
      isAvailable: duplicate ? true : detail.isAvailable,
      assemblyAddonIds,
      breadAddonIds,
      extraAddonIds: extraAddonIds.length ? extraAddonIds : fallbackExtraIds,
    });
    setDialogOpen(true);
  }

  async function openEdit(itemId: string, duplicate = false) {
    resetMessages();
    try {
      const detail = await adminService.getMenuItemDetail(itemId);
      applyDetailToForm(detail, duplicate);
    } catch {
      setError(t('Não foi possível carregar os detalhes do item.'));
    }
  }

  function updateField<Key extends keyof MenuFormState>(key: Key, value: MenuFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAddon(addonId: string, target: 'ASSEMBLY' | 'BREAD' | 'EXTRA') {
    const addon = addonById.get(addonId);
    if (!addon) return;

    const isCompatible = addonCompatibilityById.get(addonId)?.compatible ?? false;

    setForm((current) => {
      const currentTargetIds =
        target === 'ASSEMBLY'
          ? current.assemblyAddonIds
          : target === 'BREAD'
            ? current.breadAddonIds
            : current.extraAddonIds;
      const isSelected = currentTargetIds.includes(addonId);

      if (isSelected) {
        return {
          ...current,
          assemblyAddonIds:
            target === 'ASSEMBLY'
              ? current.assemblyAddonIds.filter((id) => id !== addonId)
              : current.assemblyAddonIds,
          breadAddonIds:
            target === 'BREAD'
              ? current.breadAddonIds.filter((id) => id !== addonId)
              : current.breadAddonIds,
          extraAddonIds:
            target === 'EXTRA'
              ? current.extraAddonIds.filter((id) => id !== addonId)
              : current.extraAddonIds,
        };
      }

      if (!isCompatible) {
        setError(t('Este adicional não é permitido para a criação de hambúrguer.'));
        return current;
      }

      return {
        ...current,
        assemblyAddonIds:
          target === 'ASSEMBLY'
            ? [...current.assemblyAddonIds, addonId]
            : current.assemblyAddonIds.filter((id) => id !== addonId),
        breadAddonIds:
          target === 'BREAD'
            ? [...current.breadAddonIds, addonId]
            : current.breadAddonIds.filter((id) => id !== addonId),
        extraAddonIds:
          target === 'EXTRA'
            ? [...current.extraAddonIds, addonId]
            : current.extraAddonIds.filter((id) => id !== addonId),
      };
    });
  }

  async function handleDropReorder(targetItemId: string) {
    if (!selectedCategory || !draggedItemId || draggedItemId === targetItemId || reordering) {
      return;
    }

    const currentItems = items.filter((item) => item.categoryId === selectedCategory);
    const fromIndex = currentItems.findIndex((item) => item.id === draggedItemId);
    const toIndex = currentItems.findIndex((item) => item.id === targetItemId);

    if (fromIndex < 0 || toIndex < 0) {
      setDraggedItemId(null);
      return;
    }

    const reordered = [...currentItems];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const reorderedWithDisplayOrder = reordered.map((item, index) => ({
      ...item,
      displayOrder: index,
    }));

    setItems(reorderedWithDisplayOrder);
    setDraggedItemId(null);
    setReordering(true);
    setError('');

    try {
      await adminService.reorderAdminMenuItems(
        selectedCategory,
        reorderedWithDisplayOrder.map((item) => item.id),
      );
      setSuccess(t('Ordem dos itens atualizada com sucesso.'));
    } catch (err) {
      const message = resolveMenuApiErrorMessage(err, 'Não foi possível reordenar os itens.');
      setError(message);
      await loadBaseData(selectedCategory);
    } finally {
      setReordering(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    resetMessages();

    if (!form.categoryId || !form.name.trim() || Number(form.price) <= 0) {
      setError(t('Preencha categoria, nome e preço válido antes de salvar.'));
      return;
    }

    if (currentItemScope === 'BURGER_BUILD' && form.extraAddonIds.length > 0) {
      setError(t('No fluxo de criação de hambúrguer, extras não podem ser vinculados ao item.'));
      return;
    }

    setSaving(true);
    try {
      const validatedAssemblyAddonIds = form.assemblyAddonIds.filter((addonId) => {
        return addonCompatibilityById.get(addonId)?.compatible ?? false;
      });

      const validatedBreadAddonIds = form.breadAddonIds.filter((addonId) => {
        const addon = addonById.get(addonId);
        if (!addon) return false;
        if (!isNamedAsBread(addon.name)) return false;
        return addonCompatibilityById.get(addonId)?.compatible ?? false;
      });

      const validatedExtraAddonIds = form.extraAddonIds.filter((addonId) => {
        const addon = addonById.get(addonId);
        if (!addon) return false;
        if (addon.addonType !== 'EXTRA') return false;
        return addonCompatibilityById.get(addonId)?.compatible ?? false;
      });

      if (
        validatedAssemblyAddonIds.length !== form.assemblyAddonIds.length ||
        validatedBreadAddonIds.length !== form.breadAddonIds.length ||
        validatedExtraAddonIds.length !== form.extraAddonIds.length
      ) {
        setError(t('Alguns adicionais incompatíveis foram removidos antes de salvar.'));
      }

      const payload = {
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        icon: form.icon.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        displayOrder: Number(form.displayOrder || 0),
        isAvailable: form.isAvailable,
        assemblyAddonIds: validatedAssemblyAddonIds,
        breadAddonIds: showBreadTab ? validatedBreadAddonIds : [],
        extraAddonIds: currentItemScope === 'BURGER_BUILD' ? [] : validatedExtraAddonIds,
      };

      if (form.id) {
        await adminService.updateMenuItem(form.id, payload);
        setSuccess(t('Item atualizado com sucesso.'));
      } else {
        await adminService.createMenuItem(payload);
        setSuccess(t('Item criado com sucesso.'));
      }

      setDialogOpen(false);
      await loadMenuItemsOnly(selectedCategory);
    } catch (err) {
      const message = resolveMenuApiErrorMessage(err, 'Não foi possível salvar o item.');
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailability(item: MenuItem) {
    resetMessages();
    try {
      await adminService.updateMenuItemAvailability(item.id, !item.isAvailable);
      setSuccess(
        item.isAvailable ? t('Item marcado como indisponível.') : t('Item marcado como disponível.'),
      );
      await loadMenuItemsOnly(selectedCategory);
    } catch (err) {
      const message = resolveMenuApiErrorMessage(
        err,
        'Não foi possível atualizar a disponibilidade do item.',
      );
      setError(message);
    }
  }

  async function handleRemove(item: MenuItem) {
    resetMessages();
    setRemoveTarget(item);
  }

  async function confirmRemoveItem() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await adminService.deleteMenuItem(removeTarget.id);
      setSuccess(t('Item removido com sucesso.'));
      setRemoveTarget(null);
      await loadMenuItemsOnly(selectedCategory);
    } catch (err) {
      const message = resolveMenuApiErrorMessage(err, 'Não foi possível remover o item.');
      setError(message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Gerenciar cardápio')}</h1>
          <p className="mt-2 text-sm text-stone-600">{t('Edite itens, disponibilidade e adicionais sem sair do fluxo administrativo.')}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 outline-none focus:ring-2 focus:ring-stone-300"
          >
            <option value="">{t('Todas as categorias')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <Plus size={16} />
            {t('Novo item')}
          </button>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <div className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-900">{t('Visual do cardápio por categoria')}</h2>
            <p className="text-sm text-stone-600">{t('Distribuição de itens e taxa de disponibilidade por categoria.')}</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
            {t('{count} itens', { count: items.length })}
          </span>
        </div>

        {categoryChartData.length ? (
          <div className="space-y-3">
            {categoryChartData.map((entry) => (
              <div key={entry.name} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <p className="font-semibold text-stone-900">{entry.name}</p>
                  <p className="text-stone-600">
                    {entry.total} {t('itens')} · {entry.available}/{entry.total} {t('Disponível')}
                  </p>
                </div>
                <div className="h-3 rounded-full bg-stone-200">
                  <div className="h-3 rounded-full bg-stone-900" style={{ width: `${Math.max(entry.percentage, 4)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500">{t('Sem dados')}</p>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-5 py-4">{t('Ordem')}</th>
                <th className="px-5 py-4">{t('Item')}</th>
                <th className="px-5 py-4">{t('Categoria')}</th>
                <th className="px-5 py-4">{t('Preço')}</th>
                <th className="px-5 py-4">{t('Status')}</th>
                <th className="px-5 py-4 text-right">{t('Ações')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-stone-500">
                    {t('Carregando cardápio administrativo...')}
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`align-top ${draggedItemId === item.id ? 'bg-stone-50' : ''}`}
                    draggable={Boolean(selectedCategory) && !reordering}
                    onDragStart={() => setDraggedItemId(item.id)}
                    onDragOver={(event) => {
                      if (!selectedCategory || reordering) return;
                      event.preventDefault();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      void handleDropReorder(item.id);
                    }}
                    onDragEnd={() => setDraggedItemId(null)}
                  >
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-stone-700">
                        {selectedCategory ? <GripVertical size={14} className="text-stone-500" /> : null}
                        <span>{(item.displayOrder ?? 0) + 1}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-lg">
                          {item.icon || '🍔'}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">{item.name}</p>
                          <p className="mt-1 max-w-md text-xs leading-5 text-stone-500">{item.description || t('Sem descrição')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{item.category?.name ?? '-'}</td>
                    <td className="px-5 py-4 font-semibold text-stone-900">{currency.format(item.price)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.isAvailable ? t('Disponível') : t('Indisponível')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(item.id)} className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900" aria-label={t('Editar')}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => openEdit(item.id, true)} className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900" aria-label={t('Duplicar item')}>
                          <Copy size={16} />
                        </button>
                        <button type="button" onClick={() => handleAvailability(item)} className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900" aria-label={t('Alternar disponibilidade')}>
                          <Power size={16} />
                        </button>
                        <button type="button" onClick={() => handleRemove(item)} className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600" aria-label={t('Remover item')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-stone-500">
                    {t('Nenhum item encontrado para o filtro atual.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-stone-200 bg-stone-50 px-5 py-3 text-xs text-stone-600">
          {selectedCategory
            ? reordering
              ? t('Atualizando ordem do cardápio...')
              : t('Arraste as linhas para reordenar os itens desta categoria.')
            : t('Selecione uma categoria para habilitar reordenação por arraste.')}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-[2rem] p-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b border-stone-200 px-6 py-5">
              <DialogTitle>{form.id ? t('Editar item') : t('Novo item')}</DialogTitle>
              <DialogDescription>{t('Atualize dados principais, disponibilidade e adicionais permitidos para o item.')}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Nome')}</label>
                  <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Categoria')}</label>
                  <select value={form.categoryId} onChange={(event) => updateField('categoryId', event.target.value)} className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Descrição')}</label>
                  <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} className="min-h-[120px] w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Preço')}</label>
                    <CurrencyInput value={form.price} onChange={(value) => updateField('price', value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Ordem de exibição')}</label>
                    <select
                      value={form.displayOrder}
                      onChange={(event) => updateField('displayOrder', event.target.value)}
                      className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {availableDisplayOrders.map((order) => (
                        <option key={order} value={String(order)}>
                          {t('Posição {order}', { order: order + 1 })}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-stone-500">
                      {t('A lista mostra apenas posições livres para evitar repetição na categoria.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Ícone')}</label>
                    <EmojiPickerField
                      value={form.icon}
                      onChange={(value) => updateField('icon', value)}
                      buttonLabel={t('Selecionar emoji')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Imagem URL')}</label>
                    <Input value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700">
                  <input type="checkbox" checked={form.isAvailable} onChange={(event) => updateField('isAvailable', event.target.checked)} className="h-4 w-4 rounded border-stone-300" />
                  {t('Item disponível para venda')}
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-700">{t('Adicionais permitidos')}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                        {t(productScopeLabels[currentItemScope])}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAllAddons((current) => !current)}
                        className="rounded-xl border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                      >
                        {showAllAddons ? t('Mostrar somente compatíveis') : t('Mostrar todos')}
                      </button>
                    </div>
                  </div>

                  {incompatibleSelectedAddons.length ? (
                    <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {t('Há adicionais fora do conjunto deste item. Revise para evitar mistura no preparo.')}
                    </div>
                  ) : null}

                  {showAllAddons && incompatibleVisibleCount > 0 ? (
                    <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {t('{count} adicionais estão bloqueados por escopo para este item.', {
                        count: incompatibleVisibleCount,
                      })}
                    </div>
                  ) : null}

                  {currentItemScope === 'BURGER_BUILD' ? (
                    <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {t('No fluxo de criação de hambúrguer, adicionais do tipo Extra ficam bloqueados por regra de operação.')}
                    </div>
                  ) : null}

                  <div className="mb-3 inline-flex rounded-xl border border-stone-200 bg-stone-100 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveAddonTab('ASSEMBLY')}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeAddonTab === 'ASSEMBLY' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
                    >
                      {t('Montagem')} ({form.assemblyAddonIds.length})
                    </button>
                    {showBreadTab ? (
                      <button
                        type="button"
                        onClick={() => setActiveAddonTab('BREAD')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeAddonTab === 'BREAD' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
                      >
                        {t('Pães')} ({form.breadAddonIds.length})
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setActiveAddonTab('EXTRA')}
                      disabled={currentItemScope === 'BURGER_BUILD'}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeAddonTab === 'EXTRA' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {t('Extras permitidos')} ({form.extraAddonIds.length})
                    </button>
                  </div>

                  <div className="grid max-h-[260px] gap-2 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    {(activeAddonTab === 'ASSEMBLY'
                      ? filteredAssemblyAddons
                      : activeAddonTab === 'BREAD'
                        ? filteredBreadAddons
                        : filteredExtraAddons).map((addon) => {
                        const isChecked =
                          activeAddonTab === 'ASSEMBLY'
                            ? form.assemblyAddonIds.includes(addon.id)
                            : activeAddonTab === 'BREAD'
                              ? form.breadAddonIds.includes(addon.id)
                              : form.extraAddonIds.includes(addon.id);
                        const compatibility = addonCompatibilityById.get(addon.id);
                        const isCompatible = compatibility?.compatible ?? false;
                        const addonScope = compatibility?.scope ?? resolveIngredientMeta(addon).scope;
                        const incompatibilityReason = getAddonIncompatibilityReason(addon, currentItemScope);

                        return (
                          <label
                            key={addon.id}
                            className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${isCompatible || isChecked ? 'bg-white text-stone-700' : 'border border-red-200 bg-red-50 text-red-700'}`}
                          >
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{addon.name}</span>
                              <span className="text-xs text-stone-500">{t(productScopeLabels[addonScope])}</span>
                              {!isCompatible && !isChecked && incompatibilityReason ? (
                                <span className="text-xs text-red-600">{t(incompatibilityReason)}</span>
                              ) : null}
                            </span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddon(addon.id, activeAddonTab)}
                              disabled={!isCompatible && !isChecked}
                              className="h-4 w-4 rounded border-stone-300"
                            />
                          </label>
                        );
                      },
                    )}

                    {activeAddonTab === 'BREAD' && showBreadTab && filteredBreadAddons.length === 0 ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        {t('Nenhum adicional de pão encontrado. Cadastre ingredientes com nome de pão para habilitar seleção.')}
                      </p>
                    ) : null}

                    {activeAddonTab === 'EXTRA' && currentItemScope === 'BURGER_BUILD' ? (
                      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {t('Extras ficam desabilitados para itens de criação de hambúrguer.')}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-stone-200 px-6 py-5">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
                {t('Cancelar')}
              </button>
              <button type="submit" disabled={saving} className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60">
                {saving ? t('Salvando...') : t('Salvar item')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={confirmRemoveItem}
        title={t('Confirmar remoção')}
        description={t('Deseja remover este item permanentemente?')}
        contextLabel={removeTarget ? `${t('Item')}: ${removeTarget.name}` : undefined}
        severity="danger"
        confirmLabel={t('Remover item')}
        loading={removing}
      />
    </div>
  );
}
