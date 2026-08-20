import React, { useState, useEffect } from 'react';
import { Trophy, Eye, EyeOff, Loader2, ArrowRight, AtSign, Link as LinkIcon, CheckCircle2, RefreshCw, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchV4rxProfile, type V4rxFetchedProfile } from '../services/osuApi';
import { CowboyRankBadge } from '../components/CowboyRankBadge';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Tab = 'login' | 'register';

export function LoginPage() {
  const { login, register, authError, loading, clearError } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  // Login state
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw,   setShowLoginPw]   = useState(false);
  const [loginLoading,  setLoginLoading]  = useState(false);

  // Register state — default ID input is EMPTY ("")
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [v4rxIdInput, setV4rxIdInput] = useState(''); // Default EMPTY as requested!
  const [showRegPw,   setShowRegPw]   = useState(false);
  const [regLoading,  setRegLoading]  = useState(false);

  // Live profile fetch preview & Duplicate check
  const [profilePreview, setProfilePreview] = useState<V4rxFetchedProfile | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [uidDuplicateError, setUidDuplicateError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string | null>(null);

  // Auto-fetch profile and check for duplicate UID when v4rxIdInput changes
  useEffect(() => {
    const clean = v4rxIdInput.trim();
    setUidDuplicateError(null);

    if (!clean) {
      setProfilePreview(null);
      setFetchingProfile(false);
      return;
    }
    setFetchingProfile(true);

    const timer = setTimeout(async () => {
      const res = await fetchV4rxProfile(clean);
      setProfilePreview(res);

      // Check if UID is already registered in Firestore
      try {
        const q = query(collection(db, 'users'), where('osuId', '==', clean));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setUidDuplicateError(`UID #${clean} sudah terdaftar oleh pengguna lain! Mohon gunakan UID milikmu sendiri.`);
        }
      } catch (err) {
        console.warn('Duplicate UID check error:', err);
      }

      setFetchingProfile(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [v4rxIdInput]);

  const handleTabChange = (t: Tab) => { clearError(); setTab(t); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try { await login(loginEmail, loginPassword); } catch { /* handled in context */ }
    setLoginLoading(false);
  };

  const handleRegisterClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v4rxIdInput.trim() || !profilePreview || uidDuplicateError) return;
    setShowConfirmModal(true);
  };

  const executeFinalRegister = async () => {
    if (!profilePreview) return;
    setRegLoading(true);
    setConfirmError(null);
    try {
      await register({
        email:        regEmail,
        password:     regPassword,
        username:     profilePreview.username,
        osuId:        profilePreview.id,
        v4rxPp:       profilePreview.v4rxPp,
        v4rxRank:     profilePreview.v4rxRank,
        v4rxAccuracy: profilePreview.v4rxAccuracy,
      });
      setShowConfirmModal(false);
      setLoginEmail(v4rxIdInput.trim() || regEmail);
      setLoginPassword(regPassword);
      setTab('login');
      setRegisterSuccessMsg(`Registrasi akun (UID #${profilePreview.id}) berhasil! Silakan klik "Login to Board".`);
    } catch (err: any) {
      console.error('Registration error:', err);
      setConfirmError(err.message || 'Registrasi gagal. Periksa kembali email & password kamu.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'var(--bg)',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-1)',
        border: '1px solid var(--border-md)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        animation: 'slideUp 0.2s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <div className="merah-putih-neon-box" style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px' }}>
            <Trophy size={24} color="#ef4444" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>
            rxid.tbh <span style={{
              background: 'linear-gradient(180deg, #dc2626 0%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
            }}>Bounty</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
            osu! Beatmap Challenge Platform
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          borderBottom: '1px solid var(--border)',
        }}>
          {(['login', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              style={{
                padding: '12px 0',
                fontSize: 13, fontWeight: 600,
                background: tab === t ? 'var(--bg)' : 'transparent',
                color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
                borderBottom: tab === t ? `2px solid var(--accent)` : '2px solid transparent',
                transition: 'all 0.15s',
                cursor: 'pointer', border: 'none',
                textTransform: 'capitalize',
              }}
            >
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          {registerSuccessMsg && (
            <div style={{
              padding: '10px 12px', marginBottom: 16,
              borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600,
              background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <div>{registerSuccessMsg}</div>
            </div>
          )}

          {authError && (
            <div style={{
              padding: '10px 12px', marginBottom: 16,
              borderRadius: 'var(--radius)', fontSize: 12,
              background: 'var(--red-dim)', color: 'var(--red)',
              border: '1px solid rgba(245,101,101,0.2)',
            }}>
              {authError}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label"><AtSign size={11} /> EMAIL</label>
                <input
                  type="email" required autoComplete="username"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  placeholder="email@domain.com" className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPw ? 'text' : 'password'} required
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••" className="form-input" style={{ paddingRight: 38 }}
                  />
                  <button type="button" onClick={() => setShowLoginPw(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                    {showLoginPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loginLoading || loading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
              >
                {loginLoading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Logging in…</>
                  : <><ArrowRight size={14} /> Login to Board</>
                }
              </button>

              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                Belum punya akun?{' '}
                <button type="button" onClick={() => handleTabChange('register')}
                  style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Register di sini
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterClick} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Email */}
              <div className="form-group">
                <label className="form-label"><AtSign size={11} /> Email</label>
                <input
                  type="email" required autoComplete="email"
                  value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="kamu@email.com" className="form-input"
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPw ? 'text' : 'password'} required
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter" className="form-input"
                    style={{ paddingRight: 38 }}
                  />
                  <button type="button" onClick={() => setShowRegPw(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                    {showRegPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* v4rx.me User ID or Profile Link (MANDATORY) */}
              <div className="form-group">
                <label className="form-label">
                  <LinkIcon size={11} /> INPUT UID USER <span style={{ color: 'var(--red)', fontWeight: 800 }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text" required
                    value={v4rxIdInput} onChange={e => setV4rxIdInput(e.target.value)}
                    placeholder="Masukkan UID User (contoh: 85 atau 27)"
                    className="form-input mono"
                    style={{ paddingRight: 38 }}
                  />
                  {fetchingProfile && (
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                      <RefreshCw size={13} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div>
                    🇮🇩 <strong>Wajib Input UID v4rx</strong>. User Register Harus Sesuai dengan Linked UID yang akan diinputkan.
                  </div>
                  <div style={{ color: 'var(--text-4)', fontSize: 10.5 }}>
                    🇬🇧 <strong>v4rx UID Required</strong>. Registered user must match the linked UID being entered.
                  </div>
                </div>
              </div>

              {/* Connected Profile Card Preview with Bulletproof Avatar Fallback */}
              {profilePreview && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg)', border: '1px solid var(--accent-mid)',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <img
                    src={profilePreview.avatarUrl}
                    alt={profilePreview.username}
                    style={{
                      width: 44, height: 44, borderRadius: 10, objectFit: 'cover',
                      border: '1px solid var(--border-hi)', flexShrink: 0,
                      background: 'var(--bg-2)',
                    }}
                    onError={e => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(profilePreview.username)}&bold=true&size=128`;
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                        {profilePreview.username}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
                        <CheckCircle2 size={11} /> Connected
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>#{profilePreview.v4rxRank}</span>
                      <CowboyRankBadge rank={profilePreview.v4rxRank} size="sm" />
                      <span>·</span>
                      <span className="mono" style={{ color: 'var(--gold)' }}>{profilePreview.v4rxPp.toLocaleString()} pp</span>
                      <span>·</span>
                      <span className="mono">{profilePreview.v4rxAccuracy}% acc</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate UID Error Banner */}
              {uidDuplicateError && (
                <div style={{
                  padding: '10px 12px', borderRadius: 'var(--radius)',
                  fontSize: 11, fontWeight: 600,
                  background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <div>{uidDuplicateError}</div>
                </div>
              )}

              <button
                type="submit" disabled={regLoading || loading || !profilePreview || !!uidDuplicateError}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 6, justifyContent: 'center', opacity: (!profilePreview || !!uidDuplicateError) ? 0.5 : 1 }}
              >
                {regLoading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
                  : <><ArrowRight size={14} /> Connect & Create Account</>
                }
              </button>

              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                Sudah punya akun?{' '}
                <button type="button" onClick={() => handleTabChange('login')}
                  style={{ color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── CONFIRMATION MODAL BEFORE REGISTRATION ── */}
      {showConfirmModal && profilePreview && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            width: '100%', maxWidth: 440,
            background: 'var(--bg-1)', border: '1px solid var(--border-md)',
            borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            overflow: 'hidden', animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(90deg, rgba(255, 123, 0, 0.1) 0%, transparent 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                }}>
                  <HelpCircle size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                    Konfirmasi Pemilik Akun v4rx.me
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    Periksa kembali data akun sebelum mendaftar
                  </div>
                </div>
              </div>

              <button onClick={() => setShowConfirmModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Apakah profil v4rx.me berikut ini <b>benar-benar milik kamu</b>? UID yang terdaftar tidak dapat diganti kembali setelah akun dibuat.
              </div>

              {/* Connected Profile Card */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg)', border: '1px solid var(--accent-mid)',
              }}>
                <img
                  src={profilePreview.avatarUrl}
                  alt={profilePreview.username}
                  style={{
                    width: 50, height: 50, borderRadius: 12, objectFit: 'cover',
                    border: '1px solid var(--border-hi)', flexShrink: 0,
                    background: 'var(--bg-2)',
                  }}
                  onError={e => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.src = `https://ui-avatars.com/api/?background=251525&color=ff4d8d&name=${encodeURIComponent(profilePreview.username)}&bold=true&size=128`;
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                      {profilePreview.username}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>
                      (UID #{profilePreview.id})
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>#{profilePreview.v4rxRank}</span>
                    <CowboyRankBadge rank={profilePreview.v4rxRank} size="sm" />
                    <span>·</span>
                    <span className="mono" style={{ color: 'var(--gold)' }}>{profilePreview.v4rxPp.toLocaleString()} pp</span>
                    <span>·</span>
                    <span className="mono">{profilePreview.v4rxAccuracy}% acc</span>
                  </div>
                </div>
              </div>

              {/* Confirm Error Banner */}
              {confirmError && (
                <div style={{
                  padding: '10px 12px', borderRadius: 'var(--radius)',
                  fontSize: 11, fontWeight: 600,
                  background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <div>{confirmError}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  ⬅️ Batal / Ubah UID
                </button>
                <button
                  type="button"
                  onClick={executeFinalRegister}
                  disabled={regLoading}
                  className="btn btn-primary"
                  style={{ justifyContent: 'center' }}
                >
                  {regLoading ? (
                    <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                  ) : (
                    <><CheckCircle2 size={14} /> Ya, Konfirmasi</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
