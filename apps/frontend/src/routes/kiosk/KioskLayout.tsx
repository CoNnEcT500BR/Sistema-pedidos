import { Outlet } from 'react-router-dom';

export function KioskLayout() {
  return (
    <div className="relative min-h-screen">
      <Outlet />
    </div>
  );
}
