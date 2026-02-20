import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatusData } from '../../utils/types';
import styles from './StatusChart.module.css';

interface Props {
    data: StatusData[];
    total: number;
    onSliceClick?: (statusName: string) => void;
}

export function StatusChart({ data, total, onSliceClick }: Props) {
    if (data.length === 0) return null;

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Status dos Chamados</h3>
            <p className={styles.subtitle}>Distribuição por status atual. (Clique para detalhar)</p>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            dataKey="value"
                            paddingAngle={3}
                            stroke="none"
                            cursor="pointer"
                            onClick={(data) => onSliceClick && onSliceClick(data.name)}
                        >
                            {data.map((entry, i) => (
                                <Cell key={i} fill={entry.color} style={{ outline: 'none' }} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number | undefined) => [`${value ?? 0} chamados`, '']}
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.legend}>
                {data.map((item, i) => (
                    <div
                        key={i}
                        className={styles.legendItem}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onSliceClick && onSliceClick(item.name)}
                    >
                        <span
                            className={styles.legendColor}
                            style={{ background: item.color }}
                        />
                        <span className={styles.legendText}>{item.name}</span>
                        <span className={styles.legendValue}>{item.value}</span>
                    </div>
                ))}
            </div>

            <div className={styles.totalContainer}>
                <span className={styles.totalValue}>{total}</span>
                <span className={styles.totalLabel}>Total de chamados</span>
            </div>
        </div>
    );
}
