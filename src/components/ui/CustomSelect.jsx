import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  searchable = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter(o => o.label?.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const getTypeColor = (type) => {
    switch (type) {
      case 'income': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'expense': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'savings': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case 'investment': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 bg-background border rounded-xl text-xs font-medium text-foreground transition-all duration-200 ${
          isOpen ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.color && (
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: selectedOption.color }} />
          )}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          {selectedOption?.type && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono capitalize border ${getTypeColor(selectedOption.type)}`}>
              {selectedOption.type}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* DROPDOWN POPUP MENU */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {searchable && options.length > 5 && (
            <div className="p-1.5 border-b border-border/60 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">No options found</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.color && (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: opt.color }} />
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.type && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono capitalize border ${getTypeColor(opt.type)}`}>
                          {opt.type}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
