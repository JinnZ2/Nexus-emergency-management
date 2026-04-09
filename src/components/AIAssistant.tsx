
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { ChatMessage } from '@/types';
import { getInfrastructureAssistance, checkProviderHealth } from '@/services/gemini';

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  claude: 'Claude',
  openai: 'OpenAI',
  offline_runbook: 'Offline Runbook',
  unknown: 'AI Provider',
};

const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
  claude: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
  openai: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
  offline_runbook: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
  unknown: 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5',
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am your Nexus Infrastructure Assistant. I work with whatever AI provider is available — Gemini, Claude, OpenAI — and can fall back to offline emergency runbooks if all services are down. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>('unknown');
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check provider health on mount and periodically
  useEffect(() => {
    const check = async () => {
      const health = await checkProviderHealth();
      if (health) {
        setAvailableProviders(health.activeProviders);
        setIsOffline(false);
        if (activeProvider === 'unknown' && health.activeProviders.length > 0) {
          setActiveProvider(health.activeProviders[0]);
        }
      } else {
        setIsOffline(true);
        setActiveProvider('offline_runbook');
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const context = "TRDAP shows 24 services, avg latency 32ms. Orbital-Phycom reports stable gravity but minor drag on Global DB node.";

    const result = await getInfrastructureAssistance(input, context);

    // Track provider transitions
    if (result.provider !== activeProvider) {
      const prevLabel = PROVIDER_LABELS[activeProvider] || activeProvider;
      const newLabel = PROVIDER_LABELS[result.provider] || result.provider;
      if (activeProvider !== 'unknown') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `[Provider switched: ${prevLabel} -> ${newLabel}]`,
        }]);
      }
      setActiveProvider(result.provider);
      setIsOffline(result.isOfflineFallback);
    }

    setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
    setIsLoading(false);
  };

  const handleRetryProviders = async () => {
    const health = await checkProviderHealth();
    if (health && health.activeProviders.length > 0) {
      setAvailableProviders(health.activeProviders);
      setIsOffline(false);
      setActiveProvider(health.activeProviders[0]);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Providers reconnected! Now using ${PROVIDER_LABELS[health.activeProviders[0]] || health.activeProviders[0]}. ${health.activeProviders.length > 1 ? `Failover chain: ${health.activeProviders.map(p => PROVIDER_LABELS[p] || p).join(' -> ')}` : ''}`,
      }]);
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '[OFFLINE MODE] No AI providers available. Continuing with offline runbook matching.',
      }]);
    }
  };

  const providerColor = PROVIDER_COLORS[activeProvider] || PROVIDER_COLORS.unknown;
  const providerLabel = PROVIDER_LABELS[activeProvider] || activeProvider;

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            AI Assistant <Sparkles className="text-orange-500 w-6 h-6" />
          </h2>
          <p className="text-zinc-400 mt-1">Intelligent Infrastructure Support</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Available providers indicator */}
          <div className="flex items-center gap-1.5">
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-rose-500" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-500" />
            )}
            <span className="text-xs text-zinc-500">
              {availableProviders.length > 0
                ? `${availableProviders.length} provider${availableProviders.length > 1 ? 's' : ''}`
                : 'offline'}
            </span>
          </div>
          {/* Active provider badge */}
          <Badge variant="outline" className={providerColor}>
            {providerLabel}
          </Badge>
          {/* Retry button when offline */}
          {isOffline && (
            <Button variant="outline" size="sm" onClick={handleRetryProviders} className="gap-1.5 text-xs">
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
          )}
        </div>
      </div>

      {/* Failover chain display */}
      {availableProviders.length > 1 && (
        <div className="mb-4 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center gap-2">
          <span className="text-xs text-zinc-500">Failover chain:</span>
          {availableProviders.map((p, i) => (
            <React.Fragment key={p}>
              <span className={`text-xs font-medium ${p === activeProvider ? 'text-orange-500' : 'text-zinc-500'}`}>
                {PROVIDER_LABELS[p] || p}
              </span>
              {i < availableProviders.length - 1 && <span className="text-zinc-700 text-xs">-&gt;</span>}
            </React.Fragment>
          ))}
          <span className="text-zinc-700 text-xs">-&gt;</span>
          <span className="text-xs text-zinc-600">Offline Runbook</span>
        </div>
      )}

      <Card className="flex-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'assistant'
                      ? 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                      : 'bg-orange-500 text-white rounded-tr-none'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex gap-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isOffline ? "Ask about emergency procedures (offline mode)..." : "Ask about deployment health or orbital telemetry..."}
                className="bg-zinc-950 border-zinc-800 text-white focus:ring-orange-500"
              />
              <Button onClick={handleSend} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
