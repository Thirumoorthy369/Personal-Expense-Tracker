import React, { useState } from 'react';
import { useWorkspaceData } from '../../hooks/useWorkspaceData';
import { useWorkspace } from '../../context/WorkspaceContext';
import { storageApi } from '../../lib/storage';
import { todayISO } from '../../lib/finance';
import { X, Upload, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

export function ImportTransactionsDialog({ onClose, onSuccess }) {
  const { activeWorkspace } = useWorkspace();
  const { accounts, categories, refetch } = useWorkspaceData();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  
  // Column Mappings
  const [mapping, setMapping] = useState({
    date: '',
    amount: '',
    payee: '',
    type: '',
    notes: ''
  });

  const [defaultAccount, setDefaultAccount] = useState(accounts[0]?.id || '');
  const [defaultCategory, setDefaultCategory] = useState(categories[0]?.id || '');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [resultCount, setResultCount] = useState(0);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) throw new Error('CSV file must contain a header and at least 1 data row');

        const rawHeaders = lines[0].split(',').map(h => h.replace(/^"(.*)"$/, '$1').trim());
        setHeaders(rawHeaders);

        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.replace(/^"(.*)"$/, '$1').trim());
          const rowObj = {};
          rawHeaders.forEach((h, idx) => {
            rowObj[h] = vals[idx] || '';
          });
          return rowObj;
        });

        setParsedRows(rows);

        // Auto guess mapping
        const autoMap = { ...mapping };
        rawHeaders.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('date')) autoMap.date = h;
          if (lower.includes('amount') || lower.includes('inr') || lower.includes('val')) autoMap.amount = h;
          if (lower.includes('payee') || lower.includes('description') || lower.includes('merchant')) autoMap.payee = h;
          if (lower.includes('type')) autoMap.type = h;
          if (lower.includes('note') || lower.includes('memo')) autoMap.notes = h;
        });
        setMapping(autoMap);

        setStep(2);
      } catch (err) {
        setError(err.message || 'Error parsing CSV file');
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleExecuteImport = async () => {
    if (!mapping.date || !mapping.amount) {
      return setError('Please map at least Date and Amount columns.');
    }

    setImporting(true);
    setError(null);

    try {
      let imported = 0;
      for (const row of parsedRows) {
        const amtStr = row[mapping.amount];
        const numAmt = Math.abs(parseFloat(amtStr) || 0);
        if (!numAmt) continue;

        let txType = 'expense';
        if (mapping.type && row[mapping.type]) {
          const tVal = row[mapping.type].toLowerCase();
          if (tVal.includes('inc') || tVal.includes('credit')) txType = 'income';
        }

        const dateStr = row[mapping.date] || todayISO();

        const tx = {
          workspace_id: activeWorkspace.id,
          account_id: defaultAccount,
          category_id: defaultCategory,
          amount: numAmt,
          transaction_type: txType,
          status: 'completed',
          date: dateStr.length === 10 ? dateStr : todayISO(),
          payee: mapping.payee ? row[mapping.payee] : 'CSV Import Item',
          notes: mapping.notes ? row[mapping.notes] : 'Bulk CSV Imported',
          tags: ['#csv-import']
        };

        await storageApi.saveTransaction(tx);
        imported++;
      }

      setResultCount(imported);
      await refetch();
      setStep(3);
    } catch (err) {
      setError(err.message || 'Error importing transactions');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h2 className="text-base font-heading font-semibold text-foreground">Import CSV Ledger</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && <div className="p-3 rounded-xl bg-destructive/10 text-destructive">{error}</div>}

          {step === 1 && (
            <div className="space-y-4 text-center py-6 border-2 border-dashed border-border rounded-2xl">
              <Upload className="w-10 h-10 mx-auto text-primary" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Upload CSV Ledger File</p>
                <p className="text-muted-foreground text-[11px]">CSV should contain headers like Date, Amount, Payee, etc.</p>
              </div>
              <input
                type="file"
                accept=".csv"
                id="csvInput"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="csvInput"
                className="inline-block px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
              >
                Browse CSV File
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-xl">
                <span className="font-semibold text-foreground">CSV Parsed: {parsedRows.length} Rows</span>
                <span className="font-mono text-muted-foreground">{file?.name}</span>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-foreground">Map CSV Columns</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground">Date Column *</label>
                    <CustomSelect
                      options={headers.map(h => ({ value: h, label: h }))}
                      value={mapping.date}
                      onChange={(val) => setMapping({ ...mapping, date: val })}
                      placeholder="Select Date..."
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Amount Column *</label>
                    <CustomSelect
                      options={headers.map(h => ({ value: h, label: h }))}
                      value={mapping.amount}
                      onChange={(val) => setMapping({ ...mapping, amount: val })}
                      placeholder="Select Amount..."
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Payee Column</label>
                    <CustomSelect
                      options={[{ value: '', label: '(Optional)' }, ...headers.map(h => ({ value: h, label: h }))]}
                      value={mapping.payee}
                      onChange={(val) => setMapping({ ...mapping, payee: val })}
                      placeholder="Select Payee..."
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground">Type Column</label>
                    <CustomSelect
                      options={[{ value: '', label: '(Optional)' }, ...headers.map(h => ({ value: h, label: h }))]}
                      value={mapping.type}
                      onChange={(val) => setMapping({ ...mapping, type: val })}
                      placeholder="Select Type..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div>
                  <label className="font-semibold text-foreground">Target Account</label>
                  <CustomSelect
                    options={accounts.map(a => ({ value: a.id, label: a.name }))}
                    value={defaultAccount}
                    onChange={setDefaultAccount}
                    placeholder="Select Account..."
                    searchable
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">Default Category</label>
                  <CustomSelect
                    options={categories.map(c => ({ value: c.id, label: c.name, type: c.type, color: c.color }))}
                    value={defaultCategory}
                    onChange={setDefaultCategory}
                    placeholder="Select Category..."
                    searchable
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-xl hover:bg-muted">Back</button>
                <button
                  onClick={handleExecuteImport}
                  disabled={importing}
                  className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl"
                >
                  {importing ? 'Importing...' : `Import ${parsedRows.length} Items`}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Import Complete!</h3>
                <p className="text-muted-foreground">{resultCount} transactions imported & account balances reconciled.</p>
              </div>
              <button
                onClick={() => { onSuccess?.(); onClose(); }}
                className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
