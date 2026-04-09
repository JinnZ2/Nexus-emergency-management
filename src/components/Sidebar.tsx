
import React from 'react';
import { LayoutDashboard, Orbit, MessageSquare, Settings, Activity, ShieldAlert, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'trdap', label: 'TRDAP Analysis', icon: LayoutDashboard },
    { id: 'orbital', label: 'Orbital Monitoring', icon: Orbit },
    { id: 'emergency', label: 'Emergency Mgmt', icon: ShieldAlert },
    { id: 'protocol', label: 'Agent Protocol', icon: Code },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <Activity className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">NEXUS</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              activeTab === item.id 
                ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-zinc-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
