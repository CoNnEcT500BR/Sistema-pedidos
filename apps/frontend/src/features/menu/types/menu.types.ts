export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
  imageUrl?: string;
  isAvailable: boolean;
  displayOrder?: number;
  category?: Category;
}

export interface Addon {
  id: string;
  name: string;
  addonType: 'EXTRA' | 'SUBSTITUTION' | 'REMOVAL' | 'SIZE_CHANGE';
  assignmentType?: 'ASSEMBLY' | 'BREAD' | 'EXTRA';
  price: number;
  scope?: 'BURGER' | 'BURGER_BUILD' | 'DRINK' | 'SIDE' | 'COMBO' | 'GENERAL';
  station?:
    | 'PROTEINS'
    | 'CHEESES'
    | 'VEGETABLES'
    | 'SAUCES'
    | 'DRINKS'
    | 'SIDES'
    | 'FINISHING'
    | 'GENERAL';
  priority?: 'FAST' | 'MEDIUM' | 'CRITICAL';
  description?: string;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface Combo {
  id: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
  isActive: boolean;
  displayOrder?: number;
  items?: ComboItem[];
  comboItems?: ComboItem[];
}

export interface ComboItem {
  id: string;
  comboId: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  role?: string;
}
