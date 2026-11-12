'use client';
import { useMemo, useState, useEffect } from 'react';
import Panel from './Panel';
import { PencilIcon, TrashIcon } from './Icons';
import { fmt, money, dateLong, plural } from '@/lib/format';

export default function History({ entries, editingId, onEdit, onDelete }) {
  const [confirmId, setConfirmId] = useState(null);
  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 4000);
    return () => clearTimeout(t);
  }, [confirmId]);

  const rows = useMemo(() => [...entries].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1)), [entries]);

  return (
    <Panel title="Historique" subtitle={rows.length ? rows.length + ' ' + plural(rows.length, 'saisie', 'saisies') + ', la plus récente en premier.' : 'Toutes tes saisies apparaîtront ici.'}>
      {rows.length === 0 ? (
        <div className="table-wrap"><p className="empty">Aucune saisie pour l'instant. Ajoute les résultats du jour avec le formulaire.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Ventes</th>
                <th className="num">Argent gagné</th>
                <th className="col-comment">Commentaire</th>
                <th className="actions"><span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className={editingId === e.id ? 'editing' : ''}>
                  <td>
                    {dateLong(e.date)}
                    {e.comment && <span className="inline-comment">{e.comment}</span>}
                  </td>
                  <td className="num">{fmt(e.sales)}</td>
                  <td className="num">{money(e.revenue)}</td>
                  <td className="col-comment">{e.comment ? <span className="cmt" title={e.comment}>{e.comment}</span> : <span className="muted">—</span>}</td>
                  <td className="actions">
                    {onEdit && (
                      <button type="button" className="icon-btn" aria-label={'Modifier la saisie du ' + dateLong(e.date)} title="Modifier" onClick={() => onEdit(e)}><PencilIcon /></button>
                    )}
                    {onDelete && (
                      confirmId === e.id ? (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => { onDelete(e.id); setConfirmId(null); }}>Confirmer</button>
                      ) : (
                        <button type="button" className="icon-btn danger" aria-label={'Supprimer la saisie du ' + dateLong(e.date)} title="Supprimer" onClick={() => setConfirmId(e.id)}><TrashIcon /></button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}