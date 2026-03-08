export interface IUser {
  id: string;
  email: string;
  role: 'STAFF' | 'ADMIN';
  name?: string;
  isActive: boolean;
}
