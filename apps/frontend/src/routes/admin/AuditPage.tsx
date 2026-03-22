import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { adminService } from '@/features/admin/services/admin.service';
import type { AdminAuditLog, AdminAuditSortOrder } from '@/features/admin/types/admin.types';
import { useI18n } from '@/i18n';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_SORT: AdminAuditSortOrder = 'newest';

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseSort(value: string | null): AdminAuditSortOrder {
  return value === 'oldest' ? 'oldest' : 'newest';
}

function parseDateOnly(value: string | null): string {
  if (!value) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

export function AuditPage() {
  const { t, language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(() => parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE));
  const [pageSize, setPageSize] = useState(() =>
    parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
  );
  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [entity, setEntity] = useState(() => searchParams.get('entity') ?? '');
  const [action, setAction] = useState(() => searchParams.get('action') ?? '');
  const [actorEmail, setActorEmail] = useState(() => searchParams.get('actorEmail') ?? '');
  const [startDate, setStartDate] = useState(() => parseDateOnly(searchParams.get('startDate')));
  const [endDate, setEndDate] = useState(() => parseDateOnly(searchParams.get('endDate')));
  const [sort, setSort] = useState<AdminAuditSortOrder>(() => parseSort(searchParams.get('sort')));

  const entities = useMemo(
    () => ['ADDON', 'CATEGORY', 'COMBO', 'DELIVERY', 'FEATURE_FLAG', 'MENU_ITEM', 'SYSTEM', 'USER'],
    [],
  );
  const actions = useMemo(() => ['CREATED', 'UPDATED', 'STATUS_CHANGED', 'DELETED', 'READ'], []);

  const startAtIso = startDate ? new Date(`${startDate}T00:00:00.000`).toISOString() : undefined;
  const endAtIso = endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getAuditLogs({
        page,
        pageSize,
        entity: entity || undefined,
        action: action || undefined,
        actorEmail: actorEmail.trim() || undefined,
        startAt: startAtIso,
        endAt: endAtIso,
        sort,
      });
      setLogs(data.items);
      setTotal(data.total);
      setHasNextPage(data.hasNextPage);
    } catch {
      setError(t('Não foi possível carregar a trilha de auditoria.'));
    } finally {
      setLoading(false);
    }
  }, [action, actorEmail, endAtIso, entity, page, pageSize, sort, startAtIso, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const nextPage = parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE);
    const nextPageSize = parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
    const nextSort = parseSort(searchParams.get('sort'));
    const nextEntity = searchParams.get('entity') ?? '';
    const nextAction = searchParams.get('action') ?? '';
    const nextActorEmail = searchParams.get('actorEmail') ?? '';
    const nextStartDate = parseDateOnly(searchParams.get('startDate'));
    const nextEndDate = parseDateOnly(searchParams.get('endDate'));

    if (page !== nextPage) setPage(nextPage);
    if (pageSize !== nextPageSize) setPageSize(nextPageSize);
    if (sort !== nextSort) setSort(nextSort);
    if (entity !== nextEntity) setEntity(nextEntity);
    if (action !== nextAction) setAction(nextAction);
    if (actorEmail !== nextActorEmail) setActorEmail(nextActorEmail);
    if (startDate !== nextStartDate) setStartDate(nextStartDate);
    if (endDate !== nextEndDate) setEndDate(nextEndDate);
  }, [
    action,
    actorEmail,
    endDate,
    entity,
    page,
    pageSize,
    searchParams,
    sort,
    startDate,
  ]);

  useEffect(() => {
    const next = new URLSearchParams();

    if (page !== DEFAULT_PAGE) next.set('page', String(page));
    if (pageSize !== DEFAULT_PAGE_SIZE) next.set('pageSize', String(pageSize));
    if (sort !== DEFAULT_SORT) next.set('sort', sort);
    if (entity) next.set('entity', entity);
    if (action) next.set('action', action);
    if (actorEmail.trim()) next.set('actorEmail', actorEmail.trim());
    if (startDate) next.set('startDate', startDate);
    if (endDate) next.set('endDate', endDate);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: false });
    }
  }, [
    action,
    actorEmail,
    endDate,
    entity,
    page,
    pageSize,
    searchParams,
    setSearchParams,
    sort,
    startDate,
  ]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminAuditLog[]>();
    for (const log of logs) {
      const dateKey = new Date(log.timestamp).toISOString().slice(0, 10);
      const current = map.get(dateKey) ?? [];
      current.push(log);
      map.set(dateKey, current);
    }
    return [...map.entries()];
  }, [logs]);

  function resetPagination() {
    setPage(1);
  }

  function resetFilters() {
    setEntity('');
    setAction('');
    setActorEmail('');
    setStartDate('');
    setEndDate('');
    setSort(DEFAULT_SORT);
    setPageSize(DEFAULT_PAGE_SIZE);
    setPage(DEFAULT_PAGE);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Auditoria')}</h1>
          <p className="mt-2 text-sm text-stone-600">{t('Acompanhe alterações administrativas sensíveis com ator, ação e contexto.')}</p>
        </div>

        <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{t('Filtros de auditoria')}</p>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-stone-600">
              {t('Entidade')}
              <select
                value={entity}
                onChange={(event) => {
                  setEntity(event.target.value);
                  resetPagination();
                }}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
              >
                <option value="">{t('Todas entidades')}</option>
                {entities.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-stone-600">
              {t('Ação')}
              <select
                value={action}
                onChange={(event) => {
                  setAction(event.target.value);
                  resetPagination();
                }}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
              >
                <option value="">{t('Todas ações')}</option>
                {actions.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-stone-600">
              {t('Ator')}
              <input
                type="text"
                value={actorEmail}
                onChange={(event) => {
                  setActorEmail(event.target.value);
                  resetPagination();
                }}
                placeholder={t('Filtrar por ator (email)')}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
              />
            </label>

            <label className="text-xs font-semibold text-stone-600">
              {t('Ordenação')}
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as AdminAuditSortOrder);
                  resetPagination();
                }}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
              >
                <option value="newest">{t('Mais recentes')}</option>
                <option value="oldest">{t('Mais antigos')}</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-stone-600">
              {t('Data inicial')}
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  resetPagination();
                }}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                aria-label={t('Data inicial')}
              />
            </label>

            <label className="text-xs font-semibold text-stone-600">
              {t('Data final')}
              <input
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  resetPagination();
                }}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
                aria-label={t('Data final')}
              />
            </label>

            <label className="text-xs font-semibold text-stone-600">
              {t('Tamanho da página')}
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  resetPagination();
                }}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </label>

            <div className="flex items-end gap-2 xl:justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                {t('Limpar filtros')}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                {t('Atualizar')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            {t('Exibindo página {page} de {pages} ({total} eventos).', {
              page,
              pages: Math.max(1, Math.ceil(total / pageSize)),
              total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
            >
              {t('Página anterior')}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={loading || !hasNextPage}
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-50"
            >
              {t('Próxima página')}
            </button>
          </div>
          </div>
        </div>

        {loading ? (
          <p className="px-2 py-6 text-sm text-stone-500">{t('Carregando auditoria...')}</p>
        ) : logs.length === 0 ? (
          <p className="px-2 py-6 text-sm text-stone-500">{t('Nenhum evento de auditoria encontrado.')}</p>
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, entries]) => (
              <section key={date}>
                <h2 className="px-2 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">{date}</h2>
                <div className="mt-3 space-y-2">
                  {entries.map((entry) => (
                    <article key={`${entry.timestamp}-${entry.path}-${entry.method}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-stone-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                              {entry.action}
                            </span>
                            <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                              {entry.entity}
                            </span>
                          </div>
                          <p className="mt-2 break-all text-xs text-stone-500">{entry.method} {entry.path}</p>
                        </div>
                        <div className="whitespace-nowrap text-xs text-stone-500">
                          {new Date(entry.timestamp).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-stone-600 lg:grid-cols-3">
                        <span>{t('Ator')}: {entry.actorEmail ?? '-'}</span>
                        <span>{t('Perfil')}: {entry.actorRole ?? '-'}</span>
                        <span>{t('Status')}: {entry.statusCode}</span>
                      </div>
                      {entry.payload ? (
                        <details className="mt-3 rounded-xl border border-stone-200 bg-white p-3">
                          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                            {t('Payload da ação')}
                          </summary>
                          <pre className="mt-2 overflow-x-auto text-xs text-stone-700">
                            {typeof entry.payload === 'string'
                              ? entry.payload
                              : JSON.stringify(entry.payload, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
