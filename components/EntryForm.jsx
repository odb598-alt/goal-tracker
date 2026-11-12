'use client';
import { useState, useEffect, useRef } from 'react';
import Panel from './Panel';
import { todayStr, fmt, money, plural, round2, dateShort } from '@/lib/format';

export default function EntryForm({ entries, editing, onSubmit, onCancel, readOnly }) {
  const [date, setDate] = useState(todayStr());
  const [sales, setSales] = useState('');
  const [revenue, setRevenue] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const editId = editing ? editing.id : null;
  const wasEditing = useRef(false);

  useEffect(() => {
    if (editing) {
      setDate(editing.date); setSales(String(editing.sales));
      setRevenue(String(editing.revenue)); setComment(editing.comment || '');
      setError(''); wasEditing.current = true;
    } else if (wasEditing.current) {
      setSales(''); setRevenue(''); setComment(''); setError('');
      wasEditing.current = false;
    }
  }, [editId]);

  const sameDay = entries.filter((e) => e.date === date && e.id !== editId);
  const sameSales = sameDay.reduce((a, e) => a + e.sales, 0);
  const sameRevenue = round2(sameDay.reduce((a, e) => a + e.revenue, 0));

  const submit = async (ev) => {
    ev.preventDefault();
    const okDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (!okDate) { setError('Choisis une date valide.'); return; }
    const sRaw = sales.trim(), rRaw = revenue.trim();
    if (sRaw === '' && rRaw === '') { setError('Entre un nombre de ventes ou un montant.'); return; }
    const s = sRaw === '' ? 0 : Number(sRaw.replace(',', '.'));
    const r = rRaw === '' ? 0 : Number(rRaw.replace(',', '.'));
    if (!Number.isInteger(s) || s < 0) { setError('Le nombre de ventes doit être un entier ≥ 0.'); return; }
    if (!Number.isFinite(r) || r < 0) { setError('Le montant doit être ≥ 0.'); return; }
    try {
      const msg = await onSubmit({ date, sales: s, revenue: round2(r), comment: comment.trim().slice(0, 300) });
      setSales(''); setRevenue(''); setComment(''); setError('');
      setNotice(msg); setTimeout(() => setNotice(''), 4000);
    } catch (e) {
      setError(e.message || 'Erreur inconnue.');
    }
  };

  const cancel = () => {
    setSales(''); setRevenue(''); setComment(''); setError('');
    wasEditing.current = false; onCancel();
  };

  return (
    <Panel id="saisie"
      title={readOnly ? 'Lecture seule' : editing ? 'Modifier la saisie' : 'Ajouter les résultats du jour'}
      subtitle={readOnly ? 'Connecte-toi en admin pour ajouter ou modifier.' : editing ? 'Corrige les valeurs puis enregistre.' : "Chaque saisie s'ajoute au total."}>
      {!readOnly && (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="form-grid">
            <div className="field span-2">
              <div className="label">
                <label htmlFor="f-date">Date</label>
                <button type="button" className="link-btn" onClick={() => setDate(todayStr())}>Aujourd'hui</button>
              </div>
              <input id="f-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-sales">Ventes réalisées</label>
              <input id="f-sales" className="input" type="number" min="0" step="1" placeholder="0" value={sales} onChange={(e) => setSales(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="f-revenue">Argent gagné ($)</label>
              <input id="f-revenue" className="input" type="number" min="0" step="any" placeholder="0" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
            </div>
            <div className="field span-2">
              <label className="label" htmlFor="f-comment">Commentaire (facultatif)</label>
              <textarea id="f-comment" className="input" rows="2" maxLength="300" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          </div>
          {!editing && sameDay.length > 0 && (
            <p className="hint">Ce jour compte déjà {fmt(sameSales)} {plural(sameSales, 'vente', 'ventes')} et {money(sameRevenue)}.</p>
          )}
          {error && <p className="msg-error" role="alert">{error}</p>}
          <div className="btn-row">
            <button type="submit" className="btn btn-primary">{editing ? 'Mettre à jour' : 'Enregistrer'}</button>
            {editing && <button type="button" className="btn btn-ghost" onClick={cancel}>Annuler</button>}
            <span className="msg-ok" aria-live="polite">{notice}</span>
          </div>
        </form>
      )}
    </Panel>
  );
}