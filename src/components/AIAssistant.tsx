import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, Layers, RadioTower } from 'lucide-react';
import { ChatMessage } from '@/types';
import { RUNBOOK_REVISION, BASE_LAYER_PATH } from '@/lib/runbook';
import {
  baseLayerResponse,
  probeEnhancement,
  requestEnhancement,
  type EnhancementState,
} from '@/services/gemini';

const PROVIDER_LABELS: Record<string, string> = {
  base: 'Base layer',
  gemini: 'Gemini',
  claude: 'Claude',
  openai: 'OpenAI',
  unknown: 'Provider',
};

const PROVIDER_COLORS: Record<string, string> = {
  base: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
  gemini: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
  claude: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
  openai: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  unknown: 'text-zinc-400 border-zinc-400/20 bg-zinc-400/5',
};

/**
 * Order: base layer first, always, synchronously. Enhancement only if the last
 * probe said a provider is reachable, and only as an addition. No polling
 * loop, no retry loop, no blocking banner.
 */
export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      layer: 'base',
      provider: 'base',
      content: `Base layer active (runbook rev ${RUNBOOK_REVISION}). Every question is answered from the offline runbook first. If an AI provider is reachable it adds to that answer; if not, the runbook answer stands.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhancement, setEnhancement] = useState<EnhancementState>({ reachable: null, providers: [], checkedAt: null });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // One probe on mount, one more when the browser says it came back online. No interval.
  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      const state = await probeEnhancement();
      if (!cancelled) setEnhancement(state);
    };
    probe();
    window.addEventListener('online', probe);
    return () => {
      cancelled = true;
      window.removeEventListener('online', probe);
    };
  }, []);

  const handleProbe = async () => {
    setEnhancement(await probeEnhancement());
  };

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || enhancing) return;

    setInput('');
    const base = baseLayerResponse(prompt);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: prompt },
      { role: 'assistant', content: base.content, layer: 'base', provider: 'base' },
    ]);

    if (enhancement.reachable !== true) return;

    setEnhancing(true);
    const context = 'TRDAP shows 24 services, avg latency 32ms. Orbital-Phycom reports stable gravity but minor drag on Global DB node.';
    const extra = await requestEnhancement(prompt, context, base);
    setEnhancing(false);

    if (extra) {
      setMessages((prev) => [...prev, { role: 'assistant', content: extra.content, layer: 'enhancement', provider: extra.provider }]);
    } else {
      // Silent: the base answer is already on screen. Chip updates, nothing blocks.
      setEnhancement((s) => ({ ...s, reachable: false, checkedAt: new Date().toISOString() }));
    }
  };

  const enhancementLabel =
    enhancement.reachable === null ? 'not probed'
    : enhancement.reachable ? enhancement.providers.map((p) => PROVIDER_LABELS[p] || p).join(' -> ')
    : 'not reachable';

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Assistant <Sparkles className="text-orange-500 w-6 h-6" />
          </h2>
          <p className="text-zinc-400 mt-1">Base layer first. Enhancement when reachable.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={PROVIDER_COLORS.base}>
            <Layers className="w-3 h-3 mr-1" /> base rev {RUNBOOK_REVISION}
          </Badge>
          <Badge variant="outline" className={enhancement.reachable ? PROVIDER_COLORS.gemini : PROVIDER_COLORS.unknown}>
            <RadioTower className="w-3 h-3 mr-1" /> enhancement: {enhancementLabel}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleProbe} className="text-xs">
            Probe
          </Button>
        </div>
      </div>

      <div className="mb-4 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center gap-2 text-xs">
        <span className="text-emerald-500 font-medium">base layer ({BASE_LAYER_PATH})</span>
        <span className="text-zinc-700">-&gt;</span>
        <span className={enhancement.reachable ? 'text-orange-500' : 'text-zinc-600'}>
          enhancement{enhancement.reachable ? '' : ' (not in use)'}
        </span>
        <span className="text-zinc-600 ml-auto">
          {enhancement.checkedAt ? `probed ${new Date(enhancement.checkedAt).toLocaleTimeString('en-US', { hour12: false })}` : ''}
        </span>
      </div>

      <Card className="flex-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant'
                      ? msg.layer === 'enhancement' ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'assistant'
                      ? 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                      : 'bg-orange-500 text-white rounded-tr-none'
                  }`}>
                    {msg.role === 'assistant' && (
                      <p className="text-[10px] uppercase tracking-wider mb-2 text-zinc-500">
                        {msg.layer === 'enhancement' ? `enhancement · ${PROVIDER_LABELS[msg.provider || 'unknown'] || msg.provider}` : 'base layer'}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {enhancing && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none text-xs text-zinc-500">
                    enhancement pending. The base answer above stands regardless.
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
                placeholder="Describe the situation: outage, drift, gateway, pipeline..."
                className="bg-zinc-950 border-zinc-800 text-white focus:ring-orange-500"
              />
              <Button onClick={handleSend} disabled={enhancing} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
