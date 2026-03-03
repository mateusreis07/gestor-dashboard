import React, { useEffect, useState, useCallback } from 'react';
import { Brain, RefreshCw, TrendingUp, AlertTriangle, Trophy, BarChart3 } from 'lucide-react';
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
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ teamId, month }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!teamId || !month) return;
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.getInsights(teamId, month);
      setInsights(data.insights || []);
      setHasLoaded(true);
    } catch (err: any) {
      console.error('Erro ao buscar insights:', err);
      setError(err?.response?.data?.error || 'Falha ao gerar insights.');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, month]);

  // Auto-fetch when month changes
  useEffect(() => {
    setHasLoaded(false);
    setInsights([]);
  }, [month]);

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
        <button
          className={styles.refreshBtn}
          onClick={fetchInsights}
          disabled={loading}
          title="Gerar / Atualizar insights com IA"
        >
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          {loading ? 'Gerando...' : hasLoaded ? 'Atualizar' : 'Gerar Insights'}
        </button>
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
