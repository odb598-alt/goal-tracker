'use client';
import { useState, useId } from 'react';
import { fmt, money, dateShort, dateLong, pctText, pctOf } from '@/lib/format';
import { useWidth } from './hooks';

function xLabelIdx(n, innerW) {
  const maxLabels = Math.max(2, Math.floor(innerW / 78));
  const step = Math.max(1, Math.ceil(n / maxLabels));
  const out = [];
  for (let i = 0; i < n; i += step) out.push(i);
  return out;
}

export default function ProgressChart({ points, goals }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const gid = useId().replace(/:/g, '');
  const H = 236;
  const m = { t: 18, r: 14, b: 28, l: 46 };
  const n = points.length;
  const iw = Math.max(10, width - m.l - m.r);
  const ih = H - m.t - m.b;
  const y = (p) => m.t + ih - (p / 100) * ih;
  const x = (i) => m.l + (n <= 1 ? iw / 2 : (iw * i) / (n - 1));
  const lineOf = (key) => points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1)).join(' ');
  const areaOf = (key) => n ? lineOf(key) + ' L' + x(n - 1).toFixed(1) + ' ' + y(0) + ' L' + x(0).toFixed(1) + ' ' + y(0) + ' Z' : '';
  const ticks = [0, 25, 50, 75, 100];

  const onMove = (e) => {
    if (!n) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left - m.l;
    const i = n <= 1 ? 0 : Math.round((px / iw) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };
  const labelIdx = xLabelIdx(n, iw);
  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label="Progression cumulée vers les deux objectifs, en pourcentage" style={{ display: 'block', touchAction: 'pan-y' }}
          onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={gid + 'a'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--c1)', stopOpacity: 0.28 }} />
              <stop offset="100%" style={{ stopColor: 'var(--c1)', stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id={gid + 'b'} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--c2)', stopOpacity: 0.24 }} />
              <stop offset="100%" style={{ stopColor: 'var(--c2)', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} className={t === 100 ? 'goal-line' : 'grid-line' + (t === 0 ? ' zero' : '')} />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="axis-text">{t + '%'}</text>
            </g>
          ))}
          <text x={width - m.r} y={m.t - 6} textAnchor="end" className="axis-text">Objectif</text>
          {n > 0 && (
            <g>
              <path d={areaOf('sPct')} style={{ fill: 'url(#' + gid + 'a)' }} />
              <path d={areaOf('rPct')} style={{ fill: 'url(#' + gid + 'b)' }} />
              <path d={lineOf('sPct')} style={{ fill: 'none', stroke: 'var(--c1)', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }} />
              <path d={lineOf('rPct')} style={{ fill: 'none', stroke: 'var(--c2)', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }} />
              <circle cx={x(n - 1)} cy={y(points[n - 1].sPct)} r="4.5" style={{ fill: 'var(--c1)', stroke: 'var(--card)', strokeWidth: 2 }} />
              <circle cx={x(n - 1)} cy={y(points[n - 1].rPct)} r="4.5" style={{ fill: 'var(--c2)', stroke: 'var(--card)', strokeWidth: 2 }} />
            </g>
          )}
          {hp && (
            <g>
              <line className="hover-rule" x1={x(hover)} x2={x(hover)} y1={m.t} y2={y(0)} />
              <circle cx={x(hover)} cy={y(hp.sPct)} r="4.5" style={{ fill: 'var(--c1)', stroke: 'var(--card)', strokeWidth: 2 }} />
              <circle cx={x(hover)} cy={y(hp.rPct)} r="4.5" style={{ fill: 'var(--c2)', stroke: 'var(--card)', strokeWidth: 2 }} />
            </g>
          )}
          {labelIdx.map((i) => (
            <text key={i} x={Math.min(Math.max(x(i), 26), width - 26)} y={H - 8} textAnchor="middle" className="axis-text">{points[i].label}</text>
          ))}
        </svg>
      )}
      {n === 0 && <div className="chart-empty"><span>La progression apparaîtra dès la première saisie.</span></div>}
      {hp && width > 0 && (
        <div className="tip" style={{ left: Math.min(Math.max(x(hover), 110), width - 110), top: 6 }}>
          <div className="t-date">{hp.start ? 'Départ' : dateLong(hp.date)}</div>
          <div className="t-row"><span className="sw" style={{ background: 'var(--c1)' }} />Ventes : {pctText(pctOf(hp.cumS, goals.sales))} · {fmt(hp.cumS)} / {fmt(goals.sales)}</div>
          <div className="t-row"><span className="sw" style={{ background: 'var(--c2)' }} />Argent : {pctText(pctOf(hp.cumR, goals.revenue))} · {money(hp.cumR)} / {money(goals.revenue)}</div>
        </div>
      )}
    </div>
  );
}