import React, { useState } from 'react';
import type { Bounty, User, Submission } from '../types/bounty';
import { X, Image as Img, Upload, Link as LinkIcon, MessageSquare, Send, Coins, FileCheck } from 'lucide-react';

interface SubmitProofModalProps {
  bounty: Bounty; currentUser: User;
  onClose: () => void;
  onSubmit: (sub: Omit<Submission, 'id'>, giverId?: string, beatmapTitle?: string) => void;
}

function compressBase64Image(dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
}

export const SubmitProofModal: React.FC<SubmitProofModalProps> = ({
  bounty, currentUser, onClose, onSubmit,
}) => {
  const [proofUrl, setProofUrl] = useState('');
  const [replayUrl, setReplayUrl] = useState('');
  const [comment, setComment] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          const raw = reader.result.toString();
          const compressed = await compressBase64Image(raw);
          setProofUrl(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) return;
    onSubmit({
      bountyId: bounty.id,
      hunterId: currentUser.id,
      hunterUsername: currentUser.username,
      hunterAvatar: currentUser.avatarUrl,
      proofImageUrl: proofUrl,
      replayUrl,
      comment,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }, bounty.giver.id, bounty.beatmap.title);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-max-sm modal-scroll">
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCheck size={16} style={{ color: 'var(--accent)' }} />
              Submit Approval
            </div>
            <div className="modal-subtitle">{bounty.beatmap.title}</div>
          </div>
          <button className="btn btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="modal-body">
          {/* Map summary */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg)', border: '1px solid var(--border)',
            marginBottom: 16,
          }}>
            <img
              src={bounty.beatmap.cardUrl || bounty.beatmap.coverUrl}
              alt={bounty.beatmap.title}
              style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bounty.beatmap.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Coins size={10} style={{ color: 'var(--gold)' }} />
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--gold)' }}>
                  {bounty.reward.amount.toLocaleString()} {bounty.reward.currency}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Direct Image File Upload */}
            <div className="form-group">
              <label className="form-label"><Upload size={11} /> Upload Proof Image File</label>
              <div style={{
                border: '1px dashed var(--border-md)',
                borderRadius: 'var(--radius)',
                padding: '16px 12px',
                textAlign: 'center',
                background: 'var(--bg)',
                cursor: 'pointer',
                position: 'relative',
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
                <Img size={22} style={{ color: 'var(--accent)', margin: '0 auto 6px', display: 'block' }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {fileName ? `File: ${fileName}` : 'Click or Drag Image File Here'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                  Supports PNG, JPG, WEBP screenshots
                </div>
              </div>
            </div>

            {/* Alternative Image URL */}
            <div className="form-group">
              <label className="form-label"><LinkIcon size={11} /> Or Screenshot Image URL</label>
              <input
                type="text"
                value={fileName ? '' : proofUrl}
                onChange={e => { setFileName(''); setProofUrl(e.target.value); }}
                placeholder="https://imgur.com/..."
                className="form-input"
              />
            </div>

            {/* Preview Box */}
            {proofUrl && (
              <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                <img
                  src={proofUrl} alt="Preview"
                  style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div style={{
                  position: 'absolute', bottom: 6, right: 6,
                  padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.7)',
                  fontSize: 10, color: '#fff', fontWeight: 600,
                }}>
                  Image Loaded ✓
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label"><LinkIcon size={11} /> Replay / Score Link (Optional)</label>
              <input type="text" value={replayUrl} onChange={e => setReplayUrl(e.target.value)}
                placeholder="https://v4rx.me/replays/..." className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label"><MessageSquare size={11} /> Comment / Details</label>
              <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Describe your run or mods used…" className="form-input" />
            </div>

            <div className="modal-footer" style={{ padding: 0, borderTop: 'none', marginTop: 4 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={!proofUrl} className="btn btn-primary btn-sm" style={{ opacity: !proofUrl ? 0.5 : 1 }}>
                <Send size={12} /> Send Approval Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
