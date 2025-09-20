import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gamepad2, Trophy, BarChart, ListOrdered, ScrollText, UserCog, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const navItems = [
  { to: '/', label: 'Sākums' },
  { to: '/predict', label: 'Prognozēt' },
  { to: '/games', label: 'Spēles' },
  { to: '/statistics', label: 'Statistika' },
  { to: '/top', label: 'Tops' },
  { to: '/rules', label: 'Noteikumi' },
];

const adminNavItem = { to: '/admin', label: 'Admin' };

const Header = () => {
  const { signOut, user } = useSupabaseAuth();
  const isAdmin = user?.role === 'admin';

  const allNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <header className="sticky top-4 mx-auto max-w-7xl w-[calc(100%-2rem)] z-50">
      <nav className="glass-card flex items-center justify-between p-2">
        {/* 🔹 Logo sadaļa */}
        <div className="flex items-center gap-2 mr-4">
          <Gamepad2 className="h-8 w-8 text-white" />
          <span className="font-bold text-xl text-white hidden sm:inline">OGsports</span>
        </div>

        {/* 🔹 Navigācijas pogas */}
        <div className="flex items-center gap-2">
          {allNavItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`text-white hover:bg-white/20 ${isActive ? 'bg-white/30' : ''}`}
                >
                  {item.label}
                </Button>
              )}
            </NavLink>
          ))}
        </div>

        {/* 🔹 Profils un Iziet */}
        <div className="flex items-center gap-2">
          <NavLink to="/profile">
            {({ isActive }) => (
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={`text-white hover:bg-white/20 ${isActive ? 'bg-white/30' : ''}`}
              >
                <User className="mr-2 h-4 w-4" />
                Profils
              </Button>
            )}
          </NavLink>
          <Button
            onClick={signOut}
            variant="ghost"
            className="text-white hover:bg-red-500/50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Iziet
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
