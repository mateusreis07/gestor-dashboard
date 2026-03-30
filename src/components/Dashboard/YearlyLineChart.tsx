import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface YearlyLineChartProps {
    data: { name: string; value: number }[];
    title: string;
    color: string;
    isExporting?: boolean;
}

const formatValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR').format(val);
};

export const YearlyLineChart: React.FC<YearlyLineChartProps> = ({ data, title, color, isExporting }) => {
    // Renderizar tooltip customizado
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
                }}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#0f172a' }}>
                        {label}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: color }}>
                            {formatValue(payload[0].value)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            marginBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            height: '300px'
        }}>
            <h2 style={{
                textAlign: 'center',
                color: color || '#4f46e5',
                fontSize: '1.5rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                margin: '0 0 24px 0',
                letterSpacing: '0.05em'
            }}>
                {title}
            </h2>

            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => formatValue(value)}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />

                        <Line
                            type="linear" 
                            dataKey="value"
                            stroke={color || '#4f46e5'}
                            strokeWidth={3}
                            dot={{ r: 5, strokeWidth: 2, fill: color, stroke: 'white' }}
                            activeDot={{ r: 7, strokeWidth: 0, fill: color }}
                            isAnimationActive={!isExporting}
                            label={{
                                position: 'top',
                                fill: '#475569',
                                fontSize: 12,
                                fontWeight: 600,
                                formatter: (val: any) => formatValue(Number(val)),
                                dy: -10
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
