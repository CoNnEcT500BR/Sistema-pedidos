const nullableString = {
  anyOf: [{ type: 'string' }, { type: 'null' }],
} as const;

const nullableDateTime = {
  anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
} as const;

export const bearerAuthSecurity = [{ bearerAuth: [] }] as const;

export const messageSchema = {
  type: 'object',
  description: 'Resposta padrao de erro',
  required: ['message'],
  properties: {
    message: { type: 'string' },
  },
  examples: [{ message: 'Payload invalido' }],
} as const;

export const validationErrorSchema = {
  ...messageSchema,
  description: 'Erro de validacao de payload ou query',
  examples: [{ message: 'Payload invalido' }],
} as const;

export const unauthorizedErrorSchema = {
  ...messageSchema,
  description: 'Requisicao sem token valido ou sem permissao',
  examples: [{ message: 'Unauthorized' }],
} as const;

export const notFoundErrorSchema = {
  ...messageSchema,
  description: 'Recurso nao encontrado',
  examples: [{ message: 'Item nao encontrado' }],
} as const;

export const authUserSchema = {
  type: 'object',
  required: ['id', 'email', 'role', 'name'],
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['ADMIN', 'STAFF'] },
    name: nullableString,
  },
} as const;

export const loginBodySchema = {
  type: 'object',
  description: 'Credenciais de acesso',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 },
  },
  examples: [{ email: 'admin@sistema.local', password: 'admin123' }],
} as const;

export const loginResponseSchema = {
  type: 'object',
  description: 'Usuario autenticado com token JWT',
  required: ['user', 'token'],
  properties: {
    user: authUserSchema,
    token: { type: 'string' },
  },
  examples: [
    {
      user: {
        id: 'cuid-user',
        email: 'admin@sistema.local',
        role: 'ADMIN',
        name: 'Administrador',
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    },
  ],
} as const;

export const authMeResponseSchema = {
  type: 'object',
  required: ['user'],
  properties: {
    user: {
      type: 'object',
      required: ['id', 'email', 'role'],
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['ADMIN', 'STAFF'] },
      },
    },
  },
} as const;

export const categorySchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'description',
    'icon',
    'displayOrder',
    'isActive',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: nullableString,
    icon: nullableString,
    displayOrder: { type: 'integer' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const addonSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'addonType',
    'price',
    'description',
    'isActive',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    addonType: { type: 'string' },
    price: { type: 'number' },
    description: nullableString,
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const menuItemSchema = {
  type: 'object',
  required: [
    'id',
    'categoryId',
    'name',
    'description',
    'price',
    'icon',
    'imageUrl',
    'isAvailable',
    'displayOrder',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    categoryId: { type: 'string' },
    name: { type: 'string' },
    description: nullableString,
    price: { type: 'number' },
    icon: nullableString,
    imageUrl: nullableString,
    isAvailable: { type: 'boolean' },
    displayOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const menuItemWithCategorySchema = {
  type: 'object',
  allOf: [
    menuItemSchema,
    {
      type: 'object',
      required: ['category'],
      properties: {
        category: categorySchema,
      },
    },
  ],
} as const;

export const menuItemAddonLinkSchema = {
  type: 'object',
  required: ['id', 'menuItemId', 'addonId', 'isRequired', 'displayOrder', 'addon'],
  properties: {
    id: { type: 'string' },
    menuItemId: { type: 'string' },
    addonId: { type: 'string' },
    isRequired: { type: 'boolean' },
    displayOrder: { type: 'integer' },
    addon: addonSchema,
  },
} as const;

export const menuItemDetailSchema = {
  type: 'object',
  allOf: [
    menuItemWithCategorySchema,
    {
      type: 'object',
      required: ['addons'],
      properties: {
        addons: {
          type: 'array',
          items: menuItemAddonLinkSchema,
        },
      },
    },
  ],
} as const;

export const createMenuItemBodySchema = {
  type: 'object',
  description: 'Payload para criacao de item do cardapio',
  required: ['categoryId', 'name', 'price'],
  properties: {
    categoryId: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 2 },
    description: { type: 'string' },
    price: { type: 'number', exclusiveMinimum: 0 },
    icon: { type: 'string' },
    imageUrl: { type: 'string', format: 'uri' },
    displayOrder: { type: 'integer', minimum: 0 },
  },
  examples: [
    {
      categoryId: 'cuid-category',
      name: 'Burger Duplo',
      description: 'Hamburguer artesanal com queijo',
      price: 24.9,
      icon: '🍔',
      displayOrder: 10,
    },
  ],
} as const;

export const updateMenuItemBodySchema = {
  type: 'object',
  minProperties: 1,
  properties: createMenuItemBodySchema.properties,
} as const;

export const availabilityBodySchema = {
  type: 'object',
  description: 'Liga ou desliga disponibilidade de venda',
  required: ['isAvailable'],
  properties: {
    isAvailable: { type: 'boolean' },
  },
  examples: [{ isAvailable: false }],
} as const;

export const pathIdSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
  },
} as const;

