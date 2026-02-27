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
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                dataKey="value"
                                paddingAngle={2}
                                stroke="none"
                                cursor="pointer"
                                labelLine={false}
                                label={false}
                                onClick={(data) => onSliceClick && onSliceClick(data.name)}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        style={{ outline: 'none', transition: 'all 0.3s ease' }}
                                    />
                                ))}
                            </Pie>
                            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: 'none' }}>
                                <tspan x="50%" dy="-0.2em" fontSize={35} fontWeight={800} fill="#1f2937">
                                    {total}
                                </tspan>
                                <tspan x="50%" dy="1.5em" fill="#6b7280" fontSize={14} fontWeight={500}>
                                    Total
                                </tspan>
                            </text>
                            <Tooltip
                                formatter={(value: number | undefined) => [`${value ?? 0} chamados`, '']}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none', // Removed explicit solid border to match origin chart shadow style
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }}
                                cursor={false}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className={styles.legendList}>
                    {data.map((item, i) => (
                        <div
                            key={i}
                            className={styles.legendItem}
                            onClick={() => onSliceClick && onSliceClick(item.name)}
                        >
                            <div className={styles.legendItemLeft}>
                                <span
                                    className={styles.legendColor}
                                    style={{ background: item.color }}
                                />
                                <span className={styles.legendText}>{item.name}</span>
                            </div>
                            <span className={styles.legendValue}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
