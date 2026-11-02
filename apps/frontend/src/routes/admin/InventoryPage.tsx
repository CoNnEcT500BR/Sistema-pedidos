import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Boxes, RefreshCw } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  adminService,
  type InventoryIngredient,
  type InventoryMovement,
  type InventoryRecipeLink,
  type InventoryUnit,
} from '@/features/admin/services/admin.service';
import { useCatalogRealtimeRefresh } from '@/hooks/useCatalogRealtimeRefresh';
import { useI18n } from '@/i18n';

const unitLabels: Record<InventoryUnit, string> = {
  UNIT: 'unidade(s)',
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITER: 'ml',
  LITER: 'L',
};

const reasonLabels: Record<string, string> = {
  INITIAL_COUNT: 'Contagem inicial',
  COUNT_ADJUSTMENT: 'Ajuste de contagem',
  ORDER_RESERVED: 'Reserva de pedido',
  ORDER_CANCELLED: 'Liberação de pedido cancelado',
};

interface RecipeEdit {
  ingredientId: string;
  quantity: string;
}

function getStockState(ingredient: InventoryIngredient): {
  label: string;
  className: string;
} {
  if (ingredient.currentQuantity === null) {
    return { label: 'Não contado', className: 'bg-stone-100 text-stone-800' };
  }
  if (ingredient.currentQuantity <= 0) {
    return { label: 'Sem estoque', className: 'bg-red-100 text-red-800' };
  }
  if (
    ingredient.lowStockThreshold !== null &&
    ingredient.currentQuantity <= ingredient.lowStockThreshold
  ) {
    return { label: 'Estoque baixo', className: 'bg-amber-100 text-amber-900' };
  }
  return { label: 'Disponível', className: 'bg-emerald-100 text-emerald-800' };
}

function formatQuantity(quantity: number): string {
  return quantity.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}

