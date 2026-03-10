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
  category?: Category;
}

export interface Addon {
  id: string;
  name: string;
  addonType: 'EXTRA' | 'SUBSTITUTION' | 'REMOVAL';
  price: number;
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
