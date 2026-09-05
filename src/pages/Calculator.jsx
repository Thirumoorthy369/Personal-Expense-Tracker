import React, { useState, useEffect, useCallback } from 'react';
import { evaluateExpression } from '../lib/bodmasEvaluator';
import { Calculator as CalcIcon, Delete, RefreshCw, Equal } from 'lucide-react';

export function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCalculate = useCallback(() => {
    if (!expression.trim()) return;
    const evalRes = evaluateExpression(expression);
    if (evalRes.error) {
      setError(evalRes.error);
      setResult(null);
    } else {
      setResult(evalRes.result);
      setError(null);
    }
  }, [expression]);

  const handleAppend = (char) => {
    setError(null);
    setExpression(prev => prev + char);
  };

  const handleBackspace = () => {
    setError(null);
    setExpression(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setExpression('');
    setResult(null);
    setError(null);
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent browser shortcuts for keys we catch
      if (['0','1','2','3','4','5','6','7','8','9','+','-','*','/','(',')','%','.','='].includes(e.key)) {
        e.preventDefault();
        if (e.key === '=') {
          handleCalculate();
        } else {
          handleAppend(e.key);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCalculate]);

  const buttons = [
    [
      { label: 'C', action: handleClear, className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold' },
      { label: '(', action: () => handleAppend('('), className: 'bg-muted' },
      { label: ')', action: () => handleAppend(')'), className: 'bg-muted' },
      { label: '%', action: () => handleAppend('%'), className: 'bg-primary/10 text-primary font-bold' }
    ],
    [
      { label: '7', action: () => handleAppend('7'), className: 'bg-card' },
      { label: '8', action: () => handleAppend('8'), className: 'bg-card' },
      { label: '9', action: () => handleAppend('9'), className: 'bg-card' },
      { label: '÷', action: () => handleAppend('/'), className: 'bg-primary/10 text-primary font-bold' }
    ],
    [
      { label: '4', action: () => handleAppend('4'), className: 'bg-card' },
      { label: '5', action: () => handleAppend('5'), className: 'bg-card' },
      { label: '6', action: () => handleAppend('6'), className: 'bg-card' },
      { label: '×', action: () => handleAppend('*'), className: 'bg-primary/10 text-primary font-bold' }
    ],
    [
      { label: '1', action: () => handleAppend('1'), className: 'bg-card' },
      { label: '2', action: () => handleAppend('2'), className: 'bg-card' },
      { label: '3', action: () => handleAppend('3'), className: 'bg-card' },
      { label: '−', action: () => handleAppend('-'), className: 'bg-primary/10 text-primary font-bold' }
    ],
    [
      { label: '0', action: () => handleAppend('0'), className: 'bg-card' },
      { label: '.', action: () => handleAppend('.'), className: 'bg-card' },
      { label: '⌫', action: handleBackspace, className: 'bg-muted' },
      { label: '+', action: () => handleAppend('+'), className: 'bg-primary/10 text-primary font-bold' }
    ]
  ];

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* HEADER */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center space-y-1">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-1">
          <CalcIcon className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-heading font-bold text-foreground">BODMAS Financial Calculator</h1>
        <p className="text-xs text-muted-foreground">Deterministic recursive-descent evaluator with physical keyboard support</p>
      </div>

      {/* DISPLAY SCREEN - HIGH CONTRAST NEON FINANCIAL TERMINAL */}
      <div className="bg-slate-950 dark:bg-black border-2 border-emerald-500/50 rounded-2xl p-6 space-y-3 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="min-h-[4rem] text-right flex flex-col justify-end space-y-1 relative z-10">
          <p className="text-sm sm:text-base font-mono text-emerald-400/90 dark:text-emerald-400 break-all tracking-wider font-semibold">
            {expression || '0'}
          </p>
          {error ? (
            <p className="text-sm font-mono text-rose-400 font-bold pt-1">{error}</p>
          ) : result !== null ? (
            <p className="text-3xl sm:text-4xl font-bold font-mono text-emerald-300 dark:text-emerald-300 drop-shadow-lg pt-1">
              = {typeof result === 'number' ? result.toLocaleString('en-IN') : result}
            </p>
          ) : null}
        </div>

        {/* BUTTON GRID */}
        <div className="grid grid-cols-4 gap-2.5 pt-4 border-t border-emerald-500/30">
          {buttons.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              {row.map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className={`h-14 rounded-xl border border-border/80 text-base font-mono font-bold hover:border-emerald-500 active:scale-95 transition-all shadow-sm flex items-center justify-center ${
                    btn.className.includes('bg-card') ? 'bg-card text-foreground hover:bg-emerald-500/10' : btn.className
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* EQUAL CALCULATE BUTTON */}
        <button
          onClick={handleCalculate}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
        >
          <Equal className="w-5 h-5" />
          <span>Calculate (Enter / =)</span>
        </button>
      </div>
    </div>
  );
}
