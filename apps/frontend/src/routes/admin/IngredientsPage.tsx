import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Power, RefreshCcw, Trash2 } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { adminService } from '@/features/admin/services/admin.service';
import { ingredientErrorRules } from '@/features/admin/utils/api-error-rules';
import { resolveApiErrorMessage } from '@/features/admin/utils/api-error';
import type { Addon } from '@/features/menu/types/menu.types';
import {
  buildIngredientDescription,
  defaultIngredientMeta,
  resolveIngredientMeta,
  stripIngredientMeta,
  type IngredientPriority,
  type KitchenStation,
  type ProductScope,
} from '@/features/menu/utils/ingredient-meta';
import { useI18n } from '@/i18n';

interface IngredientFormState {
  id?: string;
  name: string;
  addonType: Addon['addonType'];
  price: string;
  description: string;
  isActive: boolean;
  station: KitchenStation;
  scope: ProductScope;
  priority: IngredientPriority;
}

interface IngredientPreset {
  name: string;
  addonType: Addon['addonType'];
  price: string;
  description: string;
  station: KitchenStation;
  scope: ProductScope;
  priority: IngredientPriority;
}

const emptyForm: IngredientFormState = {
  name: '',
  addonType: 'EXTRA',
  price: '0',
  description: '',
  isActive: true,
  station: defaultIngredientMeta().station,
  scope: defaultIngredientMeta().scope,
  priority: defaultIngredientMeta().priority,
};

const addonTypeLabels: Record<Addon['addonType'], string> = {
  EXTRA: 'Extra',
  SUBSTITUTION: 'Substituição',
  REMOVAL: 'Ajuste de montagem',
  SIZE_CHANGE: 'Variação de tamanho',
};

const kitchenStationLabels: Record<KitchenStation, string> = {
  PROTEINS: 'Estação proteínas',
  CHEESES: 'Estação queijos',
  VEGETABLES: 'Estação vegetais',
  SAUCES: 'Estação molhos',
  DRINKS: 'Estação bebidas',
  SIDES: 'Estação acompanhamentos',
  FINISHING: 'Estação finalização',
  GENERAL: 'Estação geral',
};

const productScopeLabels: Record<ProductScope, string> = {
  BURGER: 'Conjunto hambúrguer',
  BURGER_BUILD: 'Conjunto criação hambúrguer',
  DRINK: 'Conjunto bebida',
  SIDE: 'Conjunto acompanhamento',
  COMBO: 'Conjunto combo',
  GENERAL: 'Conjunto geral',
};

const priorityLabels: Record<IngredientPriority, string> = {
  FAST: 'Rápido',
  MEDIUM: 'Médio',
  CRITICAL: 'Crítico',
};

const stationOrder: KitchenStation[] = [
  'PROTEINS',
  'CHEESES',
  'VEGETABLES',
  'SAUCES',
  'DRINKS',
  'SIDES',
  'FINISHING',
  'GENERAL',
];

