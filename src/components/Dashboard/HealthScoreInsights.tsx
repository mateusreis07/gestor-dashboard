import React, { useEffect, useState } from 'react';
import { healthScoreService } from '../../services/healthScoreService';
import { Activity, Crosshair, Target, Clock, Layers, X, AlertTriangle, Info } from 'lucide-react';

interface HealthScoreInsightsProps {
  teamId: string;
  month: string;
}

export const HealthScoreInsights: React.FC<HealthScoreInsightsProps> = ({ teamId, month }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId || !month) return;
    setLoading(true);
    healthScoreService.getDetails(teamId, month)
      .then(data => {
        if (data.status === 'empty') {
          setDetails(null);
        } else {
          setDetails(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar detalhes do Health Score", err);
        setLoading(false);
      });
  }, [teamId, month]);

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '24px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: '1 1 200px', height: '120px', background: '#f8fafc', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (!details || !details.pillars) {
    return null; // The gauge already shows "Aguardando dados".
  }

  const { pillars, offender, configUsed } = details;

  const pillarIcons: any = {
    sla: <Clock size={24} />,
    tma: <Activity size={24} />,
    backlog: <Layers size={24} />,
    capacidade: <Target size={24} />,
    produtividade: <Crosshair size={24} />
  };

  const pillarTitles: any = {
    sla: 'Cumprimento de SLA',
    tma: 'Tempo Médio (TMA)',
    backlog: 'Volume de Backlog',
    capacidade: 'Carga vs Capacidade',
    produtividade: 'Produtividade'
  };

  const openDrillDown = (key: string) => {
    setSelectedPillar(key);
  };

  return (
    <div style={{ marginTop: '32px' }}>

      <div style={{ marginBottom: '24px', background: '#f8fafc', borderLeft: '4px solid #0ea5e9', padding: '16px 24px', borderRadius: '0 12px 12px 0' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={18} color="#0ea5e9" /> Diagnóstico do Algoritmo
        </h3>
        <p style={{ margin: 0, color: '#475569', lineHeight: '1.5' }}>
          O Score atual é reflexo direto dos pesos configurados.
          {offender && (
            <span> O principal ponto de atenção/gargalo neste mês foi <strong>{pillarTitles[offender]}</strong>.</span>
          )}
        </p>
      </div>

      <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '16px', fontWeight: 700 }}>Pilares da Avaliação</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {Object.entries(pillars).map(([key, data]: [string, any]) => {
          if (key === 'sla' && !configUsed.useSLA) return null;

          // Determine status color
          let color = '#10b981'; // green
          let bg = '#ecfdf5';
          if (data.score < 50) { color = '#ef4444'; bg = '#fef2f2'; }
          else if (data.score < 80) { color = '#f59e0b'; bg = '#fffbeb'; }

          return (
            <div
              key={key}
              onClick={() => openDrillDown(key)}
              style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px',
                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ background: bg, color: color, padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pillarIcons[key]}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: '1' }}>{data.score.toFixed(1)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>NOTA PURA (0-100)</div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#1e293b' }}>{pillarTitles[key]}</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Peso: {(data.effectiveWeight * 100).toFixed(1)}% → Renderá até {(100 * data.effectiveWeight).toFixed(1)} pts
              </p>

              {key === offender && (
                <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={10} /> OFENSOR
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedPillar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#0ea5e9', color: '#fff', padding: '12px', borderRadius: '14px', display: 'flex' }}>
                  {pillarIcons[selectedPillar]}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>{pillarTitles[selectedPillar]}</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Raio-X de Cálculo Detalhado</p>
                </div>
              </div>
              <button onClick={() => setSelectedPillar(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '32px 24px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Nota Gerada</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: pillars[selectedPillar].score < 60 ? '#ef4444' : pillars[selectedPillar].score < 80 ? '#f59e0b' : '#10b981', lineHeight: '1' }}>
                    {pillars[selectedPillar].score.toFixed(1)}
                  </div>
                </div>
                <div style={{ borderLeft: '1px dashed #cbd5e1', margin: '0 16px' }}></div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Impacto Final</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: '1', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                    +{pillars[selectedPillar].contribution.toFixed(1)} <span style={{ fontSize: '1rem', color: '#94a3b8', marginLeft: '4px', fontWeight: 600 }}>pts</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '1px' }}>Memória Qualitativa de Variáveis</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {Object.entries(pillars[selectedPillar].raw).map(([k, v]: [string, any]) => (
                    <div key={k} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                        {typeof v === 'number' ? (v % 1 !== 0 ? v.toFixed(2) : v) : v}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: '16px', borderRadius: '12px', color: '#0369a1', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <strong>Regra de Negócio Algorítmica:</strong><br />
                  {pillars[selectedPillar].formula}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
