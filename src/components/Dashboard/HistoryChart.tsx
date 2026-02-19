
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from 'recharts';
import styles from './HistoryChart.module.css';
import type { HistoryData } from '../../utils/types';

interface Props {
    data: HistoryData[];
    title?: string;
}

export function HistoryChart({ data, title = "Histórico de Chamados" }: Props) {
    // Check if data is empty (all zeros)
    const hasData = data.some(d => d.value > 0);

    if (!hasData) {
        return (
            <div className={styles.card}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.subtitle}>Nenhum dado disponível</p>
            </div>
        );
    }

    // Filter out future months if they are 0?
    // Or show all year? Usually for "History per Month" showing the whole year is good structure.
    // But maybe trim leading zeros if they are from last year?
    // Let's Keep all 12 months as fixed X-Axis for consistency.

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>Evolução mensal de aberturas de chamados.</p>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 20, // More space for top labels
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                        barSize={32}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            interval={0}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                            contentStyle={{
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: any) => [value, "Chamados"]}
                        />
                        <Bar
                            dataKey="value"
                            fill="#1890ff"
                            radius={[4, 4, 0, 0]}
                        >
                            <LabelList dataKey="value" position="top" fill="#6b7280" fontSize={12} fontWeight={600} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
