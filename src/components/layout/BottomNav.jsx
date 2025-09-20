// /src/components/layout/BottomNav.jsx
import { NavLink } from "react-router-dom";
import { Home, Gamepad2, BarChart2, Trophy, Info } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/predict", label: "Predict", icon: Gamepad2 },
  { to: "/statistics", label: "Stats", icon: BarChart2 },
  { to: "/top", label: "Top", icon: Trophy },
  { to: "/rules", label: "Rules", icon: Info },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md border-t border-white/10 flex justify-around py-2 md:hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs ${
              isActive ? "text-cyan-400" : "text-gray-300"
            }`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
