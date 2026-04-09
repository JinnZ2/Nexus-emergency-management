
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/types';
import { getInfrastructureAssistance } from '@/services/gemini';

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am your Nexus Infrastructure Assistant. I have access to TRDAP metrics and Orbital-Phycom telemetry. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Mock context for Gemini
    const context = "TRDAP shows 24 services, avg latency 32ms. Orbital-Phycom reports stable gravity but minor drag on Global DB node.";
    
    const response = await getInfrastructureAssistance(input, context);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            AI Assistant <Sparkles className="text-orange-500 w-6 h-6" />
          </h2>
          <p className="text-zinc-400 mt-1">Intelligent Infrastructure Support</p>
        </div>
        <Badge variant="outline" className="text-orange-500 border-orange-500/20 bg-orange-500/5">
          Gemini 3 Flash
        </Badge>
      </div>

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
                placeholder="Ask about deployment health or orbital telemetry..."
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
