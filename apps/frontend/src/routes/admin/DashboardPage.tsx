import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService } from '@/features/admin/services/admin.service';
import type { DashboardData } from '@/features/admin/types/admin.types';
import { useCatalogRealtimeRefresh } from '@/hooks/useCatalogRealtimeRefresh';
import { useOrdersRealtimeRefresh } from '@/hooks/useOrdersRealtimeRefresh';
import { useI18n } from '@/i18n';

function formatOrderStatus(status: string, t: (value: string) => string) {
  const map: Record<string, string> = {
    PENDING: 'Aguardando',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Preparando',
    READY: 'Pronto',
    COMPLETED: 'Concluído',
    CANCELLED: 'Cancelado',
  };

  return t(map[status] ?? status);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
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

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminService.getDashboard());
    } catch {
      setError(t('Não foi possível carregar o dashboard administrativo.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useOrdersRealtimeRefresh(() => {
    void loadDashboard();
  });

  useCatalogRealtimeRefresh(() => {
    void loadDashboard();
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Painel administrativo')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Dashboard operacional')}</h1>
          <p className="mt-2 text-sm text-stone-600">
            {data ? t('Resumo de {period}', { period: data.period.label }) : t('Acompanhe vendas, pedidos e sinais da operação em tempo real.')}
          </p>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardDescription>{t('Vendas no período')}</CardDescription>
            <CardTitle>{loading || !data ? '...' : currency.format(data.totals.grossSales)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardDescription>{t('Pedidos no período')}</CardDescription>
            <CardTitle>{loading || !data ? '...' : data.totals.ordersCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardDescription>{t('Ticket médio')}</CardDescription>
            <CardTitle>{loading || !data ? '...' : currency.format(data.totals.averageTicket)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardDescription>{t('Item líder')}</CardDescription>
            <CardTitle>{loading || !data ? '...' : data.topItems[0]?.name ?? t('Sem dados')}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">{t('Top itens')}</CardTitle>
              <CardDescription>{t('Os mais vendidos no período atual.')}</CardDescription>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/reports')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 transition hover:text-stone-900"
            >
              {t('Abrir relatórios')}
              <ArrowRight size={16} />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">{t('Carregando dashboard...')}</p>
            ) : data?.topItems.length ? (
              data.topItems.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-stone-900">{item.name}</p>
                    <p className="text-sm text-stone-500">{t('{count} itens', { count: item.quantity })}</p>
                  </div>
                  <p className="text-sm font-semibold text-stone-700">{currency.format(item.revenue)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">{t('Sem dados')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardTitle className="text-xl">{t('Pedidos recentes')}</CardTitle>
            <CardDescription>{t('Últimos pedidos registrados para acompanhamento rápido.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">{t('Carregando dashboard...')}</p>
            ) : data?.recentOrders.length ? (
              data.recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">#{order.orderNumber}</p>
                      <p className="text-sm text-stone-500">{order.customerName || t('Cliente não identificado')}</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                      {formatOrderStatus(order.status, t)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
                    <span>{new Date(order.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</span>
                    <strong className="text-stone-900">{currency.format(order.finalPrice)}</strong>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">{t('Sem dados')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border-stone-200">
          <CardHeader>
            <CardTitle className="text-xl">{t('Vendas por categoria')}</CardTitle>
            <CardDescription>{t('Distribuição de receita por frente do cardápio.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">{t('Carregando dashboard...')}</p>
            ) : data?.salesByCategory.length ? (
              data.salesByCategory.map((entry) => (
                <div key={entry.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm">
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
            <CardTitle className="text-xl">{t('Status dos pedidos')}</CardTitle>
            <CardDescription>{t('Volume atual por etapa de operação.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-stone-500">{t('Carregando dashboard...')}</p>
            ) : data && Object.keys(data.statusBreakdown).length ? (
              Object.entries(data.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-2xl border border-stone-200 px-4 py-3">
                  <span className="font-semibold text-stone-900">{formatOrderStatus(status, t)}</span>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-500">{t('Sem dados')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
