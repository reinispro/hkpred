import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Gamepad2, Trophy, BarChart, ListOrdered, ScrollText, UserCog, LogOut, User 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-8 w-8 text-white" />
          <span className="font-bold text-xl text-white hidden sm:inline">
            Predicto
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-2">
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

        {/* User dropdown (Profile + Logout) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer border border-white/30">
              <AvatarFallback className="bg-cyan-600 text-white">
                {user?.email?.charAt(0).toUpperCase() || <User size={16} />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="glass-card text-white border-white/20"
          >
            <DropdownMenuItem asChild>
              <NavLink to="/profile" className="flex items-center gap-2">
                <User size={16} /> Profils
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={signOut}
              className="flex items-center gap-2 text-red-400 focus:text-red-500"
            >
              <LogOut size={16} /> Iziet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
};

export default Header;
