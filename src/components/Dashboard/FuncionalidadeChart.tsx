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

const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const text = payload.value as string;

    // Try to split by " - " to separate Module from Functionality
    const parts = text.split(' - ');
    let line1 = text;
    let line2 = '';

    if (parts.length > 1) {
        line1 = parts[0];
        // Rejoin the rest in case there are multiple hyphens
        line2 = parts.slice(1).join(' - ');
    }

    // Truncate if still too long
    const maximize = (str: string, len: number) => str.length > len ? str.substring(0, len) + '...' : str;

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={parts.length > 1 ? -6 : 4} textAnchor="end" fill="#374151" fontSize={11} fontWeight={700}>
                {maximize(line1, 28)}
                {line2 && (
                    <tspan x={0} dy="14" fontSize={10} fontWeight={400} fill="#6b7280">
                        {maximize(line2, 35)}
                    </tspan>
                )}
            </text>
        </g>
    );
};

export function FuncionalidadeChart({ data }: Props) {
    if (data.length === 0) return null;

    // We don't truncate here anymore, we let the CustomTick handle it
    const chartData = data.slice(0, 5);
    const barHeight = 56; // Increased height to accommodate 2 lines of text
    const chartHeight = chartData.length * barHeight + 30;

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Chamados por Funcionalidade</h3>
            <p className={styles.subtitle}>Principais funcionalidades solicitadas (Top 5).</p>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 0, right: 30, bottom: 0, left: 10 }}
                        barCategoryGap="15%"
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={210} // Increased width for the labels
                            tick={<CustomYAxisTick />}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                        />
                        <Tooltip
                            formatter={(value: number | undefined) => [`${value ?? 0} chamados`, 'Quantidade']}
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
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
