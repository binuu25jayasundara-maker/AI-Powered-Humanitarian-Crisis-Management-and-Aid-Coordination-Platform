import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { CaseStatus, Urgency } from '../../types/coordination';
import { LOW_CONFIDENCE_THRESHOLD } from '../../services/coordinationApi';
import '../../styles/coordination.css';

// ==========================================
// Colour helpers (all from the platform palette)
// ==========================================
export const URGENCY_COLOR: Record<Urgency, string> = {
  Critical: '#DC3545',
  High: '#FFB51B',
  Medium: '#0866C6',
  Low: '#12A86B'
};

const URGENCY_BADGE: Record<Urgency, string> = {
  Critical: 'badge-red',
  High: 'badge-amber',
  Medium: 'badge-blue',
  Low: 'badge-green'
};

const STATUS_BADGE: Record<CaseStatus, string> = {
  Open: 'badge-blue',
  'In Progress': 'badge-navy',
  Escalated: 'badge-red',
  Unresolved: 'badge-amber',
  Resolved: 'badge-green'
};

export const STATUS_COLOR: Record<CaseStatus, string> = {
  Open: '#0866C6',
  'In Progress': '#0B3B70',
  Escalated: '#DC3545',
  Unresolved: '#FFB51B',
  Resolved: '#12A86B'
};

export const UrgencyBadge: React.FC<{ urgency: Urgency }> = ({ urgency }) => (
  <span className={`badge ${URGENCY_BADGE[urgency]}`}>{urgency}</span>
);

export const StatusBadge: React.FC<{ status: CaseStatus }> = ({ status }) => (
  <span className={`badge ${STATUS_BADGE[status]}`}>{status}</span>
);

export const FallbackBadge: React.FC = () => (
  <span className="badge badge-amber" title="The AI model was unavailable or uncertain; a rule-based fallback produced this result">
    Fallback
  </span>
);

export const confidenceColor = (c: number): string =>
  c >= 0.85 ? '#12A86B' : c >= LOW_CONFIDENCE_THRESHOLD ? '#0866C6' : c >= 0.6 ? '#FFB51B' : '#DC3545';

