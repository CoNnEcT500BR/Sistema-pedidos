import { Bike, ClipboardList, Route } from 'lucide-react';

import { useI18n } from '@/i18n';

export function DeliveryPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Delivery')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          {t('Esta aba já está preparada para o fluxo de delivery com filas, roteirização e acompanhamento de entrega.')}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ClipboardList size={20} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-stone-900">{t('Fila de entregas')}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Estrutura pronta para agrupar pedidos por prioridade e horário prometido.')}</p>
        </article>

        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Route size={20} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-stone-900">{t('Roteirização')}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Área reservada para planejamento de rotas e zonas de cobertura.')}</p>
        </article>

        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Bike size={20} />
          </div>
          <h2 className="mt-3 text-lg font-bold text-stone-900">{t('Status em tempo real')}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Preparado para mostrar despacho, em rota e entregue por entregador.')}</p>
        </article>
      </div>
    </div>
  );
}
