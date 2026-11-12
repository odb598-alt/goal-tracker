'use client';
import { useMemo, useRef, useState } from 'react';
import Panel from './Panel';
import { CopyIcon } from './Icons';
import { plural } from '@/lib/format';

export default function Backup({ data, onReplace, onMerge, disabled }) {
  const json = useMemo(() => JSON.stringify({ app: 'suivi-objectifs', version: 1, exportedAt: new Date().toISOString(), goals: data.goals, entries: data.entries }, null, 2), [data]);
  const taRef = useRef(null);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setMsg('Sauvegarde copiée.');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      const ta = taRef.current;
      if (ta) {
        ta.focus(); ta.select();
        try { if (document.execCommand('copy')) { setMsg('Sauvegarde copiée.'); return; } } catch (_) {}
      }
      setMsg('Texte sélectionné : copie-le avec Ctrl+C.');
    }
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { setText(String(rd.result || '')); setErr(''); setMsg('Fichier chargé.'); };
    rd.onerror = () => setErr('Lecture du fichier impossible.');
    rd.readAsText(f);
    e.target.value = '';
  };

  const run = async (mode) => {
    setErr('');
    let p;
    try {
      const obj = JSON.parse(text);
      p = { entries: obj.entries || [] };
    } catch (ex) {
      setErr("Ce texte n'est pas du JSON valide."); setConfirmReplace(false); return;
    }
    
    if (!p.entries.length) { setErr("Aucune saisie trouvée dans ce fichier."); return; }

    if (mode === 'merge') {
      const n = await onMerge(p);
      setMsg((n ? n + ' ' + plural(n, 'saisie ajoutée', 'saisies ajoutées') : 'Rien de nouveau') + '.');
    } else {
      await onReplace(p);
      setMsg('Données remplacées.');
    }
    setText('');
    setConfirmReplace(false);
  };

  return (
    <Panel title="Sauvegarde" subtitle="Tes données restent dans le cloud. Garde une copie ailleurs au cas où.">
      <div className="flex flex-col gap-5">
        <div className="field">
          <div className="label">
            <label htmlFor="exp-text">Exporter (JSON)</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={copy}><CopyIcon /> Copier</button>
          </div>
          <textarea id="exp-text" ref={taRef} className="input mono" rows="4" readOnly value={json} onFocus={(e) => e.target.select()} />
        </div>

        {!disabled && (
          <div className="field">
            <div className="label">
              <label htmlFor="imp-text">Importer une sauvegarde</label>
              <label className="link-btn" htmlFor="imp-file" style={{ cursor: 'pointer' }}>Charger un fichier .json</label>
              <input id="imp-file" type="file" accept=".json,application/json,text/plain" onChange={onFile} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
            </div>
            <textarea id="imp-text" className="input mono" rows="3" placeholder="Colle ici le JSON exporté…" value={text} onChange={(e) => { setText(e.target.value); setConfirmReplace(false); }} />
          </div>
        )}

        {err && <p className="msg-error" role="alert">{err}</p>}

        {!disabled && confirmReplace ? (
          <div className="confirm" role="alertdialog">
            <p>Toutes tes données actuelles seront remplacées.</p>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => run('replace')}>Oui, remplacer</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReplace(false)}>Annuler</button>
          </div>
        ) : !disabled ? (
          <div className="btn-row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => run('merge')}>Fusionner</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setErr(''); try { JSON.parse(text); setConfirmReplace(true); } catch (ex) { setErr("Ce texte n'est pas du JSON valide."); } }}>Remplacer</button>
            <span className="msg-ok" aria-live="polite">{msg}</span>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}