export const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="co-conf">
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${Math.round(value * 100)}%`, backgroundColor: confidenceColor(value) }} />
    </div>
    <span className="co-conf-value" style={{ color: confidenceColor(value) }}>
      {Math.round(value * 100)}%
    </span>
  </div>
);

// ==========================================
// Layout building blocks
// ==========================================
export const PageHeader: React.FC<{
  badges?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ badges, title, subtitle, actions }) => (
  <div className="co-page-header">
    <div>
      {badges && <div className="co-badge-row">{badges}</div>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="co-actions">{actions}</div>}
  </div>
);

export const Panel: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, action, className, children }) => (
  <div className={`card ${className || ''}`}>
    {(title || action) && (
      <div className="co-panel-head">
        <div>
          {title && <h2 className="co-panel-title">{title}</h2>}
          {subtitle && <p className="co-panel-sub">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'navy';

export const KpiCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: Tone;
}> = ({ label, value, hint, icon, tone = 'blue' }) => (
  <div className="co-kpi">
    <div className={`co-kpi-icon co-tone-${tone}`}>{icon}</div>
    <div>
      <div className="co-kpi-label">{label}</div>
      <div className="co-kpi-value">{value}</div>
      {hint && <div className="co-kpi-hint">{hint}</div>}
    </div>
  </div>
);

export const Tabs: React.FC<{
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="co-tabs" role="tablist">
    {tabs.map((t) => (
      <button
        key={t.key}
        role="tab"
        aria-selected={active === t.key}
        className={`co-tab ${active === t.key ? 'active' : ''}`}
        onClick={() => onChange(t.key)}
      >
        {t.label}
        {t.count !== undefined && <span className="co-tab-count">{t.count}</span>}
      </button>
    ))}
  </div>
);

export const Modal: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, subtitle, onClose, children, footer }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box co-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <h3 className="co-modal-title">{title}</h3>
      {subtitle && <p className="co-modal-sub">{subtitle}</p>}
      {children}
      {footer && <div className="co-modal-footer">{footer}</div>}
    </div>
  </div>
);

export const EmptyState: React.FC<{ title: string; message?: string }> = ({ title, message }) => (
  <div className="co-empty">
    <strong>{title}</strong>
    {message}
  </div>
);

export const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
  label,
  className,
  children
}) => (
  <div className={className}>
    <label className="co-label">{label}</label>
    {children}
  </div>
);

// ==========================================
// Toast
// ==========================================
export const useToast = (): [React.ReactNode, (message: string) => void] => {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 3200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const node = message ? (
    <div className="toast-success co-toast" role="status">
      <CheckCircle size={18} /> {message}
    </div>
  ) : null;

  return [node, show];
};

// ==========================================
// Charts (dependency-free SVG)
// ==========================================
const niceMax = (max: number): number => {
  if (max <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

export const BarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  height?: number;
  defaultColor?: string;
}> = ({ data, height = 220, defaultColor = '#0866C6' }) => {
  const W = 520;
  const H = height;
  const pad = { l: 34, r: 10, t: 14, b: 30 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const band = innerW / Math.max(1, data.length);
  const barW = Math.min(56, band * 0.6);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="co-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img">
        {ticks.map((t) => {
          const y = pad.t + innerH - innerH * t;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#D5E4F3" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#526784">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = pad.l + band * i + (band - barW) / 2;
          const y = pad.t + innerH - h;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={h} rx={5} fill={d.color || defaultColor} />
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#102B5C">
                {d.value}
              </text>
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="#526784">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const HBarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  defaultColor?: string;
}> = ({ data, defaultColor = '#0866C6' }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      {data.map((d) => (
        <div key={d.label} className="co-shortage">
          <div className="co-shortage-head">
            <span>{d.label}</span>
            <span className="co-muted">{d.value}</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || defaultColor }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
  area?: boolean;
}

export const LineChart: React.FC<{
  labels: string[];
  series: LineSeries[];
  height?: number;
  labelEvery?: number;
}> = ({ labels, series, height = 240, labelEvery = 1 }) => {
  const W = 620;
  const H = height;
  const pad = { l: 36, r: 14, t: 14, b: 30 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const stepX = labels.length > 1 ? innerW / (labels.length - 1) : innerW;
  const px = (i: number) => pad.l + stepX * i;
  const py = (v: number) => pad.t + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="co-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img">
        {ticks.map((t) => {
          const y = pad.t + innerH - innerH * t;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#D5E4F3" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#526784">
                {Math.round(max * t)}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) =>
          i % labelEvery === 0 ? (
            <text key={l + i} x={px(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#526784">
              {l}
            </text>
          ) : null
        )}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${px(i)},${py(v)}`).join(' ');
          const areaPath = `M ${px(0)},${py(0)} L ${pts.replace(/ /g, ' L ')} L ${px(s.values.length - 1)},${py(0)} Z`;
          return (
            <g key={s.name}>
              {s.area && <path d={areaPath} fill={s.color} opacity={0.12} />}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {s.values.length <= 16 &&
                s.values.map((v, i) => <circle key={i} cx={px(i)} cy={py(v)} r={3.2} fill="#fff" stroke={s.color} strokeWidth={2} />)}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="co-legend">
          {series.map((s) => (
            <span key={s.name}>
              <span className="co-legend-dot" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const DonutChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  centerLabel?: string;
}> = ({ data, centerLabel }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="co-donut-wrap co-chart">
      <svg viewBox="0 0 180 180" role="img">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#EDF6FF" strokeWidth="24" />
        {total > 0 &&
          data.map((d) => {
            const len = (d.value / total) * C;
            const el = (
              <circle
                key={d.label}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth="24"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 90 90)"
              />
            );
            offset += len;
            return el;
          })}
        <text x="90" y="88" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0B3B70">
          {total}
        </text>
        <text x="90" y="106" textAnchor="middle" fontSize="10" fill="#526784">
          {centerLabel || 'total'}
        </text>
      </svg>
      <div className="co-legend" style={{ flexDirection: 'column', gap: 8 }}>
        {data.map((d) => (
          <span key={d.label}>
            <span className="co-legend-dot" style={{ background: d.color }} />
            {d.label} <strong style={{ color: '#102B5C' }}>{d.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
};
