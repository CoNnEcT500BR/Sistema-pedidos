import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react';

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
import { comboErrorRules } from '@/features/admin/utils/api-error-rules';
import { resolveApiErrorMessage } from '@/features/admin/utils/api-error';
import type { Combo, MenuItem } from '@/features/menu/types/menu.types';
import { useI18n } from '@/i18n';

interface ComboFormState {
  id?: string;
  name: string;
  description: string;
  price: string;
  icon: string;
  displayOrder: string;
  comboItems: Array<{ menuItemId: string; quantity: string }>;
}

const emptyComboForm: ComboFormState = {
  name: '',
  description: '',
  price: '',
  icon: '',
  displayOrder: '0',
  comboItems: [{ menuItemId: '', quantity: '1' }],
};

export function CombosPage() {
  const { t, language } = useI18n();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ComboFormState>(emptyComboForm);
  const [pageError, setPageError] = useState('');
  const [modalError, setModalError] = useState('');
  const [success, setSuccess] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Combo | null>(null);
  const [removing, setRemoving] = useState(false);

  const resolveComboApiErrorMessage = useCallback(
    (err: unknown, fallbackMessage: string) =>
      resolveApiErrorMessage(err, fallbackMessage, t, comboErrorRules),
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [nextCombos, nextMenuItems] = await Promise.all([
        adminService.getAdminCombos(),
        adminService.getAdminMenuItems(),
      ]);
      setCombos(nextCombos);
      setMenuItems(nextMenuItems.filter((item) => item.isAvailable));
    } catch {
      setPageError(t('Não foi possível carregar os combos administrativos.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreate() {
    setForm({
      ...emptyComboForm,
      comboItems: [{ menuItemId: menuItems[0]?.id ?? '', quantity: '1' }],
    });
    setDialogOpen(true);
    setModalError('');
    setSuccess('');
  }

  function openEdit(combo: Combo) {
    setForm({
      id: combo.id,
      name: combo.name,
      description: combo.description ?? '',
      price: String(combo.price),
      icon: combo.icon ?? '',
      displayOrder: String(combo.displayOrder ?? 0),
      comboItems:
        combo.comboItems?.map((item) => ({ menuItemId: item.menuItemId, quantity: String(item.quantity) })) ??
        [{ menuItemId: menuItems[0]?.id ?? '', quantity: '1' }],
    });
    setDialogOpen(true);
    setModalError('');
    setSuccess('');
  }

  function updateComboItem(index: number, key: 'menuItemId' | 'quantity', value: string) {
    setForm((current) => ({
      ...current,
      comboItems: current.comboItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addComboItemRow() {
    setForm((current) => ({
      ...current,
      comboItems: [...current.comboItems, { menuItemId: menuItems[0]?.id ?? '', quantity: '1' }],
    }));
  }

  function removeComboItemRow(index: number) {
    setForm((current) => ({
      ...current,
      comboItems: current.comboItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setModalError('');
    setSuccess('');

    const comboItems = form.comboItems
      .filter((item) => item.menuItemId)
      .map((item) => ({ menuItemId: item.menuItemId, quantity: Number(item.quantity) || 1 }));

    const hasDuplicatedItems =
      new Set(comboItems.map((item) => item.menuItemId)).size !== comboItems.length;

    if (!form.name.trim() || Number(form.price) <= 0 || comboItems.length === 0) {
      setModalError(t('Preencha nome, preço e ao menos um item incluso.'));
      return;
    }

    if (hasDuplicatedItems) {
      setModalError(t('Não repita o mesmo item dentro do combo. Ajuste as quantidades na mesma linha.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        icon: form.icon.trim() || undefined,
        displayOrder: Number(form.displayOrder || 0),
        comboItems,
      };

      if (form.id) {
        await adminService.updateCombo(form.id, payload);
        setSuccess(t('Combo atualizado com sucesso.'));
      } else {
        await adminService.createCombo(payload);
        setSuccess(t('Combo criado com sucesso.'));
      }

      setDialogOpen(false);
      await loadData();
    } catch (err) {
      const message = resolveComboApiErrorMessage(err, 'Não foi possível salvar o combo.');
      setModalError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailability(combo: Combo) {
    setPageError('');
    setSuccess('');
    try {
      await adminService.updateComboAvailability(combo.id, !combo.isActive);
      setSuccess(combo.isActive ? t('Combo marcado como inativo.') : t('Combo reativado com sucesso.'));
      await loadData();
    } catch (err) {
      const message = resolveComboApiErrorMessage(
        err,
        'Não foi possível atualizar o status do combo.',
      );
      setPageError(message);
    }
  }

  async function handleDeleteCombo(combo: Combo) {
    setPageError('');
    setSuccess('');
    setRemoveTarget(combo);
  }

  async function confirmDeleteCombo() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await adminService.deleteCombo(removeTarget.id);
      setSuccess(t('Combo removido com sucesso.'));
      setRemoveTarget(null);
      await loadData();
    } catch (err) {
      const message = resolveComboApiErrorMessage(err, 'Não foi possível remover o combo.');
      setPageError(message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Gerenciar combos')}</h1>
          <p className="mt-2 text-sm text-stone-600">{t('Monte combos com itens inclusos e ajuste a disponibilidade quando a operação pedir.')}</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={loadData} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
            <RefreshCcw size={16} />
            {t('Atualizar')}
          </button>
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">
            <Plus size={16} />
            {t('Novo combo')}
          </button>
        </div>
      </div>

      {pageError ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div> : null}
      {success ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {loading ? (
          <div className="rounded-[2rem] border border-stone-200 bg-white px-5 py-8 text-center text-sm text-stone-500 shadow-sm">{t('Carregando combos administrativos...')}</div>
        ) : combos.length ? (
          combos.map((combo) => (
            <div key={combo.id} className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-stone-900">{combo.name}</p>
                  <p className="mt-1 text-sm text-stone-500">{combo.description || t('Sem descrição')}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${combo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-700'}`}>
                  {combo.isActive ? t('Ativo') : t('Inativo')}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xl font-black text-stone-900">{currency.format(combo.price)}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(combo)} className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900" aria-label={t('Editar combo')}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => handleAvailability(combo)} className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100">
                    {combo.isActive ? t('Desativar') : t('Reativar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCombo(combo)}
                    className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={t('Remover combo')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-stone-50 p-4">
                {(combo.comboItems ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm text-stone-700">
                    <span>{item.menuItem?.name ?? t('Item removido')}</span>
                    <strong>x{item.quantity}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[2rem] border border-stone-200 bg-white px-5 py-8 text-center text-sm text-stone-500 shadow-sm">{t('Nenhum combo cadastrado ainda.')}</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-[2rem] p-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b border-stone-200 px-6 py-5">
              <DialogTitle>{form.id ? t('Editar combo') : t('Novo combo')}</DialogTitle>
              <DialogDescription>{t('Defina preço, descrição e itens inclusos para o combo aparecer corretamente no kiosk.')}</DialogDescription>
            </DialogHeader>

            {modalError ? (
              <div className="mx-6 mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {modalError}
              </div>
            ) : null}

            <div className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Nome')}</label>
                  <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Descrição')}</label>
                  <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-[140px] w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="min-w-0 sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Preço')}</label>
                    <CurrencyInput
                      value={form.price}
                      onChange={(value) => setForm((current) => ({ ...current, price: value }))}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t('Ícone')}</label>
                    <EmojiPickerField
                      value={form.icon}
                      onChange={(value) => setForm((current) => ({ ...current, icon: value }))}
                      buttonLabel={t('Selecionar emoji')}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Ordem de exibição')}</label>
                  <Input type="number" min="0" step="1" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-stone-700">{t('Itens inclusos')}</p>
                    <button type="button" onClick={addComboItemRow} className="text-sm font-semibold text-stone-700 transition hover:text-stone-900">{t('Adicionar linha')}</button>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    {form.comboItems.map((item, index) => (
                      <div key={`${item.menuItemId}-${index}`} className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
                        <select value={item.menuItemId} onChange={(event) => updateComboItem(index, 'menuItemId', event.target.value)} className="h-10 min-w-0 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                          {menuItems.map((menuItem) => (
                            <option key={menuItem.id} value={menuItem.id}>
                              {menuItem.name}
                            </option>
                          ))}
                        </select>
                        <div className="min-w-0">
                          <Input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateComboItem(index, 'quantity', event.target.value)} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeComboItemRow(index)}
                          disabled={form.comboItems.length === 1}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label={t('Remover item da linha')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-stone-200 px-6 py-5">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
                {t('Cancelar')}
              </button>
              <button type="submit" disabled={saving} className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60">
                {saving ? t('Salvando...') : t('Salvar combo')}
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
        onConfirm={confirmDeleteCombo}
        title={t('Confirmar remoção')}
        description={t('Deseja remover este combo permanentemente?')}
        contextLabel={removeTarget ? `${t('Combo')}: ${removeTarget.name}` : undefined}
        severity="danger"
        confirmLabel={t('Remover combo')}
        loading={removing}
      />
    </div>
  );
}