export const menuListQuerySchema = {
  type: 'object',
  properties: {
    category: { type: 'string' },
  },
} as const;

export const comboItemSchema = {
  type: 'object',
  required: ['id', 'comboId', 'menuItemId', 'quantity', 'menuItem'],
  properties: {
    id: { type: 'string' },
    comboId: { type: 'string' },
    menuItemId: { type: 'string' },
    quantity: { type: 'integer' },
    menuItem: menuItemSchema,
  },
} as const;

export const comboSchema = {
  type: 'object',
  required: [
    'id',
    'name',
    'description',
    'price',
    'icon',
    'isActive',
    'displayOrder',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: nullableString,
    price: { type: 'number' },
    icon: nullableString,
    isActive: { type: 'boolean' },
    displayOrder: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const comboDetailSchema = {
  type: 'object',
  allOf: [
    comboSchema,
    {
      type: 'object',
      required: ['comboItems'],
      properties: {
        comboItems: {
          type: 'array',
          items: comboItemSchema,
        },
      },
    },
  ],
} as const;

export const comboItemInputSchema = {
  type: 'object',
  required: ['menuItemId', 'quantity'],
  properties: {
    menuItemId: { type: 'string', minLength: 1 },
    quantity: { type: 'integer', minimum: 1 },
  },
} as const;

export const createComboBodySchema = {
  type: 'object',
  description: 'Payload para criacao de combo simplificado',
  required: ['name', 'price', 'comboItems'],
  properties: {
    name: { type: 'string', minLength: 2 },
    description: { type: 'string' },
    price: { type: 'number', exclusiveMinimum: 0 },
    icon: { type: 'string' },
    displayOrder: { type: 'integer', minimum: 0 },
    comboItems: {
      type: 'array',
      minItems: 1,
      items: comboItemInputSchema,
    },
  },
  examples: [
    {
      name: 'Combo Classico Plus',
      description: 'Hamburguer + batata + bebida',
      price: 34.9,
      displayOrder: 20,
      comboItems: [{ menuItemId: 'cuid-menu-item', quantity: 1 }],
    },
  ],
} as const;

export const updateComboBodySchema = {
  type: 'object',
  minProperties: 1,
  properties: createComboBodySchema.properties,
} as const;

export const orderStatusEnum = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;

export const orderAddonInputSchema = {
  type: 'object',
  required: ['addonId', 'quantity'],
  properties: {
    addonId: { type: 'string', minLength: 1 },
    quantity: { type: 'integer', minimum: 1 },
  },
} as const;

export const orderItemInputSchema = {
  type: 'object',
  required: ['quantity', 'addons'],
  oneOf: [
    {
      type: 'object',
      required: ['menuItemId', 'quantity', 'addons'],
      properties: {
        menuItemId: { type: 'string', minLength: 1 },
        quantity: { type: 'integer', minimum: 1 },
        notes: { type: 'string' },
        addons: {
          type: 'array',
          items: orderAddonInputSchema,
        },
      },
    },
    {
      type: 'object',
      required: ['comboId', 'quantity', 'addons'],
      properties: {
        comboId: { type: 'string', minLength: 1 },
        quantity: { type: 'integer', minimum: 1 },
        notes: { type: 'string' },
        addons: {
          type: 'array',
          items: orderAddonInputSchema,
        },
      },
    },
  ],
} as const;

export const createOrderBodySchema = {
  type: 'object',
  description: 'Payload de criacao de pedido',
  required: ['items'],
  properties: {
    customerName: { type: 'string' },
    customerPhone: { type: 'string' },
    notes: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      items: orderItemInputSchema,
    },
  },
  examples: [
    {
      customerName: 'Cliente Teste',
      customerPhone: '11999990000',
      notes: 'Sem cebola',
      items: [
        {
          menuItemId: 'cuid-menu-item',
          quantity: 2,
          addons: [{ addonId: 'cuid-addon', quantity: 1 }],
        },
      ],
    },
  ],
} as const;

export const listOrdersQueryOpenApiSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: orderStatusEnum },
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  },
} as const;

