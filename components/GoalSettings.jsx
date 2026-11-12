'use client';
import { useState, useEffect } from 'react';
import Panel from './Panel';
import { round2, plural } from '@/lib/format';

export default function GoalSettings({ goals, count, onSave, onDefaults, onWipe, disabled }) {
  const [s, setS] = useState(String(goals.sales));
  const [r, setR] = useState(String(goals.revenue));
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { setS(String(goals.sales)); setR(String(goals.revenue)); }, [goals.sales, goals.revenue]);

  const save = async (ev) => {
    ev.preventDefault();
    if (disabled) return;
    const sv = Number(String(s).replace(',', '.'));
    const rv = Number(String(r).replace(',', '.'));
    if (!Number.isInteger(sv) || sv < 1) { setErr("L'objectif de ventes doit être un entier d'au moins 1."); return; }
    if (!Number.isFinite(rv) || rv <= 0) { setErr("L'objectif d'argent doit être supérieur à 0."); return; }
    setErr('');
    await onSave({ sales: sv, revenue: round2(rv) });
    setMsg('Objectifs mis à jour.');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <Panel title="Objectifs" subtitle="Modifie les cibles ou repars de zéro.">
      {!disabled ? (
        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <div className="form-grid">
            <div className="field">
              <label className="label" htmlFor="g-sales">Objectif de ventes</label>
              <input id="g-sales" className="input" type="number" min="1" step="1" value={s} onChange={(e) => setS(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="g-revenue">Objectif d'argent ($)</label>
              <input id="g-revenue" className="input" type="number" min="1" step="any" value={r} onChange={(e) => setR(e.target.value)} />
            </div>
          </div>
          {err && <p className="msg-error" role="alert">{err}</p>}
          <div className="btn-row">
            <button type="submit" className="btn btn-primary">Enregistrer les objectifs</button>
            <span className="msg-ok" aria-live="polite">{msg}</span>
          </div>
        </form>
      ) : (
        <p className="hint">Seul l'administrateur peut modifier les objectifs.</p>
      )}

      {!disabled && (
        <>
          <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '20px 0' }} />
          {confirm === null && (
            <div className="btn-row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm('defaults')}>Remettre 200 ventes et 3 000 $</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm('wipe')}>Tout réinitialiser</button>
            </div>
          )}
          {confirm === 'defaults' && (
            <div className="confirm" role="alertdialog" aria-label="Confirmer le retour aux objectifs par défaut">
              <p>Les objectifs redeviennent 200 ventes et 3 000 $. Ton historique est conservé.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={async () => { await onDefaults(); setConfirm(null); setMsg('Objectifs remis par défaut.'); }}>Confirmer</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          )}
          {confirm === 'wipe' && (
            <div className="confirm" role="alertdialog" aria-label="Confirmer la réinitialisation complète">
              <p>Cela supprime {count} {plural(count, 'saisie', 'saisies')} et remet les objectifs par défaut.</p>
              <button type="button" className="btn btn-danger btn-sm" onClick={async () => { await onWipe(); setConfirm(null); }}>Tout effacer</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Annuler</button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}