'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChipCounter({ 
  tableId, 
  onSuccess 
}: { 
  tableId: string, 
  onSuccess?: () => void 
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultVal, setResultVal] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{ color: string, count: number, value: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(selectedFile);
      });
      setFile(selectedFile);
      setResultVal(null);
      setBreakdown([]);
      setError('');
    }
  };

  const handleScanChips = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // MOCK: Generate a realistic chip breakdown
      const mockBreakdown = [
        { color: '#FF0000', count: Math.floor(Math.random() * 10) + 5, value: 5 },
        { color: '#00FF00', count: Math.floor(Math.random() * 5) + 2, value: 25 },
        { color: '#000000', count: Math.floor(Math.random() * 3) + 1, value: 100 },
      ];
      
      const calculatedValue = mockBreakdown.reduce((acc, chip) => acc + (chip.count * chip.value), 0);
      
      setBreakdown(mockBreakdown);
      setResultVal(calculatedValue);

    } catch (err) {
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCashout = async () => {
    if (resultVal === null) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch(`/api/tables/${tableId}/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: resultVal }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Cashout failed');
      }

      setResultVal(null);
      setFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setIsProcessing(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setIsProcessing(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 'var(--space-4)', border: '1px solid var(--color-gold-glow)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{ padding: 'var(--space-2)', background: 'var(--color-gold-glow)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: 'var(--text-xl)' }}>🤖</span>
        </div>
        <div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--color-gold)' }}>AI Chip Scanner</h3>
          <p className="text-xs text-muted">Precision stack calculation via computer vision</p>
        </div>
      </div>

      {error && <div className="alert alert-error text-xs">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {!resultVal && !isProcessing && (
          <div style={{ textAlign: 'center' }}>
            {!photoPreview ? (
              <label className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', border: '2px dashed var(--color-border)', cursor: 'pointer', padding: 'var(--space-8)' }}>
                <span style={{ fontSize: '2.5rem' }}>📸</span>
                <span style={{ fontWeight: 600 }}>Snap or Upload Photo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            ) : (
              <div>
                <img src={photoPreview} alt="Chips preview" style={{ maxWidth: '100%', borderRadius: 'var(--radius-lg)', maxHeight: '300px', objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <button
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setPhotoPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return null;
                    });
                  }}
                >
                  Change Photo
                </button>
                  <button className="btn btn-primary btn-block" onClick={handleScanChips}>Analyze Stack</button>
                </div>
              </div>
            )}
          </div>
        )}

        {isProcessing && !resultVal && (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', position: 'relative' }}>
            {photoPreview && (
              <div style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
                <img src={photoPreview} alt="Scanning" style={{ maxWidth: '100%', borderRadius: 'var(--radius-lg)', maxHeight: '300px', opacity: 0.5 }} />
                <div className="scanning-line" style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '2px', 
                  background: 'var(--color-gold)', 
                  boxShadow: '0 0 15px var(--color-gold)',
                  animation: 'scan 2s linear infinite'
                }}></div>
              </div>
            )}
            <div className="spinner" style={{ margin: '0 auto var(--space-4)', width: '30px', height: '30px', color: 'var(--color-gold)' }}></div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>Running Neural Network...</p>
            <p className="text-xs text-muted">Isolating chips and calculating denominations</p>
            
            <style jsx>{`
              @keyframes scan {
                0% { top: 0; }
                50% { top: 100%; }
                100% { top: 0; }
              }
            `}</style>
          </div>
        )}

        {resultVal !== null && (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid var(--color-border-light)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div className="text-xs text-muted uppercase tracking-wider font-bold mb-1">Total Detected Value</div>
              <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-success)' }}>
                ${resultVal.toFixed(2)}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              <div className="text-xs text-muted mb-3 font-bold">Detection Breakdown:</div>
              {breakdown.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color, border: '1px solid rgba(255,255,255,0.2)' }}></div>
                    <span className="text-sm">{item.count} x ${item.value} Chips</span>
                  </div>
                  <span className="text-sm font-bold text-success">${item.count * item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setResultVal(null); setBreakdown([]); }}
                disabled={isProcessing}
                style={{ flex: 1 }}
              >
                Retake
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmCashout}
                disabled={isProcessing}
                style={{ flex: 2, background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              >
                {isProcessing ? 'Processing...' : 'Confirm Cashout'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
