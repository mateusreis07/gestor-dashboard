import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    CartesianGrid,
    LabelList
} from 'recharts';
import styles from './CategoryChart.module.css';
import type { CategoryData } from '../../utils/types';

interface Props {
    data: CategoryData[];
    title?: string;
}

// Brand Gradient for bars
const COLORS = [
    '#1890ff', // Primary Blue
    '#13c2c2', // Cyan
    '#52c41a', // Green
    '#faad14', // Yellow
    '#f5222d', // Red
];

export function CategoryChart({ data, title = "Categorias de Chamados" }: Props) {
    const chartData = useMemo(() => {
        // Top 5 only, sorted descending
        return data
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className={styles.card}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.subtitle}>Nenhum dado disponível</p>
            </div>
        );
    }


    return (
        <div className={styles.card}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>Principais tipos de solicitações (Top 5).</p>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                        barSize={24}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={180} // Increased width for longer names
                            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {chartData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    fillOpacity={0.9}
                                />
                            ))}
                            <LabelList dataKey="value" position="right" fill="#6b7280" fontSize={12} fontWeight={600} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