export function InventoryPage() {
  const { t } = useI18n();
  const [ingredients, setIngredients] = useState<InventoryIngredient[]>([]);
  const [recipes, setRecipes] = useState<InventoryRecipeLink[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [recipeEdits, setRecipeEdits] = useState<Record<string, RecipeEdit>>({});
  const [countValues, setCountValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [pageError, setPageError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState<InventoryUnit>('UNIT');
  const [newThreshold, setNewThreshold] = useState('');
  const [createError, setCreateError] = useState('');

  const refresh = useCallback(async (announce = false) => {
    setLoading(true);
    if (announce) setAnnouncement('Carregando estoque e receitas.');
    setPageError('');
    try {
      const [nextIngredients, nextRecipes, nextMovements] = await Promise.all([
        adminService.getInventory(),
        adminService.getInventoryRecipes(),
        adminService.getInventoryMovements(),
      ]);
      setIngredients(nextIngredients);
      setRecipes(nextRecipes);
      setMovements(nextMovements);
      setRecipeEdits(
        Object.fromEntries(
          nextRecipes.map((recipe) => [
            recipe.id,
            {
              ingredientId: recipe.inventoryIngredientId ?? '',
              quantity: recipe.stockQuantity?.toString() ?? '',
            },
          ]),
        ),
      );
      if (announce) setAnnouncement('Estoque e receitas carregados.');
    } catch (error) {
      setPageError(getErrorMessage(error));
      setAnnouncement('O carregamento do estoque falhou.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Estoque - Sistema de Pedidos';
    void refresh(true);
  }, [refresh]);

  useCatalogRealtimeRefresh(() => {
    void refresh(false);
  });

  const filteredRecipes = useMemo(() => {
    const searchText = search.trim().toLocaleLowerCase('pt-BR');
    return recipes.filter((recipe) =>
      `${recipe.menuItem.name} ${recipe.addon.name}`.toLocaleLowerCase('pt-BR').includes(searchText),
    );
  }, [recipes, search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    const searchText = value.trim().toLocaleLowerCase('pt-BR');
    const matchingRecipes = recipes.filter((recipe) =>
      `${recipe.menuItem.name} ${recipe.addon.name}`
        .toLocaleLowerCase('pt-BR')
        .includes(searchText),
    ).length;
    setAnnouncement(`${matchingRecipes} vínculos de receita encontrados.`);
  }

  async function handleCreateIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');
    const threshold = newThreshold.trim() ? Number(newThreshold) : undefined;
    if (threshold !== undefined && (!Number.isFinite(threshold) || threshold < 0)) {
      setCreateError('Informe um limite de estoque válido e não negativo.');
      return;
    }

    setBusyAction('create');
    try {
      await adminService.createInventoryIngredient({
        name: newName.trim(),
        unit: newUnit,
        ...(threshold === undefined ? {} : { lowStockThreshold: threshold }),
      });
      setNewName('');
      setNewUnit('UNIT');
      setNewThreshold('');
      setAnnouncement('Insumo cadastrado. Faça a contagem inicial para ativar o controle de saldo.');
      await refresh(false);
    } catch (error) {
      setCreateError(getErrorMessage(error));
      setAnnouncement('Não foi possível cadastrar o insumo.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCount(event: FormEvent<HTMLFormElement>, ingredient: InventoryIngredient) {
    event.preventDefault();
    const rawQuantity = countValues[ingredient.id] ?? '';
    const quantity = Number(rawQuantity);
    if (!rawQuantity.trim() || !Number.isFinite(quantity) || quantity < 0) {
      setPageError('Informe uma contagem física válida, igual ou maior que zero.');
      setAnnouncement('A contagem não foi salva. Verifique o campo de saldo contado.');
      return;
    }

    const actionId = `count-${ingredient.id}`;
    setBusyAction(actionId);
    setPageError('');
    try {
      await adminService.countInventoryIngredient(ingredient.id, { quantity });
      setCountValues((current) => ({ ...current, [ingredient.id]: '' }));
      setAnnouncement(`Contagem de ${ingredient.name} salva.`);
      await refresh(false);
    } catch (error) {
      setPageError(getErrorMessage(error));
      setAnnouncement(`Não foi possível salvar a contagem de ${ingredient.name}.`);
    } finally {
      setBusyAction(null);
    }
  }

  function updateRecipeEdit(id: string, field: keyof RecipeEdit, value: string) {
    setRecipeEdits((current) => {
      const currentEdit = current[id] ?? { ingredientId: '', quantity: '' };
      return {
        ...current,
        [id]: {
          ...currentEdit,
          [field]: value,
          ...(field === 'ingredientId' && value !== currentEdit.ingredientId
            ? { quantity: '' }
            : {}),
        },
      };
    });
  }

  async function handleSaveRecipe(event: FormEvent<HTMLFormElement>, recipe: InventoryRecipeLink) {
    event.preventDefault();
    const edit = recipeEdits[recipe.id];
    if (!edit) return;

    const quantity = edit.quantity.trim() ? Number(edit.quantity) : null;
    if (edit.ingredientId && (quantity === null || !Number.isFinite(quantity) || quantity <= 0)) {
      setPageError('Informe o consumo por unidade do produto, maior que zero.');
      setAnnouncement(`A receita de ${recipe.menuItem.name} não foi salva.`);
      return;
    }

    const actionId = `recipe-${recipe.id}`;
    setBusyAction(actionId);
    setPageError('');
    try {
      await adminService.updateInventoryRecipe(recipe.id, {
        inventoryIngredientId: edit.ingredientId || null,
        stockQuantity: edit.ingredientId ? quantity : null,
      });
      setAnnouncement(`Receita de ${recipe.menuItem.name} atualizada.`);
      await refresh(false);
    } catch (error) {
      setPageError(getErrorMessage(error));
      setAnnouncement(`Não foi possível salvar a receita de ${recipe.menuItem.name}.`);
    } finally {
      setBusyAction(null);
    }
  }

  const activeIngredients = ingredients.filter((ingredient) => ingredient.isActive);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            {t('Operação')}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">{t('Estoque e receitas')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-stone-700">
            {t('Cadastre insumos, informe a contagem física e associe o consumo às opções dos produtos.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh(true)}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw aria-hidden="true" size={16} />
          {t('Atualizar')}
        </button>
      </header>

      <p className="text-sm text-stone-700" role="status" aria-live="polite">
        {loading ? t('Carregando estoque e receitas...') : announcement}
      </p>
      {pageError && (
        <div
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          role="alert"
        >
          {pageError}
        </div>
      )}

      <section aria-labelledby="create-ingredient-heading" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <Boxes aria-hidden="true" className="text-amber-700" size={22} />
          <div>
            <h2 id="create-ingredient-heading" className="text-xl font-bold text-stone-900">
              {t('Cadastrar insumo')}
            </h2>
            <p className="mt-1 text-sm text-stone-700">
              {t('O saldo ficará como não contado até que uma contagem física seja informada.')}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateIngredient} className="grid gap-4 md:grid-cols-4 md:items-end">
          <div className="md:col-span-2">
            <label htmlFor="inventory-name" className="mb-1.5 block text-sm font-semibold text-stone-800">
              {t('Nome do insumo')} <span aria-hidden="true">*</span>
            </label>
            <Input
              id="inventory-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              minLength={2}
              maxLength={100}
              autoComplete="off"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="inventory-unit" className="mb-1.5 block text-sm font-semibold text-stone-800">
              {t('Unidade de medida')} <span aria-hidden="true">*</span>
            </label>
            <select
              id="inventory-unit"
              value={newUnit}
              onChange={(event) => setNewUnit(event.target.value as InventoryUnit)}
              required
              aria-required="true"
              className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
            >
              <option value="UNIT">Unidade (un)</option>
              <option value="GRAM">Grama (g)</option>
              <option value="KILOGRAM">Quilograma (kg)</option>
              <option value="MILLILITER">Mililitro (ml)</option>
              <option value="LITER">Litro (L)</option>
            </select>
          </div>
          <div>
            <label htmlFor="inventory-threshold" className="mb-1.5 block text-sm font-semibold text-stone-800">
              {t('Avisar estoque baixo')} <span className="font-normal text-stone-600">({t('opcional')})</span>
            </label>
            <Input
              id="inventory-threshold"
              type="number"
              min="0"
              step="any"
              value={newThreshold}
              onChange={(event) => setNewThreshold(event.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <button
              type="submit"
              disabled={busyAction === 'create'}
              className="min-h-11 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === 'create' ? t('Salvando...') : t('Cadastrar insumo')}
            </button>
            {createError && (
              <p className="mt-2 text-sm font-medium text-red-800" role="alert">
                {createError}
              </p>
            )}
          </div>
        </form>
      </section>

      <section aria-labelledby="stock-heading" aria-busy={loading} className="space-y-4">
        <div>
          <h2 id="stock-heading" className="text-2xl font-bold text-stone-900">
            {t('Saldo de estoque')}
          </h2>
          <p className="mt-1 text-sm text-stone-700">
            {t('Contagens substituem o saldo atual; informe o total físico, não uma quantidade de entrada.')}
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <caption className="sr-only">{t('Saldos e contagens de estoque por insumo')}</caption>
            <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-700">
              <tr>
                <th scope="col" className="px-4 py-3">{t('Insumo')}</th>
                <th scope="col" className="px-4 py-3">{t('Saldo atual')}</th>
                <th scope="col" className="px-4 py-3">{t('Limite baixo')}</th>
                <th scope="col" className="px-4 py-3">{t('Produtos associados')}</th>
                <th scope="col" className="px-4 py-3">{t('Nova contagem física')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {ingredients.map((ingredient) => {
                const stockState = getStockState(ingredient);
                const inputId = `inventory-count-${ingredient.id}`;
                const helpId = `${inputId}-help`;
                return (
                  <tr key={ingredient.id} className="align-top">
                    <th scope="row" className="px-4 py-4 font-semibold text-stone-900">
                      <span className="block">{ingredient.name}</span>
                      <span className="mt-1 block text-xs font-normal text-stone-700">
                        Unidade: {unitLabels[ingredient.unit]}
                      </span>
                      {!ingredient.isActive && (
                        <span className="mt-1 block text-xs font-semibold text-stone-700">{t('Inativo')}</span>
                      )}
                    </th>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockState.className}`}>
                        {t(stockState.label)}
                      </span>
                      <span className="mt-2 block font-medium text-stone-900">
                        {ingredient.currentQuantity === null
                          ? t('Saldo desconhecido')
                          : `${formatQuantity(ingredient.currentQuantity)} ${unitLabels[ingredient.unit]}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-stone-800">
                      {ingredient.lowStockThreshold === null
                        ? t('Não configurado')
                        : `${formatQuantity(ingredient.lowStockThreshold)} ${unitLabels[ingredient.unit]}`}
                    </td>
                    <td className="px-4 py-4 text-stone-800">
                      {ingredient.linkedMenuItems.length
                        ? ingredient.linkedMenuItems.map((item) => item.name).join(', ')
                        : t('Nenhum')}
                    </td>
                    <td className="px-4 py-4">
                      <form onSubmit={(event) => void handleCount(event, ingredient)} className="flex items-end gap-2">
                        <div className="min-w-36 flex-1">
                          <label htmlFor={inputId} className="sr-only">
                            {t('Contagem física de {ingredient}', { ingredient: ingredient.name })}
                          </label>
                          <Input
                            id={inputId}
                            type="number"
                            min="0"
                            step="any"
                            required
                            aria-required="true"
                            aria-describedby={helpId}
                            value={countValues[ingredient.id] ?? ''}
                            onChange={(event) =>
                              setCountValues((current) => ({
                                ...current,
                                [ingredient.id]: event.target.value,
                              }))
                            }
                          />
                          <span id={helpId} className="mt-1 block text-xs text-stone-700">
                            {t('Quantidade em {unit}', { unit: unitLabels[ingredient.unit] })}
                          </span>
                        </div>
                        <button
                          type="submit"
                          disabled={!ingredient.isActive || busyAction === `count-${ingredient.id}`}
                          className="min-h-10 rounded-lg border border-stone-400 bg-white px-3 text-xs font-semibold text-stone-900 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {ingredient.currentQuantity === null ? t('Contagem inicial') : t('Salvar saldo')}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!ingredients.length && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-700">
                    {t('Nenhum insumo cadastrado.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="recipes-heading" aria-busy={loading} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="recipes-heading" className="text-2xl font-bold text-stone-900">
              {t('Receitas por produto')}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-stone-700">
              {t('Associe cada opção de montagem a um insumo e informe quanto é consumido por produto vendido.')}
            </p>
            <p className="mt-1 text-sm text-stone-700">
              {t('Opções obrigatórias consomem estoque em cada venda; opções opcionais consomem somente quando selecionadas.')}
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <label htmlFor="recipe-search" className="mb-1.5 block text-sm font-semibold text-stone-800">
              {t('Buscar produto ou opção')}
            </label>
            <Input
              id="recipe-search"
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={t('Nome do produto ou opção')}
            />
            <p className="sr-only" aria-live="polite">
              {filteredRecipes.length} vínculos de receita exibidos.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[950px] border-collapse text-left text-sm">
            <caption className="sr-only">{t('Consumo de estoque associado a cada produto e opção')}</caption>
            <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-700">
              <tr>
                <th scope="col" className="px-4 py-3">{t('Produto')}</th>
                <th scope="col" className="px-4 py-3">{t('Opção do cardápio')}</th>
                <th scope="col" className="px-4 py-3">{t('Insumo de estoque')}</th>
                <th scope="col" className="px-4 py-3">{t('Consumo por produto')}</th>
                <th scope="col" className="px-4 py-3">{t('Ação')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredRecipes.map((recipe) => {
                const edit = recipeEdits[recipe.id] ?? { ingredientId: '', quantity: '' };
                const ingredient = activeIngredients.find((item) => item.id === edit.ingredientId);
                const ingredientSelectId = `recipe-ingredient-${recipe.id}`;
                const quantityInputId = `recipe-quantity-${recipe.id}`;
                const quantityHelpId = `${quantityInputId}-help`;
                return (
                  <tr key={recipe.id} className="align-top">
                    <th scope="row" className="px-4 py-4 font-semibold text-stone-900">
                      {recipe.menuItem.name}
                      {!recipe.menuItem.isAvailable && (
                        <span className="mt-1 block text-xs font-normal text-stone-700">
                          {t('Produto desativado no cardápio')}
                        </span>
                      )}
                    </th>
                    <td className="px-4 py-4 text-stone-800">
                      <span className="block">{recipe.addon.name}</span>
                      <span className="mt-1 block text-xs text-stone-700">
                        {recipe.isRequired ? t('Obrigatória') : t('Opcional')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <label htmlFor={ingredientSelectId} className="sr-only">
                        {t('Insumo para {product} - {option}', {
                          product: recipe.menuItem.name,
                          option: recipe.addon.name,
                        })}
                      </label>
                      <select
                        id={ingredientSelectId}
                        value={edit.ingredientId}
                        onChange={(event) =>
                          updateRecipeEdit(recipe.id, 'ingredientId', event.target.value)
                        }
                        className="h-10 w-full min-w-48 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                      >
                        <option value="">{t('Sem controle de estoque')}</option>
                        {activeIngredients.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({unitLabels[item.unit]})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <label htmlFor={quantityInputId} className="sr-only">
                        {t('Consumo de {ingredient} por unidade de {product}', {
                          ingredient: ingredient?.name ?? t('insumo'),
                          product: recipe.menuItem.name,
                        })}
                      </label>
                      <Input
                        id={quantityInputId}
                        type="number"
                        min="0.000001"
                        step="any"
                        required={Boolean(edit.ingredientId)}
                        aria-required={Boolean(edit.ingredientId)}
                        aria-describedby={quantityHelpId}
                        disabled={!edit.ingredientId}
                        value={edit.quantity}
                        onChange={(event) =>
                          updateRecipeEdit(recipe.id, 'quantity', event.target.value)
                        }
                      />
                      <span id={quantityHelpId} className="mt-1 block text-xs text-stone-700">
                        {ingredient
                          ? t('Quantidade em {unit}', { unit: unitLabels[ingredient.unit] })
                          : t('Selecione um insumo primeiro')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <form onSubmit={(event) => void handleSaveRecipe(event, recipe)}>
                        <button
                          type="submit"
                          disabled={busyAction === `recipe-${recipe.id}`}
                          className="min-h-10 rounded-lg border border-stone-400 bg-white px-3 text-xs font-semibold text-stone-900 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busyAction === `recipe-${recipe.id}` ? t('Salvando...') : t('Salvar receita')}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!filteredRecipes.length && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-700">
                    {recipes.length
                      ? t('Nenhuma opção encontrada para essa busca.')
                      : t('Cadastre um produto e suas opções no cardápio para configurar receitas.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="movements-heading" aria-busy={loading} className="space-y-4">
        <div>
          <h2 id="movements-heading" className="text-2xl font-bold text-stone-900">
            {t('Movimentações recentes')}
          </h2>
          <p className="mt-1 text-sm text-stone-700">
            {t('Contagens, reservas e liberações de pedidos cancelados.')}
          </p>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">{t('Histórico recente de movimentações de estoque')}</caption>
            <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-700">
              <tr>
                <th scope="col" className="px-4 py-3">{t('Data')}</th>
                <th scope="col" className="px-4 py-3">{t('Insumo')}</th>
                <th scope="col" className="px-4 py-3">{t('Movimentação')}</th>
                <th scope="col" className="px-4 py-3">{t('Pedido / observação')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-4 py-3 text-stone-800">
                    {new Date(movement.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <th scope="row" className="px-4 py-3 font-semibold text-stone-900">
                    {movement.ingredient.name}
                  </th>
                  <td className="px-4 py-3 text-stone-800">
                    <span className="block font-medium">
                      {movement.quantityDelta > 0 ? '+' : ''}
                      {formatQuantity(movement.quantityDelta)} {unitLabels[movement.ingredient.unit]}
                    </span>
                    <span className="text-xs text-stone-700">
                      {t(reasonLabels[movement.reason] ?? movement.reason)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-800">
                    {movement.order
                      ? t('Pedido #{number}', { number: movement.order.orderNumber })
                      : movement.note ?? '—'}
                  </td>
                </tr>
              ))}
              {!movements.length && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-700">
                    {t('Ainda não há movimentações registradas.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
