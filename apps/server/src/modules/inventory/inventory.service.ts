import { inventoryRepository } from './inventory.repository.js';
import type {
  CountInventoryIngredientInput,
  CreateInventoryIngredientInput,
  UpdateInventoryIngredientInput,
} from './inventoryTypes.js';

export class InventoryServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

function mapInventoryError(error: unknown): InventoryServiceError {
  if (error instanceof InventoryServiceError) {
    return error;
  }

  if (hasPrismaErrorCode(error, 'P2002')) {
    return new InventoryServiceError('Já existe um insumo com este nome.', 409);
  }

  if (hasPrismaErrorCode(error, 'P2025')) {
    return new InventoryServiceError('Insumo não encontrado.', 404);
  }

  throw error;
}

export const inventoryService = {
  list: () => inventoryRepository.list(),
  listRecipes: () => inventoryRepository.listRecipes(),
  listMovements: () => inventoryRepository.listMovements(),

  updateRecipe: async (
    menuItemAddonId: string,
    inventoryIngredientId: string | null,
    stockQuantity: number | null,
  ) => {
    if (inventoryIngredientId && stockQuantity === null) {
      throw new InventoryServiceError('Informe a quantidade consumida por unidade do produto.');
    }
    if (!inventoryIngredientId && stockQuantity !== null) {
      throw new InventoryServiceError('Remova também a quantidade quando não houver insumo associado.');
    }

    if (inventoryIngredientId) {
      const ingredient = await inventoryRepository.findIngredientById(inventoryIngredientId);
      if (!ingredient || !ingredient.isActive) {
        throw new InventoryServiceError('Selecione um insumo ativo.', 400);
      }
    }

    try {
      const result = await inventoryRepository.updateRecipe(
        menuItemAddonId,
        inventoryIngredientId,
        stockQuantity,
      );
      if (!result) {
        throw new InventoryServiceError('Vínculo de receita não encontrado.', 404);
      }
      return result;
    } catch (error) {
      throw mapInventoryError(error);
    }
  },

  create: async (data: CreateInventoryIngredientInput) => {
    try {
      return await inventoryRepository.create(data);
    } catch (error) {
      throw mapInventoryError(error);
    }
  },

  update: async (id: string, data: UpdateInventoryIngredientInput) => {
    try {
      return await inventoryRepository.update(id, data);
    } catch (error) {
      throw mapInventoryError(error);
    }
  },

  count: async (id: string, data: CountInventoryIngredientInput) => {
    try {
      const ingredient = await inventoryRepository.count(id, data);
      if (!ingredient) {
        throw new InventoryServiceError('Insumo não encontrado.', 404);
      }
      return ingredient;
    } catch (error) {
      throw mapInventoryError(error);
    }
  },
};