export const updateOrderStatusBodySchema = {
  type: 'object',
  description: 'Atualiza status de pedido dentro do fluxo permitido',
  required: ['status'],
  properties: {
    status: { type: 'string', enum: orderStatusEnum },
    reason: { type: 'string' },
  },
  examples: [{ status: 'CONFIRMED', reason: 'Pedido confirmado no balcao' }],
} as const;

export const orderItemAddonSchema = {
  type: 'object',
  required: ['id', 'orderItemId', 'addonId', 'quantity', 'addonPrice', 'addon'],
  properties: {
    id: { type: 'string' },
    orderItemId: { type: 'string' },
    addonId: { type: 'string' },
    quantity: { type: 'integer' },
    addonPrice: { type: 'number' },
    addon: addonSchema,
  },
} as const;

export const orderItemSchema = {
  type: 'object',
  required: [
    'id',
    'orderId',
    'menuItemId',
    'comboId',
    'quantity',
    'itemPrice',
    'notes',
    'addons',
    'menuItem',
    'combo',
  ],
  properties: {
    id: { type: 'string' },
    orderId: { type: 'string' },
    menuItemId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    comboId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    quantity: { type: 'integer' },
    itemPrice: { type: 'number' },
    notes: nullableString,
    addons: {
      type: 'array',
      items: orderItemAddonSchema,
    },
    menuItem: {
      anyOf: [menuItemSchema, { type: 'null' }],
    },
    combo: {
      anyOf: [comboSchema, { type: 'null' }],
    },
  },
} as const;

export const orderStatusHistorySchema = {
  type: 'object',
  required: ['id', 'orderId', 'fromStatus', 'toStatus', 'reason', 'changedAt'],
  properties: {
    id: { type: 'string' },
    orderId: { type: 'string' },
    fromStatus: { type: 'string' },
    toStatus: { type: 'string', enum: orderStatusEnum },
    reason: nullableString,
    changedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export const orderSchema = {
  type: 'object',
  required: [
    'id',
    'orderNumber',
    'status',
    'paymentStatus',
    'totalPrice',
    'discount',
    'finalPrice',
    'customerName',
    'customerPhone',
    'notes',
    'createdAt',
    'updatedAt',
    'completedAt',
    'items',
  ],
  properties: {
    id: { type: 'string' },
    orderNumber: { type: 'integer' },
    status: { type: 'string', enum: orderStatusEnum },
    paymentStatus: { type: 'string' },
    totalPrice: { type: 'number' },
    discount: { type: 'number' },
    finalPrice: { type: 'number' },
    customerName: nullableString,
    customerPhone: nullableString,
    notes: nullableString,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    completedAt: nullableDateTime,
    items: {
      type: 'array',
      items: orderItemSchema,
    },
  },
} as const;

export const orderDetailSchema = {
  type: 'object',
  allOf: [
    orderSchema,
    {
      type: 'object',
      required: ['statusHistory'],
      properties: {
        statusHistory: {
          type: 'array',
          items: orderStatusHistorySchema,
        },
      },
    },
  ],
} as const;

export const arrayDataResponse = (itemSchema: object) => ({
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'array',
      items: itemSchema,
    },
  },
});

export const dataResponse = (itemSchema: object) => ({
  type: 'object',
  required: ['data'],
  properties: {
    data: itemSchema,
  },
});
