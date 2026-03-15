'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function QRScanner({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState('');
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let controls: { stop: () => void } | null = null;

    const start = async () => {
      try {
        // Explicitly request camera permission first so the browser shows the prompt
        // Try rear camera first, fall back to any camera
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
          .then(stream => stream.getTracks().forEach(t => t.stop()));

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Try rear camera, fall back to any available camera
        const controls1 = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current!,
          (result, err) => {
            if (result && !scanned) {
              const text = result.getText();
              let tablePath: string | null = null;
              try {
                const url = new URL(text);
                const match = url.pathname.match(/^\/tables\/[a-zA-Z0-9\-]+$/);
                if (match) tablePath = url.pathname;
              } catch {
                const match = text.match(/^\/tables\/[a-zA-Z0-9\-]+$/);
                if (match) tablePath = text;
              }
              if (tablePath) {
                setScanned(true);
                controls1?.stop();
                onClose();
                router.push(tablePath);
              } else {
                setError('QR code is not a PokerPay table. Please scan a valid table QR code.');
              }
            }
          }
        ).catch(async () => {
          // Rear camera not available — try any camera
          return reader.decodeFromConstraints(
            { video: true },
            videoRef.current!,
            (result) => {
              if (result && !scanned) {
                const text = result.getText();
                let tablePath: string | null = null;
                try {
                  const url = new URL(text);
                  const match = url.pathname.match(/^\/tables\/[a-zA-Z0-9\-]+$/);
                  if (match) tablePath = url.pathname;
                } catch {
                  const match = text.match(/^\/tables\/[a-zA-Z0-9\-]+$/);
                  if (match) tablePath = text;
                }
                if (tablePath) {
                  setScanned(true);
                  onClose();
                  router.push(tablePath);
                } else {
                  setError('QR code is not a PokerPay table. Please scan a valid table QR code.');
                }
              }
            }
          );
        });

        controls = controls1;
      } catch (e) {
        if (e instanceof Error) {
          if (e.name === 'NotAllowedError') {
            setError(
              'Camera access denied. To fix this: tap the camera/lock icon in your browser address bar → select "Allow" for Camera → then reload this page.'
            );
          } else if (e.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else {
            setError('Could not start camera: ' + e.message);
          }
        }
      }
    };

    start();

    return () => {
      controls?.stop();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ color: 'var(--color-gold)', margin: 0 }}>Scan Table QR Code</h2>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ flexShrink: 0 }}
          >
            Cancel
          </button>
        </div>

        {error ? (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>⚠</span> {error}
          </div>
        ) : null}

        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid var(--color-gold)',
            background: '#000',
          }}
        >
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            muted
            playsInline
          />
          {/* Corner guides */}
          {[
            { top: 8, left: 8, borderTop: '3px solid var(--color-gold)', borderLeft: '3px solid var(--color-gold)' },
            { top: 8, right: 8, borderTop: '3px solid var(--color-gold)', borderRight: '3px solid var(--color-gold)' },
            { bottom: 8, left: 8, borderBottom: '3px solid var(--color-gold)', borderLeft: '3px solid var(--color-gold)' },
            { bottom: 8, right: 8, borderBottom: '3px solid var(--color-gold)', borderRight: '3px solid var(--color-gold)' },
          ].map((style, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                ...style,
              }}
            />
          ))}
        </div>

        <p
          className="text-sm text-muted"
          style={{ textAlign: 'center', marginTop: '1rem' }}
        >
          Point your camera at the organizer&apos;s table QR code
        </p>
      </div>
    </div>
  );
}
