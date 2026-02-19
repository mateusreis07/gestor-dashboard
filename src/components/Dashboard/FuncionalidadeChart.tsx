import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LabelList } from 'recharts';
import type { FuncionalidadeData } from '../../utils/types';
import styles from './FuncionalidadeChart.module.css';

interface Props {
    data: FuncionalidadeData[];
}

const COLORS = [
    '#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e', '#84cc16',
    '#eab308', '#f59e0b', '#f97316', '#ef4444', '#a855f7',
];

/** Truncate long names for the Y-axis labels */
function truncateName(name: string, maxLen = 30): string {
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen) + '…';
}

export function FuncionalidadeChart({ data }: Props) {
    if (data.length === 0) return null;

    const chartData = data.map(d => ({ ...d, displayName: truncateName(d.name) }));
    const barHeight = 48;
    const chartHeight = chartData.length * barHeight + 30;

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Chamados por Funcionalidade</h3>
            <p className={styles.subtitle}>Principais funcionalidades solicitadas (Top 10).</p>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 50, bottom: 0, left: 10 }}
                        barCategoryGap="20%"
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="displayName"
                            type="category"
                            width={180}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                        />
                        <Tooltip
                            formatter={(value: number | undefined) => [`${value ?? 0} chamados`, 'Quantidade']}
                            labelFormatter={(label: string) => {
                                // Show full name in tooltip
                                const item = data.find(d => truncateName(d.name) === label);
                                return item ? item.name : label;
                            }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                            <LabelList
                                dataKey="value"
                                position="right"
                                style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