const ingredientPresets: IngredientPreset[] = [
  {
    name: 'Carne extra',
    addonType: 'EXTRA',
    price: '6.00',
    description: 'Adiciona um disco de carne na montagem.',
    station: 'PROTEINS',
    scope: 'BURGER',
    priority: 'MEDIUM',
  },
  {
    name: 'Queijo extra',
    addonType: 'EXTRA',
    price: '3.00',
    description: 'Adiciona uma fatia extra de queijo.',
    station: 'CHEESES',
    scope: 'BURGER',
    priority: 'MEDIUM',
  },
  {
    name: 'Bacon extra',
    addonType: 'EXTRA',
    price: '4.00',
    description: 'Adiciona bacon crocante ao lanche.',
    station: 'PROTEINS',
    scope: 'BURGER',
    priority: 'MEDIUM',
  },
  {
    name: 'Trocar pão tradicional por pão brioche',
    addonType: 'SUBSTITUTION',
    price: '0',
    description: 'Substituição de base sem custo adicional.',
    station: 'GENERAL',
    scope: 'BURGER_BUILD',
    priority: 'CRITICAL',
  },
  {
    name: 'Trocar refrigerante por suco',
    addonType: 'SUBSTITUTION',
    price: '1.50',
    description: 'Substituição com ajuste de valor.',
    station: 'DRINKS',
    scope: 'DRINK',
    priority: 'CRITICAL',
  },
  {
    name: 'Sem cebola',
    addonType: 'REMOVAL',
    price: '0',
    description: 'Remoção de ingrediente da montagem padrão.',
    station: 'FINISHING',
    scope: 'BURGER',
    priority: 'FAST',
  },
  {
    name: 'Sem picles',
    addonType: 'REMOVAL',
    price: '0',
    description: 'Remoção de ingrediente da montagem padrão.',
    station: 'FINISHING',
    scope: 'BURGER',
    priority: 'FAST',
  },
  {
    name: 'Aumentar bebida para tamanho M',
    addonType: 'SIZE_CHANGE',
    price: '2.00',
    description: 'Ajusta bebida para tamanho maior dentro da linha.',
    station: 'DRINKS',
    scope: 'DRINK',
    priority: 'CRITICAL',
  },
  {
    name: 'Aumentar batata para tamanho G',
    addonType: 'SIZE_CHANGE',
    price: '3.00',
    description: 'Ajusta batata para tamanho maior dentro da linha.',
    station: 'SIDES',
    scope: 'SIDE',
    priority: 'CRITICAL',
  },
  {
    name: 'Diminuir batata para tamanho P',
    addonType: 'SIZE_CHANGE',
    price: '0',
    description: 'Ajusta batata para tamanho menor sem desconto automático.',
    station: 'SIDES',
    scope: 'SIDE',
    priority: 'FAST',
  },
];

function priorityOrder(priority: IngredientPriority): number {
  if (priority === 'CRITICAL') return 0;
  if (priority === 'MEDIUM') return 1;
  return 2;
}

function isAddonTypeAllowedForScope(type: Addon['addonType'], scope: ProductScope): boolean {
  if (scope === 'BURGER_BUILD' && type === 'EXTRA') return false;
  if (type === 'SIZE_CHANGE') return scope === 'DRINK' || scope === 'SIDE' || scope === 'COMBO';
  return true;
}

