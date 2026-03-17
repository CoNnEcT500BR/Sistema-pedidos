import type { ApiErrorRule } from './api-error';

export const menuErrorRules: ApiErrorRule[] = [
  {
    includes: ['regra de operacao', 'nao aceitam adicionais do tipo extra'],
    message:
      'No fluxo de criação de hambúrguer, adicionais do tipo Extra ficam bloqueados por regra de operação.',
    matchMode: 'all',
  },
  {
    includes: ['regra de operacao', 'nao aceitam extras'],
    message: 'No fluxo de criação de hambúrguer, a aba de extras fica desabilitada para este item.',
    matchMode: 'all',
  },
  {
    includes: ['regra de operacao', 'nao aceitam adicionais do tipo size_change'],
    message:
      'No fluxo de criação de hambúrguer, adicionais do tipo Variação de tamanho ficam bloqueados por regra de operação.',
    matchMode: 'all',
  },
  {
    includes: ['incompativeis com o conjunto do item'],
    message: 'Há adicionais fora do conjunto deste item. Revise para evitar mistura no preparo.',
  },
  {
    includes: ['adicionais informados nao existem'],
    message:
      'Um ou mais adicionais selecionados não existem mais. Atualize a tela e tente novamente.',
  },
  {
    includes: ['categoria nao encontrada'],
    message: 'A categoria deste item não foi encontrada. Atualize os dados antes de salvar.',
  },
  {
    includes: ['item nao encontrado'],
    message: 'Este item não foi encontrado. Atualize a lista e tente novamente.',
  },
  {
    includes: ['ja existe item com esta ordem nesta categoria'],
    message:
      'A ordem de exibição escolhida já está em uso nesta categoria. Selecione outra posição.',
  },
];

export const ingredientErrorRules: ApiErrorRule[] = [
  {
    includes: ['payload invalido'],
    message: 'Dados inválidos para ingrediente. Revise os campos e tente novamente.',
  },
  {
    includes: ['name obrigatorio'],
    message: 'O nome do ingrediente é obrigatório.',
  },
  {
    includes: ['price deve ser maior ou igual a zero'],
    message: 'O preço do ingrediente deve ser maior ou igual a zero.',
  },
  {
    includes: ['informe ao menos um campo para atualizar'],
    message: 'Informe ao menos um campo para atualizar o ingrediente.',
  },
  {
    includes: ['ja existe ingrediente com este nome'],
    message: 'Já existe um ingrediente com esse nome. Use um nome diferente.',
  },
  {
    includes: ['unique constraint failed', 'addon.name'],
    message: 'Já existe um ingrediente com esse nome. Use um nome diferente.',
    matchMode: 'all',
  },
];

export const comboErrorRules: ApiErrorRule[] = [
  {
    includes: ['payload invalido'],
    message: 'Dados inválidos para combo. Revise os campos e tente novamente.',
  },
  {
    includes: ['name obrigatorio'],
    message: 'O nome do combo é obrigatório.',
  },
  {
    includes: ['comboitems obrigatorio', 'comboitems invalido'],
    message: 'Adicione ao menos um item válido no combo.',
  },
  {
    includes: ['menuitemid obrigatorio'],
    message: 'Selecione um item válido em todas as linhas do combo.',
  },
  {
    includes: ['combo nao encontrado'],
    message: 'Este combo não foi encontrado. Atualize a lista e tente novamente.',
  },
];

export const categoryErrorRules: ApiErrorRule[] = [
  {
    includes: ['payload invalido'],
    message: 'Dados inválidos para categoria. Revise os campos e tente novamente.',
  },
  {
    includes: ['name obrigatorio'],
    message: 'O nome da categoria é obrigatório.',
  },
];

export const userErrorRules: ApiErrorRule[] = [
  {
    includes: ['payload invalido'],
    message: 'Dados inválidos para usuário. Revise os campos e tente novamente.',
  },
  {
    includes: ['email invalido'],
    message: 'O email informado é inválido.',
  },
  {
    includes: ['password deve ter ao menos 6 caracteres'],
    message: 'A senha deve ter ao menos 6 caracteres.',
  },
  {
    includes: ['informe ao menos um campo para atualizar'],
    message: 'Informe ao menos um campo para atualizar o usuário.',
  },
  {
    includes: ['nao e permitido remover a propria conta'],
    message: 'Não é permitido remover a própria conta.',
  },
];
