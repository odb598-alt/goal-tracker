'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchAll, insertEntry, updateEntry, deleteEntry,
         updateGoals, wipeAll, bulkInsert, subscribeRealtime } from '@/lib/data';
import { addDays, dateShort } from '@/lib/format';
import LoginBar from './LoginBar';
import GoalCard from './GoalCard';
import EntryForm from './EntryForm';
import Stats from './Stats';
import BarChart from './BarChart';
import ProgressChart from './ProgressChart';
import History from './History';
import GoalSettings from './GoalSettings';
import Backup from './Backup';
import Panel from './Panel';
import { SunIcon, MoonIcon, TargetIcon } from './Icons';

const DEFAULT_GOALS = { sales: 200, revenue: 3000 };
const MAX_CHART_DAYS = 90;
const THEME_KEY = 'goal-tracker:theme';

function dailyTotals(entries) {
  const m = new Map();
  for (const e of entries) {
    const d = m.get(e.date) || { date: e.date, sales: 0, revenue: 0 };
    d.sales += e.sales; d.revenue = Math.round((d.revenue + e.revenue) * 100) / 100;
    m.set(e.date, d);
  }
  return [...m.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

function buildSeries(daily) {
  if (!daily.length) return [];
  const map = new Map(daily.map((d) => [d.date, d]));
  const start = daily[0].date, end = daily[daily.length - 1].date;
  const span = Math.round((new Date(end) - new Date(start)) / 864e5);
  const dates = [];
  for (let i = 0; i <= span; i++) dates.push(addDays(start, i));
  let cs = 0, cr = 0;
  return dates.map((date) => {
    const d = map.get(date);
    const s = d ? d.sales : 0, r = d ? d.revenue : 0;
    cs += s; cr = Math.round((cr + r) * 100) / 100;
    return { date, sales: s, revenue: r, cumSales: cs, cumRevenue: cr };
  });
}

export default function App() {
  const [data, setData] = useState({ goals: DEFAULT_GOALS, entries: [] });
  const [loading, setLoading] = useState(true);
    const [session, setSession] = useState({ user: { email: 'Visiteur' } });
  const [isAdmin, setIsAdmin] = useState(true); // On force le mode admin
  const [editing, setEditing] = useState(null);
  const [theme, setTheme] = useState('dark');

  /* Auth */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      if (!session) { setIsAdmin(false); return; }
      const { data } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [session]);

  /* Thème */
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
    const init = saved === 'light' || saved === 'dark' ? saved : 'dark';
    setTheme(init);
    document.documentElement.setAttribute('data-theme', init);
  }, []);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  };

  /* Données + temps réel */
  const reload = async () => {
    try { setData(await fetchAll()); } catch (e) { console.error(e); }
  };
  useEffect(() => {
    (async () => { await reload(); setLoading(false); })();
    const unsub = subscribeRealtime(() => reload());
    return unsub;
  }, []);

  /* Stats dérivées */
  const totals = useMemo(() => {
    const daily = dailyTotals(data.entries);
    const sales = data.entries.reduce((a, e) => a + e.sales, 0);
    const revenue = Math.round(data.entries.reduce((a, e) => a + e.revenue, 0) * 100) / 100;
    let bestS = null, bestR = null;
    daily.forEach((d) => {
      if (d.sales > 0 && (!bestS || d.sales > bestS.sales)) bestS = d;
      if (d.revenue > 0 && (!bestR || d.revenue > bestR.revenue)) bestR = d;
    });
    const days = daily.length;
    return { daily, sales, revenue, days, avgS: days ? sales / days : 0, avgR: days ? revenue / days : 0, bestS, bestR };
  }, [data.entries]);

  const series = useMemo(() => buildSeries(totals.daily), [totals.daily]);
  const shown = useMemo(() => series.slice(-MAX_CHART_DAYS), [series]);
  const salesSeries = useMemo(() => shown.map((d) => ({ date: d.date, value: d.sales })), [shown]);
  const revenueSeries = useMemo(() => shown.map((d) => ({ date: d.date, value: d.revenue })), [shown]);
  const points = useMemo(() => {
    if (!shown.length) return [];
    const pts = shown.map((d) => ({
      date: d.date, label: dateShort(d.date), cumS: d.cumSales, cumR: d.cumRevenue,
      sPct: Math.min(100, (d.cumSales / data.goals.sales) * 100),
      rPct: Math.min(100, (d.cumRevenue / data.goals.revenue) * 100),
    }));
    if (shown.length === series.length)
      pts.unshift({ date: addDays(shown[0].date, -1), label: 'Départ', cumS: 0, cumR: 0, sPct: 0, rPct: 0, start: true });
    return pts;
  }, [shown, series, data.goals]);

  /* Actions */
  const submitEntry = async (fields) => {
    if (editing) {
      await updateEntry(editing.id, fields); setEditing(null);
      return 'Saisie mise à jour.';
    }
    await insertEntry(fields);
    return 'Ajouté le ' + dateShort(fields.date) + ' !';
  };
  const startEdit = (entry) => {
    setEditing(entry);
    document.getElementById('saisie')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const removeEntry = async (id) => {
    await deleteEntry(id);
    if (editing?.id === id) setEditing(null);
  };
  const saveGoals = async (goals) => { await updateGoals(goals); };
  const goalsToDefaults = async () => { await updateGoals(DEFAULT_GOALS); };
  const wipe = async () => { await wipeAll(); setEditing(null); };
  const replaceAll = async (p) => {
    setEditing(null);
    await wipeAll();
    await bulkInsert(p.entries);
  };
  const mergeAll = async (p) => {
    const sig = (e) => e.date + '|' + e.sales + '|' + e.revenue + '|' + e.comment;
    const existing = new Set(data.entries.map(sig));
    const add = p.entries.filter((e) => !existing.has(sig(e)));
    await bulkInsert(add);
    return add.length;
  };

  const nDays = shown.length;

  if (loading) return (
    <div className="wrap"><p style={{ color: 'var(--muted)', padding: 24 }}>Chargement des données…</p></div>
  );

  return (
    <div className="wrap">
      <header className="app-head">
        <div className="brand">
          <div className="logo"><TargetIcon /></div>
          <div>
            <h1 className="app-title">Suivi d'objectifs</h1>
            <p className="app-sub">Ventes et revenus, jour après jour</p>
          </div>
        </div>
                <div className="head-tools">
          <button type="button" className="icon-btn" onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
            style={{ border: '1px solid var(--line)' }}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <div className="row row-half">
        <GoalCard kind="sales" label="Ventes" total={totals.sales} goal={data.goals.sales} />
        <GoalCard kind="revenue" label="Argent gagné" total={totals.revenue} goal={data.goals.revenue} />
      </div>

      <div className="row row-form">
        <EntryForm entries={data.entries} editing={editing}
          onSubmit={submitEntry} onCancel={() => setEditing(null)}
          readOnly={false} />  {/* <--- Force à false ici */}
        <Stats t={totals} />
      </div>

      <div className="row row-half">
        <Panel title="Ventes par jour" subtitle={nDays ? nDays + ' jours affichés' : 'Aucune donnée'}>
          <BarChart series={salesSeries} color="var(--c1)" integer
            formatValue={(v) => v + (v >= 2 ? ' ventes' : ' vente')}
            ariaLabel="Ventes par jour" emptyText="Le graphique se remplit dès ta première saisie." />
        </Panel>
        <Panel title="Argent gagné par jour" subtitle={nDays ? nDays + ' jours affichés, en dollars' : 'Aucune donnée'}>
          <BarChart series={revenueSeries} color="var(--c2)"
            formatValue={(v) => v + ' $'} ariaLabel="Argent gagné par jour"
            emptyText="Le graphique se remplit dès ta première saisie." />
        </Panel>
      </div>

      <Panel title="Progression vers les objectifs"
        subtitle="Cumul des saisies, en pourcentage de chaque objectif">
        <ProgressChart points={points} goals={data.goals} />
      </Panel>

      <History entries={data.entries} editingId={editing?.id}
        onEdit={isAdmin ? startEdit : null}
        onDelete={isAdmin ? removeEntry : null} />

      <div className="row row-half">
        <GoalSettings goals={data.goals} count={data.entries.length}
          onSave={saveGoals} onDefaults={goalsToDefaults} onWipe={wipe}
          disabled={!isAdmin} />
        <Backup data={data} onReplace={replaceAll} onMerge={mergeAll} disabled={!isAdmin} />
      </div>
    </div>
  );
}