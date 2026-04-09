
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DeploymentMetric } from '@/types';
import { Server, Cpu, Database, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockData: DeploymentMetric[] = [
  { id: '1', service: 'API Gateway', status: 'healthy', latency: 45, cpu: 12, memory: 450, timestamp: '10:00' },
  { id: '2', service: 'Auth Service', status: 'healthy', latency: 12, cpu: 8, memory: 210, timestamp: '10:05' },
  { id: '3', service: 'Data Processor', status: 'warning', latency: 120, cpu: 85, memory: 1200, timestamp: '10:10' },
  { id: '4', service: 'Storage Engine', status: 'healthy', latency: 8, cpu: 25, memory: 3400, timestamp: '10:15' },
];

const chartData = [
  { time: '00:00', load: 400 },
  { time: '04:00', load: 300 },
  { time: '08:00', load: 600 },
  { time: '12:00', load: 800 },
  { time: '16:00', load: 500 },
  { time: '20:00', load: 450 },
  { time: '23:59', load: 400 },
];

export default function TRDAPDashboard() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">TRDAP Analysis</h2>
          <p className="text-zinc-400 mt-1">Technical Resource Deployment and Analysis Platform</p>
        </div>
        <Badge variant="outline" className="text-orange-500 border-orange-500/20 bg-orange-500/5 px-3 py-1">
          Live Sync Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Services" value="24" icon={Server} trend="+2" />
        <MetricCard title="Avg Latency" value="32ms" icon={Activity} trend="-4ms" />
        <MetricCard title="CPU Usage" value="42%" icon={Cpu} trend="+5%" />
        <MetricCard title="Memory Load" value="68%" icon={Database} trend="+1%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">System Load Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area type="monotone" dataKey="load" stroke="#f97316" fillOpacity={1} fill="url(#colorLoad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm font-medium uppercase tracking-wider opacity-50 italic">Service Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockData.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/50">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{service.service}</p>
                  <p className="text-xs text-zinc-500 font-mono">{service.latency}ms latency</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "capitalize",
                    service.status === 'healthy' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                    service.status === 'warning' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                    "text-rose-500 border-rose-500/20 bg-rose-500/5"
                  )}
                >
                  {service.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.startsWith('+') ? "text-emerald-500 bg-emerald-500/5" : "text-rose-500 bg-rose-500/5"
          )}>
            {trend}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