export function IngredientsPage() {
  const { t, language } = useI18n();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | Addon['addonType']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stationFilter, setStationFilter] = useState<'ALL' | KitchenStation>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | ProductScope>('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Addon | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<IngredientFormState>(emptyForm);

  const resolveIngredientApiErrorMessage = useCallback(
    (err: unknown, fallbackMessage: string) =>
      resolveApiErrorMessage(err, fallbackMessage, t, ingredientErrorRules),
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

  const filteredAddons = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return addons.filter((addon) => {
      const cleanDescription = stripIngredientMeta(addon.description ?? '');
      const matchesSearch =
        !searchTerm ||
        addon.name.toLowerCase().includes(searchTerm) ||
        cleanDescription.toLowerCase().includes(searchTerm);

      const matchesType = typeFilter === 'ALL' || addon.addonType === typeFilter;

      const isActive = addon.isActive ?? true;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'INACTIVE' && !isActive);

      const meta = resolveIngredientMeta(addon);
      const matchesStation = stationFilter === 'ALL' || stationFilter === meta.station;
      const matchesScope = scopeFilter === 'ALL' || scopeFilter === meta.scope;

      return matchesSearch && matchesType && matchesStatus && matchesStation && matchesScope;
    });
  }, [addons, scopeFilter, search, stationFilter, statusFilter, typeFilter]);

  const sortedFilteredAddons = useMemo(() => {
    return [...filteredAddons].sort((a, b) => {
      const aMeta = resolveIngredientMeta(a);
      const bMeta = resolveIngredientMeta(b);

      const stationDelta = stationOrder.indexOf(aMeta.station) - stationOrder.indexOf(bMeta.station);
      if (stationDelta !== 0) return stationDelta;

      const priorityDelta = priorityOrder(aMeta.priority) - priorityOrder(bMeta.priority);
      if (priorityDelta !== 0) return priorityDelta;

      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [filteredAddons]);

  const stationSummary = useMemo(() => {
    const summary = addons.reduce<Record<KitchenStation, number>>(
      (acc, addon) => {
        const station = resolveIngredientMeta(addon).station;
        acc[station] += 1;
        return acc;
      },
      {
        PROTEINS: 0,
        CHEESES: 0,
        VEGETABLES: 0,
        SAUCES: 0,
        DRINKS: 0,
        SIDES: 0,
        FINISHING: 0,
        GENERAL: 0,
      },
    );

    return Object.entries(summary)
      .filter(([, count]) => count > 0)
      .map(([station, count]) => ({ station: station as KitchenStation, count }))
      .sort((a, b) => stationOrder.indexOf(a.station) - stationOrder.indexOf(b.station) || b.count - a.count);
  }, [addons]);

  const scopeSummary = useMemo(() => {
    const summary = addons.reduce<Record<ProductScope, number>>(
      (acc, addon) => {
        const scope = resolveIngredientMeta(addon).scope;
        acc[scope] += 1;
        return acc;
      },
      {
        BURGER: 0,
        BURGER_BUILD: 0,
        DRINK: 0,
        SIDE: 0,
        COMBO: 0,
        GENERAL: 0,
      },
    );

    return Object.entries(summary)
      .filter(([, count]) => count > 0)
      .map(([scope, count]) => ({ scope: scope as ProductScope, count }))
      .sort((a, b) => b.count - a.count);
  }, [addons]);

  const loadAddons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdminAddons();
      setAddons(data);
    } catch {
      setError(t('Não foi possível carregar os ingredientes administrativos.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAddons();
  }, [loadAddons]);

  function resetMessages() {
    setError('');
    setSuccess('');
  }

  function updateField<Key extends keyof IngredientFormState>(
    key: Key,
    value: IngredientFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    resetMessages();
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(addon: Addon) {
    resetMessages();
    const meta = resolveIngredientMeta(addon);
    setForm({
      id: addon.id,
      name: addon.name,
      addonType: addon.addonType,
      price: String(addon.price),
      description: stripIngredientMeta(addon.description ?? ''),
      isActive: addon.isActive ?? true,
      station: meta.station,
      scope: meta.scope,
      priority: meta.priority,
    });
    setDialogOpen(true);
  }

  function handleAddonTypeChange(value: Addon['addonType']) {
    if (!isAddonTypeAllowedForScope(value, form.scope)) {
        setError(
          value === 'SIZE_CHANGE'
            ? t('Variação de tamanho só pode ser usada em bebida, acompanhamento ou combo.')
            : t('No conjunto criação hambúrguer, o tipo Extra não é permitido para ingrediente.'),
        );
      return;
    }

    setForm((current) => ({
      ...current,
      addonType: value,
      price: value === 'REMOVAL' ? '0' : current.price,
    }));
  }

  function handleScopeChange(scope: ProductScope) {
    setForm((current) => {
      if (!isAddonTypeAllowedForScope(current.addonType, scope)) {
        const nextAddonType: Addon['addonType'] = scope === 'BURGER_BUILD' ? 'SUBSTITUTION' : 'SIZE_CHANGE';
        setError(
          current.addonType === 'EXTRA'
            ? t('No conjunto criação hambúrguer, o tipo Extra não é permitido para ingrediente.')
            : t('Variação de tamanho só pode ser usada em bebida, acompanhamento ou combo.'),
        );
        return {
          ...current,
          scope,
          addonType: nextAddonType,
        };
      }

      return {
        ...current,
        scope,
      };
    });
  }

  function applyPreset(preset: IngredientPreset) {
    setForm((current) => ({
      ...current,
      name: preset.name,
      addonType: preset.addonType,
      price: preset.price,
      description: preset.description,
      station: preset.station,
      scope: preset.scope,
      priority: preset.priority,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    resetMessages();

    if (!form.name.trim() || Number(form.price) < 0) {
      setError(t('Preencha nome e preço válido antes de salvar o ingrediente.'));
      return;
    }

    if (!isAddonTypeAllowedForScope(form.addonType, form.scope)) {
      setError(
        form.addonType === 'SIZE_CHANGE'
          ? t('Variação de tamanho só pode ser usada em bebida, acompanhamento ou combo.')
          : t('No conjunto criação hambúrguer, o tipo Extra não é permitido para ingrediente.'),
      );
      return;
    }

    setSaving(true);
    try {
      const normalizedPrice = form.addonType === 'REMOVAL' ? 0 : Number(form.price);
      const payload = {
        name: form.name.trim(),
        addonType: form.addonType,
        price: normalizedPrice,
        description: buildIngredientDescription(form.description, {
          station: form.station,
          scope: form.scope,
          priority: form.priority,
        }),
        isActive: form.isActive,
      };

      if (form.id) {
        await adminService.updateAddon(form.id, payload);
        setSuccess(t('Ingrediente atualizado com sucesso.'));
      } else {
        await adminService.createAddon(payload);
        setSuccess(t('Ingrediente criado com sucesso.'));
      }

      setDialogOpen(false);
      await loadAddons();
    } catch (err) {
      const message = resolveIngredientApiErrorMessage(err, 'Não foi possível salvar o ingrediente.');
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(addon: Addon) {
    resetMessages();
    try {
      await adminService.updateAddonStatus(addon.id, !(addon.isActive ?? true));
      setSuccess(
        addon.isActive ?? true
          ? t('Ingrediente desativado com sucesso.')
          : t('Ingrediente ativado com sucesso.'),
      );
      await loadAddons();
    } catch (err) {
      const message = resolveIngredientApiErrorMessage(
        err,
        'Não foi possível atualizar o status do ingrediente.',
      );
      setError(message);
    }
  }

  function handleDeleteAddon(addon: Addon) {
    resetMessages();
    setRemoveTarget(addon);
  }

  async function confirmDeleteAddon() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await adminService.deleteAddon(removeTarget.id);
      setSuccess(t('Ingrediente removido com sucesso.'));
      setRemoveTarget(null);
      await loadAddons();
    } catch (err) {
      const message = resolveIngredientApiErrorMessage(
        err,
        'Não foi possível remover o ingrediente.',
      );
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
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Gerenciar ingredientes')}</h1>
          <p className="mt-2 text-sm text-stone-600">
            {t('Cadastre extras, substituições e remoções para montagem flexível de hambúrgueres e combos.')}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => loadAddons()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            <RefreshCcw size={16} />
            {t('Atualizar')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <Plus size={16} />
            {t('Novo ingrediente')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {stationSummary.length ? (
        <div className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-stone-900">{t('Organização por estação')}</h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              {t('{count} itens', { count: addons.length })}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stationSummary.map((entry) => (
              <div key={entry.station} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  {t(kitchenStationLabels[entry.station])}
                </p>
                <p className="mt-1 text-sm font-bold text-stone-900">{entry.count}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {scopeSummary.length ? (
        <div className="mt-4 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-stone-900">{t('Conjuntos por produto')}</h2>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              {t('{count} tipos', { count: scopeSummary.length })}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {scopeSummary.map((entry) => (
              <div key={entry.scope} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  {t(productScopeLabels[entry.scope])}
                </p>
                <p className="mt-1 text-sm font-bold text-stone-900">{entry.count}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {stationSummary.length ? (
        <div className="mt-4 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-stone-900">{t('Fluxo sugerido de produção')}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {t('Siga a sequência por estação para reduzir erros de montagem no pico.')}
          </p>

          <div className="mt-3 grid gap-2">
            {stationSummary.map((entry, index) => (
              <div key={entry.station} className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-stone-800">{t(kitchenStationLabels[entry.station])}</span>
                </div>
                <span className="text-xs font-semibold text-stone-600">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="grid gap-3 sm:grid-cols-5">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Buscar ingrediente...')}
            />

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'ALL' | Addon['addonType'])}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">{t('Todos os tipos')}</option>
              <option value="EXTRA">{t('Extra')}</option>
              <option value="SUBSTITUTION">{t('Substituição')}</option>
              <option value="REMOVAL">{t('Ajuste de montagem')}</option>
              <option value="SIZE_CHANGE">{t('Variação de tamanho')}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">{t('Todos os status')}</option>
              <option value="ACTIVE">{t('Somente ativos')}</option>
              <option value="INACTIVE">{t('Somente inativos')}</option>
            </select>

            <select
              value={stationFilter}
              onChange={(event) => setStationFilter(event.target.value as 'ALL' | KitchenStation)}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">{t('Todas as estações')}</option>
              {Object.entries(kitchenStationLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {t(label)}
                </option>
              ))}
            </select>

            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value as 'ALL' | ProductScope)}
              className="h-10 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">{t('Todos os conjuntos')}</option>
              {Object.entries(productScopeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {t(label)}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            {t('Exibindo {shown} de {total} ingredientes.', {
              shown: sortedFilteredAddons.length,
              total: addons.length,
            })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-5 py-4">{t('Ingrediente')}</th>
                <th className="px-5 py-4">{t('Tipo')}</th>
                <th className="px-5 py-4">{t('Estação')}</th>
                <th className="px-5 py-4">{t('Conjunto')}</th>
                <th className="px-5 py-4">{t('Prioridade')}</th>
                <th className="px-5 py-4">{t('Preço')}</th>
                <th className="px-5 py-4">{t('Status')}</th>
                <th className="px-5 py-4 text-right">{t('Ações')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-stone-500">
                    {t('Carregando ingredientes administrativos...')}
                  </td>
                </tr>
              ) : sortedFilteredAddons.length ? (
                sortedFilteredAddons.map((addon) => {
                  const meta = resolveIngredientMeta(addon);
                  return (
                    <tr key={addon.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-900">{addon.name}</p>
                        <p className="mt-1 text-xs text-stone-500">{stripIngredientMeta(addon.description ?? '') || t('Sem descrição')}</p>
                      </td>
                      <td className="px-5 py-4 text-stone-700">{t(addonTypeLabels[addon.addonType])}</td>
                      <td className="px-5 py-4 text-stone-700">{t(kitchenStationLabels[meta.station])}</td>
                      <td className="px-5 py-4 text-stone-700">{t(productScopeLabels[meta.scope])}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : meta.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                          {t(priorityLabels[meta.priority])}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-800">{currency.format(addon.price)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${(addon.isActive ?? true) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {(addon.isActive ?? true) ? t('Ativo') : t('Inativo')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(addon)}
                            className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                            aria-label={t('Editar ingrediente')}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(addon)}
                            className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                            aria-label={t('Alternar ingrediente')}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddon(addon)}
                            className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={t('Remover ingrediente')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-stone-500">
                    {addons.length
                      ? t('Nenhum ingrediente encontrado para o filtro atual.')
                      : t('Nenhum ingrediente cadastrado ainda.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-[2rem] p-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b border-stone-200 px-6 py-5">
              <DialogTitle>{form.id ? t('Editar ingrediente') : t('Novo ingrediente')}</DialogTitle>
              <DialogDescription>
                {t('Defina tipo, preço e disponibilidade para controlar a personalização dos pedidos.')}
              </DialogDescription>
            </DialogHeader>

            {!form.id ? (
              <div className="mx-6 mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-2 text-sm font-semibold text-stone-700">{t('Sugestões rápidas da cozinha')}</p>
                <div className="flex flex-wrap gap-2">
                  {ingredientPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Nome')}</label>
                  <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Descrição')}</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    className="min-h-[120px] w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Estação')}</label>
                    <select
                      value={form.station}
                      onChange={(event) => updateField('station', event.target.value as KitchenStation)}
                      className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(kitchenStationLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Conjunto')}</label>
                    <select
                      value={form.scope}
                      onChange={(event) => handleScopeChange(event.target.value as ProductScope)}
                      className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(productScopeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Prioridade')}</label>
                    <select
                      value={form.priority}
                      onChange={(event) => updateField('priority', event.target.value as IngredientPriority)}
                      className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {Object.entries(priorityLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {t(label)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Tipo')}</label>
                  <select
                    value={form.addonType}
                    onChange={(event) => handleAddonTypeChange(event.target.value as Addon['addonType'])}
                    className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="EXTRA" disabled={form.scope === 'BURGER_BUILD'}>{t('Extra')}</option>
                    <option value="SUBSTITUTION">{t('Substituição')}</option>
                    <option value="REMOVAL">{t('Ajuste de montagem')}</option>
                    <option value="SIZE_CHANGE" disabled={form.scope !== 'DRINK' && form.scope !== 'SIDE' && form.scope !== 'COMBO'}>
                      {t('Variação de tamanho')}
                    </option>
                  </select>
                  <p className="mt-1 text-xs text-stone-500">
                    {form.addonType === 'EXTRA'
                      ? t('Extra aumenta o preço final do item.')
                      : form.addonType === 'SUBSTITUTION'
                        ? t('Substituição pode manter preço zero ou ajustar valor.')
                        : form.addonType === 'SIZE_CHANGE'
                          ? t('Variação de tamanho permite aumento ou diminuição para bebidas e acompanhamentos.')
                          : t('Ajuste de montagem deve manter valor zero.')}
                  </p>
                  {form.scope === 'BURGER_BUILD' ? (
                    <p className="mt-1 text-xs text-red-600">
                      {t('No conjunto criação hambúrguer, o tipo Extra não é permitido para ingrediente.')}
                    </p>
                  ) : null}
                  {form.addonType === 'SIZE_CHANGE' && form.scope !== 'DRINK' && form.scope !== 'SIDE' && form.scope !== 'COMBO' ? (
                    <p className="mt-1 text-xs text-red-600">
                      {t('Variação de tamanho só pode ser usada em bebida, acompanhamento ou combo.')}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Preço')}</label>
                  <CurrencyInput value={form.price} onChange={(value) => updateField('price', value)} placeholder="0,00" />
                  {form.addonType === 'REMOVAL' ? (
                    <p className="mt-1 text-xs text-stone-500">{t('Para ajuste de montagem, mantenha R$ 0,00.')}</p>
                  ) : null}
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => updateField('isActive', event.target.checked)}
                    className="h-4 w-4 rounded border-stone-300"
                  />
                  {t('Ingrediente ativo')}
                </label>
              </div>
            </div>

            <DialogFooter className="border-t border-stone-200 px-6 py-5">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                {t('Cancelar')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
              >
                {saving ? t('Salvando...') : t('Salvar ingrediente')}
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
        onConfirm={confirmDeleteAddon}
        title={t('Confirmar remoção')}
        description={t('Deseja remover este ingrediente permanentemente?')}
        contextLabel={removeTarget ? `${t('Ingrediente')}: ${removeTarget.name}` : undefined}
        severity="danger"
        confirmLabel={t('Remover ingrediente')}
        loading={removing}
      />
    </div>
  );
}
