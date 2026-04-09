
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TRDAPDashboard from './components/TRDAPDashboard';
import OrbitalPhycom from './components/OrbitalPhycom';
import AIAssistant from './components/AIAssistant';
import EmergencyManagement from './components/EmergencyManagement';
import AgentProtocol from './components/AgentProtocol';
import ICSCommand from './components/ICSCommand';

export default function App() {
  const [activeTab, setActiveTab] = useState('trdap');

  return (
    <div className="dark flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

        <div className="relative h-full overflow-y-auto">
          {activeTab === 'trdap' && <TRDAPDashboard />}
          {activeTab === 'orbital' && <OrbitalPhycom />}
          {activeTab === 'emergency' && <EmergencyManagement />}
          {activeTab === 'ics' && <ICSCommand />}
          {activeTab === 'protocol' && <AgentProtocol />}
          {activeTab === 'assistant' && <AIAssistant />}
        </div>
      </main>
    </div>
  );
}
