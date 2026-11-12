'use client';
import Panel from './Panel';
import { fmt, money, plural, dateLong, nf1, round2 } from '@/lib/format';

function Tile({ label, value, sub }) {
  return (
    <div className="tile">
      <p className="k">{label}</p>
      <p className="v">{value}</p>
      <p className="s">{sub}</p>
    </div>
  );
}

export default function Stats({ t }) {
  const none = t.days === 0;
  const dayWord = t.days + ' ' + plural(t.days, 'jour saisi', 'jours saisis');
  return (
    <Panel title="Statistiques" subtitle="Calculées à partir de tout l'historique.">
      <div className="stats">
        <Tile label="Total des ventes" value={fmt(t.sales)} sub={none ? 'Aucune saisie' : 'Sur ' + dayWord} />
        <Tile label="Total gagné" value={money(t.revenue)} sub={none ? 'Aucune saisie' : 'Sur ' + dayWord} />
        <Tile label="Ventes par jour" value={none ? '—' : nf1.format(t.avgS)} sub="Moyenne" />
        <Tile label="Gain par jour" value={none ? '—' : money(round2(t.avgR))} sub="Moyenne" />
        <Tile label="Meilleur jour (ventes)" value={t.bestS ? fmt(t.bestS.sales) : '—'} sub={t.bestS ? dateLong(t.bestS.date) : 'Pas encore de données'} />
        <Tile label="Meilleur jour (revenus)" value={t.bestR ? money(t.bestR.revenue) : '—'} sub={t.bestR ? dateLong(t.bestR.date) : 'Pas encore de données'} />
      </div>
    </Panel>
  );
}