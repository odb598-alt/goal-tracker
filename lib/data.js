import { supabase } from './supabaseClient';

export async function fetchAll() {
  const [g, e] = await Promise.all([
    supabase.from('goals').select('*').eq('id', 1).single(),
    supabase.from('entries').select('*').order('date', { ascending: true }),
  ]);
  if (g.error) throw g.error;
  if (e.error) throw e.error;
  return {
    goals: { sales: g.data.sales_target, revenue: Number(g.data.revenue_target) },
    entries: e.data.map((r) => ({
      id: r.id, date: r.date, sales: r.sales, revenue: Number(r.revenue),
      comment: r.comment || '', createdAt: new Date(r.created_at).getTime(),
    })),
  };
}

export async function insertEntry({ date, sales, revenue, comment }) {
  const { data, error } = await supabase.from('entries')
    .insert({ date, sales, revenue, comment }).select().single();
  if (error) throw error;
  return data;
}

export async function updateEntry(id, { date, sales, revenue, comment }) {
  const { error } = await supabase.from('entries')
    .update({ date, sales, revenue, comment }).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

export async function updateGoals({ sales, revenue }) {
  const { error } = await supabase.from('goals')
    .update({ sales_target: sales, revenue_target: revenue, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
}

export async function wipeAll() {
  const { error } = await supabase.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  await updateGoals({ sales: 200, revenue: 3000 });
}

export async function bulkInsert(entries) {
  if (!entries.length) return;
  const rows = entries.map((e) => ({
    date: e.date, sales: e.sales, revenue: e.revenue, comment: e.comment || '',
  }));
  const { error } = await supabase.from('entries').insert(rows);
  if (error) throw error;
}

export function subscribeRealtime(onChange) {
  const ch = supabase.channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(ch);
}