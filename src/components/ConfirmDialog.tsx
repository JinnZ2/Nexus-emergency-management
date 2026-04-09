import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  risk: 'low' | 'medium' | 'high';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, risk, onConfirm, onCancel }: ConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  if (!open) return null;

  const requiresTypedConfirmation = risk === 'high';
  const confirmWord = 'CONFIRM';
  const canConfirm = requiresTypedConfirmation ? confirmText === confirmWord : true;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setConfirmText('');
    onConfirm();
  };

  const handleCancel = () => {
    setConfirmText('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancel} />

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className={`p-6 border-b border-zinc-800 ${
          risk === 'high' ? 'bg-rose-500/5' : risk === 'medium' ? 'bg-amber-500/5' : 'bg-blue-500/5'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                risk === 'high' ? 'bg-rose-500/20 text-rose-500' :
                risk === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                'bg-blue-500/20 text-blue-500'
              }`}>
                {risk === 'high' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-white font-bold">{title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5 uppercase tracking-wider">
                  Risk Level: <span className={
                    risk === 'high' ? 'text-rose-500' : risk === 'medium' ? 'text-amber-500' : 'text-blue-500'
                  }>{risk}</span>
                </p>
              </div>
            </div>
            <button onClick={handleCancel} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">
            {risk === 'high'
              ? 'This is a high-risk action that may cause significant infrastructure disruption. This action cannot be easily undone.'
              : risk === 'medium'
              ? 'This action will modify infrastructure state. Verify current system health before proceeding.'
              : 'This is a routine maintenance action with minimal risk.'}
          </p>

          {requiresTypedConfirmation && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">
                Type <span className="text-rose-500 font-mono font-bold">{confirmWord}</span> to proceed:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50"
                placeholder={confirmWord}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            disabled={!canConfirm}
            className={`flex-1 ${
              risk === 'high' ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/30' :
              risk === 'medium' ? 'bg-amber-600 hover:bg-amber-700' :
              'bg-blue-600 hover:bg-blue-700'
            } text-white`}
            onClick={handleConfirm}
          >
            Execute Action
          </Button>
        </div>
      </div>
    </div>
  );
}
