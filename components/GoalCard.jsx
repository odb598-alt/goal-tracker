'use client';
import { useEffect, useState } from 'react';
import Panel from './Panel';
import { CheckIcon } from './Icons';
import { fmt, money, plural, pctOf, pctText } from '@/lib/format';

export default function GoalCard({ kind, label, total, goal }) {
  const isMoney = kind === 'revenue';
  const fv = isMoney ? money : (n) => fmt(Math.round(n));
  const pct = pctOf(total, goal);
  const reached = total >= goal;
  const remaining = Math.max(0, goal - total);
  const over = Math.max(0, total - goal);
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 60); return () => clearTimeout(t); }, [pct]);

  let footText;
  if (reached) {
    footText = over > 0
      ? '+' + fv(over) + (isMoney ? '' : ' ' + plural(over, 'vente', 'ventes')) + " au-dessus de l'objectif"
      : 'Objectif atteint pile';
  } else {
    footText = isMoney ? money(remaining) + ' restants' : fmt(remaining) + ' ' + plural(remaining, 'vente restante', 'ventes restantes');
  }

  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="eyebrow">{label}</h2>
        {reached
          ? <span className="pill pill-good"><CheckIcon /> Objectif atteint</span>
          : <span className="pill">Objectif {fv(goal)}</span>}
      </div>
      <div className="goal-figure">
        <span className="big">{fv(total)}</span>
        <span className="of">/ {fv(goal)}</span>
      </div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <div className={'bar-fill ' + (isMoney ? 'tone-2' : 'tone-1')} style={{ width: w + '%', minWidth: w > 0 ? '8px' : 0 }} />
      </div>
      <div className="goal-foot">
        <span className="pct">{pctText(pct)}</span>
        <span className="muted">{footText}</span>
      </div>
    </Panel>
  );
}