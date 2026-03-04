import React, { useEffect, useState, useCallback } from 'react';
import { Brain, TrendingUp, AlertTriangle, Trophy, BarChart3, X, Sparkles } from 'lucide-react';
import { teamService } from '../../services/teamService';
import styles from './InsightsPanel.module.css';

interface Insight {
  tipo: string;
  titulo: string;
  descricao: string;
  metricaDeApoio: string;
}

interface InsightsPanelProps {
  teamId: string;
  month: string;
  onClose?: () => void;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ teamId, month, onClose }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [modeloUsado, setModeloUsado] = useState<string | null>(null);
  const [cotaDiaria, setCotaDiaria] = useState<string | null>(null);
  const [usoHoje, setUsoHoje] = useState<number>(0);

  const fetchInsights = useCallback(async (force = false) => {
    if (!teamId || !month) return;
    setLoading(true);
    setError(null);
    try {
      // Quando force=true (clique no botão), manda forçar atualização na API também
      const data = await teamService.getInsights(teamId, month, force);
      const generatedInsights = data.insights || [];
      setInsights(generatedInsights);
      setModeloUsado(data.modeloUsado || null);
      setCotaDiaria(data.cotaDiaria || null);
      setUsoHoje(data.usoHoje || 0);
      setHasLoaded(generatedInsights.length > 0);
    } catch (err: any) {
      console.error('Erro ao buscar insights:', err);
      setError(err?.response?.data?.error || 'Falha ao buscar/gerar insights.');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, month]);

  // Load Insights Automatically (Backend will return cached DB if not forced)
  useEffect(() => {
    fetchInsights(false);
  }, [month, fetchInsights]);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return <AlertTriangle size={20} />;
      case 'sucesso': return <Trophy size={20} />;
      default: return <BarChart3 size={20} />;
    }
  };

  const getCardClass = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return styles.cardAlerta;
      case 'sucesso': return styles.cardSucesso;
      default: return styles.cardNeutro;
    }
  };

  const getIconClass = (tipo: string) => {
    switch (tipo) {
      case 'alerta': return styles.iconAlerta;
      case 'sucesso': return styles.iconSucesso;
      default: return styles.iconNeutro;
    }
  };

  const renderSkeleton = () => (
    <div className={styles.cardsGrid}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonIcon} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineFull}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
          <div className={styles.skeletonMetric} />
        </div>
      ))}
    </div>
  );

  return (
    <section className={styles.insightsSection}>
      <div className={styles.insightsHeader}>
        <div className={styles.insightsTitle}>
          <Brain size={22} color="#0ea5e9" />
          Central de Insights
          <span className={styles.insightsBadge}>GEMINI AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => fetchInsights(true)}
            disabled={loading}
            title="Gerar / Atualizar insights com IA"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid transparent',
              background: loading
                ? 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)'
                : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              backgroundSize: loading ? '200% auto' : 'auto',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading
                ? '0 0 15px rgba(139, 92, 246, 0.6)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              animation: loading ? 'shimmer 2s linear infinite' : 'none',
              opacity: loading ? 0.9 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
              }
            }}
          >
            <style>
              {`
                @keyframes shimmer {
                  to { background-position: 200% center; }
                }
                @keyframes sparkle-pulse {
                  0%, 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 2px rgba(255,255,255,0.8)); }
                  50% { transform: scale(1.1); opacity: 0.8; filter: drop-shadow(0 0 6px rgba(255,255,255,1)); }
                }
              `}
            </style>
            {loading ? (
              <Sparkles size={18} style={{ animation: 'sparkle-pulse 1s ease-in-out infinite', color: '#e0f2fe' }} />
            ) : (
              <Sparkles size={18} color="#38bdf8" />
            )}
            {loading ? 'Analisando dados...' : hasLoaded ? 'Refazer Análise' : 'Gerar Insights'}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer',
                padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', width: '36px', height: '36px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              title="Fechar Central de Insights"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {loading && renderSkeleton()}

      {error && !loading && (
        <div className={styles.errorState}>
          <AlertTriangle size={28} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && insights.length > 0 && (
        <div className={styles.cardsGrid}>
          {insights.map((insight, idx) => (
            <div key={idx} className={`${styles.card} ${getCardClass(insight.tipo)}`}>
              <div className={`${styles.cardIcon} ${getIconClass(insight.tipo)}`}>
                {getIcon(insight.tipo)}
              </div>
              <div className={styles.cardTitle}>{insight.titulo}</div>
              <div className={styles.cardDesc}>{insight.descricao}</div>
              <span className={styles.cardMetric}>
                <TrendingUp size={13} />
                {insight.metricaDeApoio}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER: LEGEND AND MODEL INFO */}
      {!loading && !error && insights.length > 0 && (
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.85rem'
        }}>
          {/* LEGENDA */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#64748b' }}>Legenda:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}>
              <Trophy size={16} /> <span>Destaque Positivo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
              <AlertTriangle size={16} /> <span>Ponto Crítico</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6' }}>
              <BarChart3 size={16} /> <span>Observação Estratégica</span>
            </div>
          </div>

          {/* MODELO E QUOTA */}
          {modeloUsado && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Brain size={14} />
                Refino: <strong>{modeloUsado}</strong>
              </div>
              {cotaDiaria && (
                <>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} />
                    Uso Hoje: <strong style={{ color: usoHoje >= 15 ? '#ef4444' : 'inherit' }}>{usoHoje}</strong> / {cotaDiaria.split(' ')[0]} análises
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !error && !hasLoaded && (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          background: '#f8fafc',
          borderRadius: '16px',
          border: '1px dashed #cbd5e1',
          color: '#94a3b8',
          fontSize: '0.9rem'
        }}>
          <Brain size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Clique em <strong>"Gerar Insights"</strong> para a IA analisar os dados de <strong>{month}</strong>.</p>
        </div>
      )}
    </section>
  );
};

export default InsightsPanel;
