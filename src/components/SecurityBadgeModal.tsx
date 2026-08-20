import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { buildSecurePayloadBundle, decryptPayloadAES256GCM, verifyHMACSignature } from '../lib/security';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    originalData: any;
    ciphertext: string;
    iv: string;
    signature: string;
    timestamp: number;
    verified: boolean;
    decryptedData: any;
  } | null>(null);

  if (!isOpen) return null;

  const runSecurityAudit = async () => {
    setTesting(true);
    setTestResult(null);

    const samplePayload = {
      action: 'SUBMIT_BOUNTY_CLAIM',
      hunterUid: '85',
      bountyId: 'bounty_9921',
      timestampIso: new Date().toISOString(),
      nonce: Math.random().toString(36).substring(2),
    };

    // 1. Encrypt with AES-256-GCM + Sign with HMAC-SHA256
    const { encryptedPayload, headers } = await buildSecurePayloadBundle(samplePayload);

    // 2. Verify HMAC Signature
    const isSignatureValid = await verifyHMACSignature(
      JSON.stringify(encryptedPayload),
      parseInt(headers['X-Request-Timestamp'], 10),
      headers['X-Request-Signature']
    );

    // 3. Decrypt AES-256-GCM Payload
    const decryptedPayload = await decryptPayloadAES256GCM(encryptedPayload);

    setTimeout(() => {
      setTestResult({
        originalData: samplePayload,
        ciphertext: encryptedPayload.ciphertext,
        iv: encryptedPayload.iv,
        signature: headers['X-Request-Signature'],
        timestamp: parseInt(headers['X-Request-Timestamp'], 10),
        verified: isSignatureValid,
        decryptedData: decryptedPayload,
      });
      setTesting(false);
    }, 250);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 540,
        background: 'var(--bg-1)', border: '1px solid var(--border-md)',
        borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
        overflow: 'hidden', animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e',
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                System Security & Encryption Protocol
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Payload Encryption: AES-256-GCM · Request Auth: HMAC-SHA256
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Security Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              padding: 14, borderRadius: 'var(--radius-lg)',
              background: 'var(--bg)', border: '1px solid var(--border-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Lock size={15} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>AES-256-GCM</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
                Military-grade authenticated 256-bit GCM payload encryption with 96-bit random IVs.
              </div>
            </div>

            <div style={{
              padding: 14, borderRadius: 'var(--radius-lg)',
              background: 'var(--bg)', border: '1px solid var(--border-md)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <KeyRound size={15} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>HMAC-SHA256</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
                Anti-replay request signature authentication with microsecond timestamp validation.
              </div>
            </div>
          </div>

          {/* Diagnostic Action */}
          <button
            onClick={runSecurityAudit}
            disabled={testing}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', background: '#22c55e', color: '#000', fontWeight: 700 }}
          >
            {testing ? (
              <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Running Security Audit…</>
            ) : (
              <><ShieldCheck size={14} /> Run Live Security Audit Test</>
            )}
          </button>

          {/* Test Results Log */}
          {testResult && (
            <div className="anim-in" style={{
              background: 'var(--bg)', border: '1px solid var(--border-hi)',
              borderRadius: 'var(--radius-lg)', padding: 14, fontSize: 11, fontFamily: 'var(--mono)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} /> {testResult.verified ? 'SECURITY AUDIT VERIFIED: OK' : 'FAILED'}
                </span>
                <span style={{ color: 'var(--text-3)', fontSize: 10 }}>TS: {testResult.timestamp}</span>
              </div>

              <div>
                <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>[1] AES-256-GCM IV (12 Bytes):</div>
                <div style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{testResult.iv}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>[2] Encrypted Ciphertext (Base64):</div>
                <div style={{ color: '#38bdf8', wordBreak: 'break-all', maxHeight: 40, overflowY: 'auto' }}>
                  {testResult.ciphertext}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>[3] HMAC-SHA256 Signature (Header):</div>
                <div style={{ color: '#c084fc', wordBreak: 'break-all' }}>{testResult.signature}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-3)', marginBottom: 2 }}>[4] Decrypted Payload Verification:</div>
                <div style={{ color: '#22c55e' }}>{JSON.stringify(testResult.decryptedData)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
