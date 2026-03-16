export interface ICategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface IMenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface IAddon {
  id: string;
  name: string;
  addonType: 'EXTRA' | 'SUBSTITUTION' | 'REMOVAL' | 'SIZE_CHANGE';
  price: number;
  description?: string;
  isActive: boolean;
}

export interface ICombo {
  id: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
  isActive: boolean;
}
