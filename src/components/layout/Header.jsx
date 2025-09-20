import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Gamepad2, Trophy, BarChart, ListOrdered, ScrollText, UserCog, LogOut, User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const navItems = [
  { to: '/', icon: Gamepad2, label: 'Sākums' },
  { to: '/predict', icon: Trophy, label: 'Prognozēt' },
  { to: '/games', icon: ListOrdered, label: 'Spēles' },
  { to: '/statistics', icon: BarChart, label: 'Statistika' },
  { to: '/top', icon: Trophy, label: 'Tops' },
  { to: '/rules', icon: ScrollText, label: 'Noteikumi' },
];

const adminNavItem = { to: '/admin', icon: UserCog, label: 'Admin' };

const Header = () => {
  const { signOut, user } = useSupabaseAuth();
  const isAdmin = user?.role === 'admin';

  const allNavItems = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <header className="sticky top-4 mx-auto max-w-7xl w-[calc(100%-2rem)] z-50">
      <nav className="glass-card flex items-center justify-between p-2">
        {/* Kreisā puse: navigācijas pogas */}
        <div className="flex items-center gap-2">
          {allNavItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`text-white hover:bg-white/20 ${
                    isActive ? 'bg-white/30' : ''
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              )}
            </NavLink>
          ))}
        </div>

        {/* Labā puse: Profils un Iziet */}
        <div className="flex items-center gap-2">
          <NavLink to="/profile">
            {({ isActive }) => (
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={`text-white hover:bg-white/20 ${
                  isActive ? 'bg-white/30' : ''
                }`}
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
