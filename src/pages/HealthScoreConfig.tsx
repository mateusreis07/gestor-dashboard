import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { healthScoreService, type HealthScoreConfigData } from '../services/healthScoreService';
import { ArrowLeft, Save, HeartPulse, Sliders, Activity, Clock, Layers, Users, ShieldAlert, CheckCircle } from 'lucide-react';

export const HealthScoreConfig: React.FC = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState<HealthScoreConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!teamId) return;
    healthScoreService.getConfig(teamId).then(data => {
      setConfig(data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load health score config", err);
      setLoading(false);
    });
  }, [teamId]);

  const handleSave = async () => {
    if (!teamId || !config) return;
    setSaving(true);
    try {
      // Need to make sure weights sum to 100% implicitly or keep them relative.
      await healthScoreService.updateConfig(teamId, config);
      setSuccessMsg('Configurações salvas e versionadas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Failed to save config", error);
      alert("Erro ao salvar opções.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  if (!config) return <div>Erro ao carregar configurações.</div>;

  const sectionStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    marginTop: '6px',
    transition: 'border-color 0.2s'
  };

  const flexRow: React.CSSProperties = { display: 'flex', gap: '24px', flexWrap: 'wrap' };
  const fieldWrap: React.CSSProperties = { flex: '1 1 200px', minWidth: '200px' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(`/app/team/${teamId}`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px',
            background: '#ffffff', border: '1px solid #e2e8f0', width: '42px', height: '42px', padding: 0,
            borderRadius: '12px', justifyContent: 'center', color: '#64748b'
          }}
        >
          <ArrowLeft size={20} />
        </button>

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}>
              <HeartPulse size={26} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Health Score Config
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
                Defina as metas e pesos operacionais para a nota de saúde (0-100)
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#0ea5e9', color: '#fff', border: 'none', padding: '12px 24px',
              borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, display: 'flex',
              alignItems: 'center', gap: '8px', cursor: 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </header>

        {successMsg && (
          <div style={{ background: '#dcfce3', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        {/* --- MODO DE CÁLCULO --- */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', color: '#0f172a' }}>
            <Sliders size={20} color="#0ea5e9" /> Modo de Avaliação
          </h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: '50px', height: '26px' }}>
              <input
                type="checkbox"
                checked={config.useSLA}
                onChange={(e) => setConfig({ ...config, useSLA: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: config.useSLA ? '#0ea5e9' : '#cbd5e1',
                borderRadius: '26px', transition: '.4s'
              }}></span>
              <span style={{
                position: 'absolute', height: '20px', width: '20px', left: config.useSLA ? '26px' : '3px', bottom: '3px',
                backgroundColor: 'white', borderRadius: '50%', transition: '.4s'
              }}></span>
            </div>
            <span style={{ fontWeight: 600, color: '#334155' }}>Habilitar Cálculo com base em SLA (Contrato)</span>
          </label>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px', lineHeight: 1.5 }}>
            Se desativado, o Health Score irá redistribuir o peso do SLA para os outros 4 indicadores vitais (TMA, Backlog, Produtividade, Capacidade).
          </p>
        </div>

        {/* --- METAS INDIRETAS E GATILHOS --- */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', color: '#0f172a' }}>
            <Activity size={20} color="#10b981" /> Metas de Normalização
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '24px' }}>
            Defina o melhor e o pior cenário para sua operação. O algoritmo usará interpolação para transformar números brutos em pontuações de 0 a 100 pontos para cada pilar.
          </p>

          <div style={{ ...flexRow, marginBottom: '24px' }}>
            <div style={fieldWrap}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}><Clock size={14} /> TMA Ideal (Horas)</label>
              <input type="number" step="0.5" value={config.targetTMAHours} onChange={e => setConfig({ ...config, targetTMAHours: parseFloat(e.target.value) })} style={inputStyle} />
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>Leva a pontuação máxima 100.</small>
            </div>
            <div style={fieldWrap}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}><ShieldAlert size={14} /> TMA Crítico (Horas)</label>
              <input type="number" step="0.5" value={config.criticalTMAHours} onChange={e => setConfig({ ...config, criticalTMAHours: parseFloat(e.target.value) })} style={inputStyle} />
              <small style={{ color: '#e11d48', display: 'block', marginTop: '4px' }}>Causa pontuação 0 no pilar.</small>
            </div>
          </div>

          <div style={{ ...flexRow, marginBottom: '24px' }}>
            <div style={fieldWrap}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}><Layers size={14} /> Backlog Ideal (Vol)</label>
              <input type="number" value={config.targetBacklog} onChange={e => setConfig({ ...config, targetBacklog: parseInt(e.target.value) })} style={inputStyle} />
            </div>
            <div style={fieldWrap}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}><ShieldAlert size={14} /> Backlog Crítico (Vol)</label>
              <input type="number" value={config.criticalBacklog} onChange={e => setConfig({ ...config, criticalBacklog: parseInt(e.target.value) })} style={inputStyle} />
            </div>
          </div>

          <div style={flexRow}>
            <div style={fieldWrap}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}><Users size={14} /> Produtividade/Técnico</label>
              <input type="number" value={config.targetProdPerTech} onChange={e => setConfig({ ...config, targetProdPerTech: parseInt(e.target.value) })} style={inputStyle} />
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>Meta de chamados fechados por técnico/mês.</small>
            </div>
            <div style={fieldWrap}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}><Activity size={14} /> Capacidade Média/Técnico</label>
              <input type="number" value={config.avgCapacityPerTech} onChange={e => setConfig({ ...config, avgCapacityPerTech: parseInt(e.target.value) })} style={inputStyle} />
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>Limite de Tickets que 1 técnico consegue absorver/mês.</small>
            </div>
          </div>
        </div>

        {/* --- PESOS MATEMÁTICOS --- */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', color: '#0f172a' }}>
            <Sliders size={20} color="#8b5cf6" /> Pesos do Algoritmo (%)
          </h2>
          {(() => {
            const activeWeightSum = config.useSLA
              ? (config.weightSLA + config.weightTMA + config.weightBacklog + config.weightCapac + config.weightProd)
              : (config.weightTMA + config.weightBacklog + config.weightCapac + config.weightProd);

            const getEffectivePct = (weight: number, isSla = false) => {
              if (isSla && !config.useSLA) return '0%';
              if (activeWeightSum === 0) return '0%';
              return Math.round((weight / activeWeightSum) * 100) + '%';
            };

            return (
              <div style={flexRow}>
                <div style={{ flex: '1 1 120px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: config.useSLA ? '#334155' : '#94a3b8' }}>
                    Peso SLA <span style={{ color: config.useSLA ? '#0ea5e9' : '#94a3b8', marginLeft: 4 }}>({getEffectivePct(config.weightSLA, true)})</span>
                  </label>
                  <input type="number" step="0.05" value={config.weightSLA} onChange={e => setConfig({ ...config, weightSLA: parseFloat(e.target.value) })} style={inputStyle} disabled={!config.useSLA} />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Peso TMA <span style={{ color: '#0ea5e9', marginLeft: 4 }}>({getEffectivePct(config.weightTMA)})</span>
                  </label>
                  <input type="number" step="0.05" value={config.weightTMA} onChange={e => setConfig({ ...config, weightTMA: parseFloat(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Peso Backlog <span style={{ color: '#0ea5e9', marginLeft: 4 }}>({getEffectivePct(config.weightBacklog)})</span>
                  </label>
                  <input type="number" step="0.05" value={config.weightBacklog} onChange={e => setConfig({ ...config, weightBacklog: parseFloat(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Peso Capacidade <span style={{ color: '#0ea5e9', marginLeft: 4 }}>({getEffectivePct(config.weightCapac)})</span>
                  </label>
                  <input type="number" step="0.05" value={config.weightCapac} onChange={e => setConfig({ ...config, weightCapac: parseFloat(e.target.value) })} style={inputStyle} />
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Peso Produtiv. <span style={{ color: '#0ea5e9', marginLeft: 4 }}>({getEffectivePct(config.weightProd)})</span>
                  </label>
                  <input type="number" step="0.05" value={config.weightProd} onChange={e => setConfig({ ...config, weightProd: parseFloat(e.target.value) })} style={inputStyle} />
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
};
