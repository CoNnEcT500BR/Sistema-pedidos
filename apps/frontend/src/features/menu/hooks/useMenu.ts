import { useCallback, useEffect, useState } from 'react';
import type { Addon, Category, Combo, MenuItem } from '../types/menu.types';
import { menuService } from '../services/menu.service';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await menuService.getCategories();
      setCategories(data);
    } catch {
      setError('Não foi possível carregar as categorias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { categories, loading, error, refetch: fetch };
}

export function useMenuItems(categoryId?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await menuService.getMenuItems(categoryId);
      setItems(data);
    } catch {
      setError('Não foi possível carregar os itens.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { items, loading, error, refetch: fetch };
}

export function useAddons(menuItemId: string | null) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!menuItemId) return;
    setLoading(true);
    menuService
      .getAddons(menuItemId)
      .then(setAddons)
      .catch(() => setAddons([]))
      .finally(() => setLoading(false));
  }, [menuItemId]);

  return { addons, loading };
}

export function useAllAddons() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    menuService
      .getAllAddons()
      .then(setAddons)
      .catch(() => setAddons([]))
      .finally(() => setLoading(false));
  }, []);

  return { addons, loading };
}

export function useCombos() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await menuService.getCombos();
      setCombos(data);
    } catch {
      setError('Nao foi possivel carregar os combos.');
      setCombos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { combos, loading, error, refetch: fetch };
}
