import React, { useEffect, useState } from 'react';
import { healthScoreService, type HealthScoreHistoryData } from '../../services/healthScoreService';
import { HeartPulse, Activity, Crosshair, Target } from 'lucide-react';
import styles from './HealthScoreGauge.module.css';

interface HealthScoreGaugeProps {
  teamId: string;
  month: string;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ teamId, month }) => {
  const [history, setHistory] = useState<HealthScoreHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !month) return;

    setLoading(true);
    healthScoreService.getScore(teamId, month)
      .then(data => {
        if (data.status === 'empty') {
          setHistory(null);
        } else if (data.history) {
          setHistory(data.history);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar Health Score", err);
        setLoading(false);
      });
  }, [teamId, month]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingSkeleton}>Calculando saúde da operação...</div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className={styles.cardHeaderOnly}>
        <div className={styles.headerTitle}>
          <HeartPulse size={20} className={styles.iconGhost} />
          <h3>Health Score</h3>
        </div>
        <p className={styles.noData}>Aguardando dados de {month} para calcular.</p>
      </div>
    );
  }

  const { scoreTotal, scoreTMA, scoreProdutiv, scoreCapacidade } = history;

  // Determine color based on score
  let colorClass = styles.green;
  if (scoreTotal < 60) colorClass = styles.red;
  else if (scoreTotal < 80) colorClass = styles.yellow;

  // Calculate circumference for SVG circle
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scoreTotal / 100) * circumference;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <HeartPulse size={20} className={styles.iconHeart} />
          <h3>Health Score</h3>
        </div>
      </div>

      <div className={styles.gaugeContainer}>
        <div className={styles.gaugeWrapper}>
          <svg className={styles.svgGauge} viewBox="0 0 150 150">
            {/* Background Circle */}
            <circle
              cx="75" cy="75" r={radius}
              className={styles.circleBg}
            />
            {/* Progress Circle */}
            <circle
              cx="75" cy="75" r={radius}
              className={`${styles.circleProgress} ${colorClass}`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset
              }}
            />
          </svg>
          <div className={styles.gaugeTextContent}>
            <span className={`${styles.gaugeScore} ${colorClass}`}>{scoreTotal.toFixed(1)}</span>
            <span className={styles.gaugeLabel}>/100</span>
          </div>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}><Activity size={14} /> SLA/TMA</span>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${scoreTMA}%`, background: scoreTMA > 70 ? '#10b981' : (scoreTMA > 40 ? '#f59e0b' : '#ef4444') }}></div>
          </div>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}><Crosshair size={14} /> Produtividade</span>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${scoreProdutiv}%`, background: scoreProdutiv > 70 ? '#10b981' : (scoreProdutiv > 40 ? '#f59e0b' : '#ef4444') }}></div>
          </div>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}><Target size={14} /> Capacidade</span>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${scoreCapacidade}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
