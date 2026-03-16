import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmActionDialog } from '@/components/ui/confirm-action-dialog';
import { EmojiPickerField } from '@/components/ui/emoji-picker-field';
import { Input } from '@/components/ui/input';
import { adminService } from '@/features/admin/services/admin.service';
import { categoryErrorRules } from '@/features/admin/utils/api-error-rules';
import { resolveApiErrorMessage } from '@/features/admin/utils/api-error';
import { useCatalogRealtimeRefresh } from '@/hooks/useCatalogRealtimeRefresh';
import type { Category } from '@/features/menu/types/menu.types';
import { useI18n } from '@/i18n';

interface CategoryFormState {
  id?: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: string;
  isActive: boolean;
}

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
  icon: '',
  displayOrder: '0',
  isActive: true,
};

export function CategoriesPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Category | null>(null);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);

  const resolveCategoryApiErrorMessage = useCallback(
    (err: unknown, fallbackMessage: string) =>
      resolveApiErrorMessage(err, fallbackMessage, t, categoryErrorRules),
    [t],
  );

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAdminCategories();
      setCategories(data);
    } catch {
      setError(t('Não foi possível carregar as categorias administrativas.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useCatalogRealtimeRefresh(() => {
    void loadCategories();
  });

  function resetMessages() {
    setError('');
    setSuccess('');
  }

  function openCreate() {
    resetMessages();
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    resetMessages();
    setForm({
      id: category.id,
      name: category.name,
      description: category.description ?? '',
      icon: category.icon ?? '',
      displayOrder: String(category.displayOrder ?? 0),
      isActive: category.isActive,
    });
    setDialogOpen(true);
  }

  function updateField<Key extends keyof CategoryFormState>(
    key: Key,
    value: CategoryFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    resetMessages();

    if (!form.name.trim()) {
      setError(t('Preencha o nome da categoria antes de salvar.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
        displayOrder: Number(form.displayOrder || 0),
        isActive: form.isActive,
      };

      if (form.id) {
        await adminService.updateCategory(form.id, payload);
        setSuccess(t('Categoria atualizada com sucesso.'));
      } else {
        await adminService.createCategory(payload);
        setSuccess(t('Categoria criada com sucesso.'));
      }

      setDialogOpen(false);
      await loadCategories();
    } catch (err) {
      const message = resolveCategoryApiErrorMessage(err, 'Não foi possível salvar a categoria.');
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(category: Category) {
    resetMessages();
    try {
      await adminService.updateCategoryStatus(category.id, !category.isActive);
      setSuccess(
        category.isActive
          ? t('Categoria desativada com sucesso.')
          : t('Categoria ativada com sucesso.'),
      );
      await loadCategories();
    } catch (err) {
      const message = resolveCategoryApiErrorMessage(
        err,
        'Não foi possível atualizar o status da categoria.',
      );
      setError(message);
    }
  }

  async function handleDeleteCategory(category: Category) {
    resetMessages();
    setRemoveTarget(category);
  }

  async function confirmDeleteCategory() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await adminService.deleteCategory(removeTarget.id);
      setSuccess(t('Categoria removida com sucesso.'));
      setRemoveTarget(null);
      await loadCategories();
    } catch (err) {
      const message = resolveCategoryApiErrorMessage(err, 'Não foi possível remover a categoria.');
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
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Gerenciar categorias')}</h1>
          <p className="mt-2 text-sm text-stone-600">{t('Crie e organize categorias que estruturam o cardápio administrativo e do kiosk.')}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <Plus size={16} />
            {t('Nova categoria')}
          </button>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

      <div className="mt-6 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              <tr>
                <th className="px-5 py-4">{t('Categoria')}</th>
                <th className="px-5 py-4">{t('Descrição')}</th>
                <th className="px-5 py-4">{t('Ordem de exibição')}</th>
                <th className="px-5 py-4">{t('Status')}</th>
                <th className="px-5 py-4 text-right">{t('Ações')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">
                    {t('Carregando categorias administrativas...')}
                  </td>
                </tr>
              ) : categories.length ? (
                categories.map((category) => (
                  <tr key={category.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-lg">
                          {category.icon || '📁'}
                        </div>
                        <p className="font-semibold text-stone-900">{category.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{category.description || t('Sem descrição')}</td>
                    <td className="px-5 py-4 font-semibold text-stone-800">{category.displayOrder}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {category.isActive ? t('Ativo') : t('Inativo')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                          aria-label={t('Editar categoria')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(category)}
                          className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                          aria-label={t('Alternar categoria')}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category)}
                          className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={t('Remover categoria')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">
                    {t('Nenhuma categoria cadastrada ainda.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] p-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b border-stone-200 px-6 py-5">
              <DialogTitle>{form.id ? t('Editar categoria') : t('Nova categoria')}</DialogTitle>
              <DialogDescription>{t('Defina nome, descrição e ordem para organizar a navegação de produtos.')}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">{t('Nome')}</label>
                <Input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">{t('Descrição')}</label>
                <textarea
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className="min-h-[110px] w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

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
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Ordem de exibição')}</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.displayOrder}
                    onChange={(event) => updateField('displayOrder', event.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateField('isActive', event.target.checked)}
                  className="h-4 w-4 rounded border-stone-300"
                />
                {t('Categoria ativa')}
              </label>
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
                {saving ? t('Salvando...') : t('Salvar categoria')}
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
        onConfirm={confirmDeleteCategory}
        title={t('Confirmar remoção')}
        description={t('Deseja remover esta categoria permanentemente?')}
        contextLabel={removeTarget ? `${t('Categoria')}: ${removeTarget.name}` : undefined}
        severity="danger"
        confirmLabel={t('Remover categoria')}
        loading={removing}
      />
    </div>
  );
}
