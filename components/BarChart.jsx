'use client';
import { useState } from 'react';
import { fmt, dateShort, dateLong, plural } from '@/lib/format';
import { useWidth } from './hooks';

function niceStep(raw, integer) {
  if (raw <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / p;
  let s = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  s *= p;
  return integer ? Math.max(1, s) : s;
}
function axisFor(max, integer) {
  const m = max > 0 ? max : integer ? 4 : 1;
  const step = niceStep(m / 4, integer);
  const top = Math.ceil(m / step - 1e-9) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { top, ticks };
}
function xLabelIdx(n, innerW) {
  const maxLabels = Math.max(2, Math.floor(innerW / 78));
  const step = Math.max(1, Math.ceil(n / maxLabels));
  const out = [];
  for (let i = 0; i < n; i += step) out.push(i);
  return out;
}

export default function BarChart({ series, color, integer, formatValue, ariaLabel, emptyText }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const H = 214;
  const n = series.length;
  const max = series.reduce((m, d) => Math.max(m, d.value), 0);
  const { top, ticks } = axisFor(max, integer);
  const tickLabels = ticks.map((t) => fmt(t));
  const ml = Math.max(...tickLabels.map((l) => l.length)) * 7 + 16;
  const m = { t: 12, r: 10, b: 28, l: ml };
  const iw = Math.max(10, width - m.l - m.r);
  const ih = H - m.t - m.b;
  const band = n ? iw / n : iw;
  const bw = Math.min(30, Math.max(2, band * 0.64));
  const y = (v) => m.t + ih - (v / top) * ih;
  const xc = (i) => m.l + band * (i + 0.5);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - r.left - m.l) / band);
    setHover(n && i >= 0 && i < n ? i : null);
  };

  const labelIdx = xLabelIdx(n, iw);

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={ariaLabel} style={{ display: 'block', touchAction: 'pan-y' }}
          onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((t, k) => (
            <g key={t}>
              <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} className={'grid-line' + (k === 0 ? ' zero' : '')} />
              <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="axis-text">{tickLabels[k]}</text>
            </g>
          ))}
          {hover !== null && <rect className="hover-band" x={m.l + band * hover} y={m.t} width={band} height={ih} rx="4" />}
          {series.map((d, i) => d.value > 0 && (
            <rect key={d.date} x={xc(i) - bw / 2} y={y(d.value)} width={bw} height={Math.max(2, y(0) - y(d.value))} rx={Math.min(4, bw / 2)}
              style={{ fill: color, opacity: hover === null || hover === i ? 1 : 0.5 }} />
          ))}
          {labelIdx.map((i) => (
            <text key={i} x={Math.min(Math.max(xc(i), 26), width - 26)} y={H - 8} textAnchor="middle" className="axis-text">{dateShort(series[i].date)}</text>
          ))}
        </svg>
      )}
      {n === 0 && <div className="chart-empty"><span>{emptyText}</span></div>}
      {hover !== null && series[hover] && width > 0 && (
        <div className="tip" style={{ left: Math.min(Math.max(xc(hover), 70), width - 70), top: Math.max(0, y(series[hover].value) - 62) }}>
          <div className="t-date">{dateLong(series[hover].date)}</div>
          <div className="t-val">{formatValue(series[hover].value)}</div>
        </div>
      )}
    </div>
  );
}