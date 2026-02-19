import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './OriginChart.module.css';
import type { OriginData } from '../../utils/types';

interface Props {
    data: OriginData[];
}

// Fixed brand colors for known entities
const BRAND_COLORS: Record<string, string> = {
    'WhatsApp': '#1890ff', // Blue
    'Monitoramento': '#13c2c2', // Cyan
    'CAU': '#52c41a', // Green
    'Email': '#faad14', // Yellow
    'Telefone': '#722ed1', // Purple
    'Phone': '#722ed1', // Purple alias
    'Pessoalmente': '#f5222d', // Red
    'Atendimento presencial': '#f5222d', // Red alias
    'Globalbot': '#2f54eb', // Deep Blue
    'Formcreator': '#eb2f96', // Magenta
    'Helpdesk': '#fa541c', // Orange red
};

// Fallback palette for unknown categories to ensure they are NOT gray
const PALETTE = [
    '#1890ff', // Blue
    '#13c2c2', // Cyan
    '#52c41a', // Green
    '#faad14', // Yellow
    '#f5222d', // Red
    '#722ed1', // Purple
    '#eb2f96', // Magenta
    '#fa541c', // Volcano
    '#2f54eb', // Geek Blue
    '#a0d911', // Lime
    '#fa8c16', // Orange
    '#3f6600', // Olive
];

const DEFAULT_COLOR = '#d9d9d9'; // Only used for inactive state dimming

export function OriginChart({ data }: Props) {
    const [activeName, setActiveName] = useState<string | null>(null);

    const chartData = useMemo(() => {
        return data
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [data]);

    const total = useMemo(() =>
        data.reduce((acc, curr) => acc + curr.value, 0),
        [data]);

    const activeValue = useMemo(() => {
        if (!activeName) return total;
        return data.find(d => d.name === activeName)?.value || 0;
    }, [activeName, data, total]);

    const handleToggle = (name: string) => {
        setActiveName(prev => (prev === name ? null : name));
    };

    // Helper to get color consistently
    const getColor = (name: string, index: number) => {
        // 1. Check direct match
        if (BRAND_COLORS[name]) return BRAND_COLORS[name];

        // 2. Check normalized match (case insensitive)
        const normalized = Object.keys(BRAND_COLORS).find(k => k.toLowerCase() === name.toLowerCase());
        if (normalized) return BRAND_COLORS[normalized];

        // 3. Fallback to palette based on index
        return PALETTE[index % PALETTE.length];
    };

    if (data.length === 0) {
        return (
            <div className={styles.card}>
                <h3 className={styles.title}>Origem da Requisição</h3>
                <p className={styles.subtitle}>Nenhum dado disponível</p>
            </div>
        )
    }

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Origem da Requisição</h3>
            <p className={styles.subtitle}>Distribuição por canal de atendimento.</p>

            <div className={styles.chartContainer}>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={3}
                                dataKey="value"
                                onClick={(data) => handleToggle(data.name)}
                                cursor="pointer"
                                stroke="none"
                                label={({ value }) => value}
                                labelLine={true}
                            >
                                {chartData.map((entry, index) => {
                                    const isActive = activeName === entry.name;
                                    const isDimmed = activeName && !isActive;
                                    const color = getColor(entry.name, index);

                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            stroke="none"
                                            style={{
                                                transition: 'all 0.3s ease',
                                                filter: isActive ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))' : 'none',
                                                opacity: isDimmed ? 0.3 : 1
                                            }}
                                        />
                                    );
                                })}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={false}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className={styles.legend}>
                    {chartData.map((item, index) => {
                        const isActive = activeName === item.name;
                        const isDimmed = activeName && !isActive;
                        const color = getColor(item.name, index);

                        return (
                            <div
                                key={item.name}
                                className={`${styles.legendItem} ${isDimmed ? styles.inactive : ''}`}
                                onClick={() => handleToggle(item.name)}
                            >
                                <span
                                    className={styles.legendColor}
                                    style={{ backgroundColor: color }}
                                />
                                <span className={styles.legendText}>{item.name}</span>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.totalContainer}>
                    <span className={styles.totalValue}>{activeValue}</span>
                    <span className={styles.totalLabel}>
                        {activeName ? `Requisições via ${activeName}` : 'Total de requisições'}
                    </span>
                </div>
            </div>
        </div>
    );
}
