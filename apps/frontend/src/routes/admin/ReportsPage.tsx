import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService } from '@/features/admin/services/admin.service';
import type { SalesReportData } from '@/features/admin/types/admin.types';
import { useCatalogRealtimeRefresh } from '@/hooks/useCatalogRealtimeRefresh';
import { useOrdersRealtimeRefresh } from '@/hooks/useOrdersRealtimeRefresh';
import { useI18n } from '@/i18n';

function getDateOffset(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const { t, language } = useI18n();
  const [startDate, setStartDate] = useState(getDateOffset(-6));
  const [endDate, setEndDate] = useState(getDateOffset(0));
  const [report, setReport] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    [language],
  );

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await adminService.getSalesReport({ startDate, endDate }));
    } catch {
      setError(t('Não foi possível carregar o relatório.'));
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, t]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useOrdersRealtimeRefresh(() => {
    void loadReport();
  });

  useCatalogRealtimeRefresh(() => {
    void loadReport();
  });

  function exportJson() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${startDate}-${endDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Relatórios')}</h1>
            <p className="mt-2 text-sm text-stone-600">{t('Compare períodos, analise categorias e exporte um snapshot operacional do negócio.')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_180px_auto_auto]">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-300" />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-stone-300" />
            <button type="button" onClick={exportJson} disabled={!report} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60">
              <Download size={16} />
              {t('Exportar JSON')}
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardDescription>{t('Vendas')}</CardDescription>
            <CardTitle>{loading || !report ? '...' : currency.format(report.totals.grossSales)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardDescription>{t('Pedidos')}</CardDescription>
            <CardTitle>{loading || !report ? '...' : report.totals.ordersCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardDescription>{t('Ticket médio')}</CardDescription>
            <CardTitle>{loading || !report ? '...' : currency.format(report.totals.averageTicket)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardTitle className="text-xl">{t('Evolução diária')}</CardTitle>
            <CardDescription>{t('Totais acumulados por dia no período filtrado.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">{t('Carregando relatório...')}</p>
            ) : report?.dailyTotals.length ? (
              report.dailyTotals.map((entry) => (
                <div key={entry.date} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-stone-900">{entry.date}</span>
                  <span className="text-stone-500">{t('{count} pedidos', { count: entry.orders })}</span>
                  <span className="font-semibold text-stone-700">{currency.format(entry.total)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">{t('Sem dados')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardTitle className="text-xl">{t('Categorias')}</CardTitle>
            <CardDescription>{t('Contribuição de receita por categoria.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">{t('Carregando relatório...')}</p>
            ) : report?.salesByCategory.length ? (
              report.salesByCategory.map((entry) => (
                <div key={entry.name} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm">
                  <span className="font-semibold text-stone-900">{entry.name}</span>
                  <span className="text-stone-500">{t('{count} itens', { count: entry.quantity })}</span>
                  <span className="font-semibold text-stone-700">{currency.format(entry.revenue)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">{t('Sem dados')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardTitle className="text-xl">{t('Top itens')}</CardTitle>
            <CardDescription>{t('Produtos com maior volume no período selecionado.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">{t('Carregando relatório...')}</p>
            ) : report?.topItems.length ? (
              report.topItems.map((entry) => (
                <div key={entry.name} className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm">
                  <span className="font-semibold text-stone-900">{entry.name}</span>
                  <span className="text-stone-500">{t('{count} itens', { count: entry.quantity })}</span>
                  <span className="font-semibold text-stone-700">{currency.format(entry.revenue)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">{t('Sem dados')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardTitle className="text-xl">{t('Resumo do relatório')}</CardTitle>
            <CardDescription>{t('Faixa consultada e momento da exportação atual.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-600">
            <div className="rounded-2xl bg-stone-50 px-4 py-3">
              <strong className="block text-stone-900">{t('Período')}</strong>
              <span>{report?.period.label ?? `${startDate} -> ${endDate}`}</span>
            </div>
            <div className="rounded-2xl bg-stone-50 px-4 py-3">
              <strong className="block text-stone-900">{t('Gerado em')}</strong>
              <span>
                {report?.exportGeneratedAt
                  ? new Date(report.exportGeneratedAt).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')
                  : '-'}
              </span>
            </div>
            <div className="rounded-2xl bg-stone-50 px-4 py-3">
              <strong className="block text-stone-900">{t('Status monitorados')}</strong>
              <span>{report ? Object.keys(report.statusBreakdown).length : 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
