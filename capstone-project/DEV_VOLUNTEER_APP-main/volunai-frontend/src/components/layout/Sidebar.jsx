import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  MessageSquare, 
  Bell, 
  LogOut, 
  Settings,
  Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ role }) => {
  const { logout, user } = useAuth();

  const menuItems = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { id: 'requests', label: 'Requests', icon: ClipboardList, path: '/admin/requests' },
      { id: 'volunteers', label: 'Volunteers', icon: Users, path: '/admin/volunteers' },
      { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/admin/chat' },
    ],
    volunteer: [
      { id: 'dashboard', label: 'My Tasks', icon: LayoutDashboard, path: '/volunteer' },
      { id: 'available', label: 'New Requests', icon: ClipboardList, path: '/volunteer/available' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/volunteer/notifications' },
    ],
    member: [
      { id: 'dashboard', label: 'My Requests', icon: LayoutDashboard, path: '/user' },
      { id: 'new-request', label: 'Create Request', icon: ClipboardList, path: '/user/create' },
      { id: 'chat', label: 'Chat with Admin', icon: MessageSquare, path: '/user/chat' },
    ]
  };

  const navItems = menuItems[role] || [];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">
              VolunAI
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
              Community Sync
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === `/${role}`}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'}
            `}
          >
            <item.icon size={20} className="transition-transform group-hover:scale-110" />
            <span className="font-semibold text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile */}
      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
                {user?.name?.charAt(0) || 'U'}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.role?.toUpperCase() || 'Member'}</p>
             </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-sm font-bold"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 text-slate-500">
           <button className="hover:text-indigo-400 transition-colors"><Settings size={18} /></button>
           <button className="hover:text-indigo-400 transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900" />
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
