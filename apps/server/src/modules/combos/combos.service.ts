import { combosRepository } from './combos.repository';
import type { CreateComboInput, UpdateComboInput } from './combos.types';

export const combosService = {
  listCombos: async () => combosRepository.listActiveCombos(),

  listAdminCombos: async () => combosRepository.listAllCombos(),

  getComboById: async (id: string) => combosRepository.findById(id),

  createCombo: async (payload: CreateComboInput) => combosRepository.create(payload),

  updateCombo: async (id: string, payload: UpdateComboInput) =>
    combosRepository.update(id, payload),

  updateAvailability: async (id: string, isAvailable: boolean) => {
    return combosRepository.updateAvailability(id, isAvailable);
  },

  deleteCombo: async (id: string) => combosRepository.delete(id),
};
