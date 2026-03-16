import { useCallback, useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { adminService } from '@/features/admin/services/admin.service';
import type { AdminUser } from '@/features/admin/types/admin.types';
import { userErrorRules } from '@/features/admin/utils/api-error-rules';
import { resolveApiErrorMessage } from '@/features/admin/utils/api-error';
import { useI18n } from '@/i18n';

interface UserFormState {
  id?: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  name: string;
  isActive: boolean;
}

const emptyForm: UserFormState = {
  email: '',
  password: '',
  role: 'STAFF',
  name: '',
  isActive: true,
};

export function UsersPage() {
  const { t, language } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [removing, setRemoving] = useState(false);

  const resolveUserApiErrorMessage = useCallback(
    (err: unknown, fallbackMessage: string) =>
      resolveApiErrorMessage(err, fallbackMessage, t, userErrorRules),
    [t],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await adminService.getUsers());
    } catch {
      setError(t('Não foi possível carregar os usuários internos.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openCreate() {
    setForm(emptyForm);
    setDialogOpen(true);
    setError('');
    setSuccess('');
  }

  function openEdit(user: AdminUser) {
    setForm({
      id: user.id,
      email: user.email,
      password: '',
      role: user.role,
      name: user.name ?? '',
      isActive: user.isActive,
    });
    setDialogOpen(true);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email.trim() || (!form.id && form.password.trim().length < 6)) {
      setError(t('Informe email válido e senha com pelo menos 6 caracteres para novos usuários.'));
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await adminService.updateUser(form.id, {
          email: form.email.trim(),
          password: form.password.trim() || undefined,
          role: form.role,
          name: form.name.trim() || undefined,
          isActive: form.isActive,
        });
        setSuccess(t('Usuário atualizado com sucesso.'));
      } else {
        await adminService.createUser({
          email: form.email.trim(),
          password: form.password.trim(),
          role: form.role,
          name: form.name.trim() || undefined,
          isActive: form.isActive,
        });
        setSuccess(t('Usuário criado com sucesso.'));
      }

      setDialogOpen(false);
      await loadUsers();
    } catch (err) {
      setError(resolveUserApiErrorMessage(err, 'Não foi possível salvar o usuário.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(user: AdminUser) {
    setError('');
    setSuccess('');
    try {
      await adminService.updateUserStatus(user.id, !user.isActive);
      setSuccess(user.isActive ? t('Usuário desativado com sucesso.') : t('Usuário reativado com sucesso.'));
      await loadUsers();
    } catch (err) {
      setError(resolveUserApiErrorMessage(err, 'Não foi possível atualizar o status do usuário.'));
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    setError('');
    setSuccess('');
    setRemoveTarget(user);
  }

  async function confirmDeleteUser() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await adminService.deleteUser(removeTarget.id);
      setSuccess(t('Conta removida com sucesso.'));
      setRemoveTarget(null);
      await loadUsers();
    } catch (err) {
      const message = resolveUserApiErrorMessage(err, 'Não foi possível remover a conta.');
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
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Gerenciar equipe')}</h1>
          <p className="mt-2 text-sm text-stone-600">{t('Crie acessos internos, ajuste perfis e mantenha a operação segura.')}</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={loadUsers} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">
            <RefreshCcw size={16} />
            {t('Atualizar')}
          </button>
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">
            <Plus size={16} />
            {t('Novo usuário')}
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
                <th className="px-5 py-4">{t('Usuário')}</th>
                <th className="px-5 py-4">{t('Perfil')}</th>
                <th className="px-5 py-4">{t('Último acesso')}</th>
                <th className="px-5 py-4">{t('Status')}</th>
                <th className="px-5 py-4 text-right">{t('Ações')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">{t('Carregando usuários...')}</td>
                </tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-900">{user.name || t('Sem nome cadastrado')}</p>
                      <p className="text-xs text-stone-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-4 text-stone-600">{user.role === 'ADMIN' ? t('Administrador') : t('Atendente')}</td>
                    <td className="px-5 py-4 text-stone-600">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')
                        : t('Nunca acessou')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-700'}`}>
                        {user.isActive ? t('Ativo') : t('Inativo')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(user)} className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900" aria-label={t('Editar usuário')}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => handleToggleStatus(user)} className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100">
                          {user.isActive ? t('Desativar') : t('Reativar')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={t('Remover conta')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">{t('Nenhum usuário interno cadastrado ainda.')}</td>
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
              <DialogTitle>{form.id ? t('Editar usuário') : t('Novo usuário')}</DialogTitle>
              <DialogDescription>{t('Defina perfil, status e credenciais para acesso interno ao sistema.')}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Nome')}</label>
                  <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Email')}</label>
                  <Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Senha')}</label>
                  <Input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={form.id ? t('Preencha apenas se quiser alterar') : '••••••'} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t('Perfil')}</label>
                  <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as 'ADMIN' | 'STAFF' }))} className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="STAFF">{t('Atendente')}</option>
                    <option value="ADMIN">{t('Administrador')}</option>
                  </select>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-stone-300" />
                  {t('Usuário ativo')}
                </label>
              </div>
            </div>

            <DialogFooter className="border-t border-stone-200 px-6 py-5">
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100">{t('Cancelar')}</button>
              <button type="submit" disabled={saving} className="rounded-2xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60">{saving ? t('Salvando...') : t('Salvar usuário')}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        onConfirm={confirmDeleteUser}
        title={t('Confirmar remoção')}
        description={t('Deseja remover esta conta permanentemente?')}
        contextLabel={removeTarget ? `${t('Usuário')}: ${removeTarget.name ?? removeTarget.email}` : undefined}
        severity="warning"
        confirmLabel={t('Remover conta')}
        loading={removing}
      />
    </div>
  );
}
