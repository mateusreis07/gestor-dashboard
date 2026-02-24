import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Briefcase, Calendar, Edit, Save, X, Trash2, Plus, LineChart, ArrowLeft, GraduationCap } from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { loadCorporateData, saveCorporateData } from '../utils/corporateData';
import type { CorporateData } from '../utils/corporateData';

export function CorporateDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<CorporateData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CorporateData | null>(null);

  useEffect(() => {
    const loaded = loadCorporateData();
    setData(loaded);
    setEditData(JSON.parse(JSON.stringify(loaded))); // Deep copy for edit
  }, []);

  const handleSave = () => {
    if (editData) {
      saveCorporateData(editData);
      setData(editData);
      setIsEditing(false);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const ptMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    return months.map((m, idx) => ({
      name: ptMonths[idx],
      '2023': data.calls2023[m as keyof typeof data.calls2023] || 0,
      '2024': data.calls2024[m as keyof typeof data.calls2024] || 0,
      '2025': data.calls2025[m as keyof typeof data.calls2025] || 0,
      '2026': data.calls2026[m as keyof typeof data.calls2026] || 0,
    }));
  }, [data]);

  const handleEditMonth = (year: 'calls2023' | 'calls2024' | 'calls2025' | 'calls2026', month: string, value: string) => {
    if (!editData) return;
    const val = parseInt(value, 10);
    setEditData({
      ...editData,
      [year]: {
        ...editData[year],
        [month]: isNaN(val) ? 0 : val
      }
    });
  };

  const handleAddProject = () => {
    if (!editData) return;
    setEditData({ ...editData, projects: [...editData.projects, "Novo Projeto"] });
  };

  const handleUpdateProject = (idx: number, val: string) => {
    if (!editData) return;
    const newProj = [...editData.projects];
    newProj[idx] = val;
    setEditData({ ...editData, projects: newProj });
  };

  const handleRemoveProject = (idx: number) => {
    if (!editData) return;
    const newProj = editData.projects.filter((_, i) => i !== idx);
    setEditData({ ...editData, projects: newProj });
  };

  const handleAddTraining = () => {
    if (!editData) return;
    setEditData({ ...editData, trainings: [...editData.trainings, { date: "", title: "Novo Treinamento" }] });
  };

  const handleUpdateTraining = (idx: number, field: 'date' | 'title', val: string) => {
    if (!editData) return;
    const newTrainings = [...editData.trainings];
    newTrainings[idx] = { ...newTrainings[idx], [field]: val };
    setEditData({ ...editData, trainings: newTrainings });
  };

  const handleRemoveTraining = (idx: number) => {
    if (!editData) return;
    const newTrainings = editData.trainings.filter((_, i) => i !== idx);
    setEditData({ ...editData, trainings: newTrainings });
  };

  if (!data) return <div>Carregando...</div>;

  const ptMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const enMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
      {/* Header Idêntico ao Overview */}
      <header style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '20px 32px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
            <Building2 color="white" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Visão Institucional</h1>
            {user && (
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                Olá, <strong>{user.name}</strong>
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(role === 'MANAGER' ? '/app/overview' : '/app/dashboard')}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, transition: 'all 0.2s' }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          {role === 'MANAGER' && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{ background: '#2563eb', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, transition: 'all 0.2s' }}
            >
              <Edit size={16} /> Editar Dados
            </button>
          )}
          {role === 'MANAGER' && isEditing && (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(JSON.parse(JSON.stringify(data))); // revert
                }}
                style={{ background: '#ef4444', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                style={{ background: '#10b981', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
              >
                <Save size={16} /> Salvar
              </button>
            </>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* 1. Evolução Anual (Gráfico) */}
        <section style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <LineChart color="#4f46e5" size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Evolução de Chamados (2023 - 2026)</h2>
          </div>

          {!isEditing ? (
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="2023" name="2023" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="2024" name="2024" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="2025" name="2025" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="2026" name="2026" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', overflowX: 'auto' }}>
              {['calls2023', 'calls2024', 'calls2025', 'calls2026'].map((yearKey) => (
                <div key={yearKey} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', minWidth: '200px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '16px', textAlign: 'center' }}>
                    Ano {yearKey.replace('calls', '')}
                  </h3>
                  {enMonths.map((m, idx) => (
                    <div key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, width: '40px' }}>{ptMonths[idx]}</span>
                      <input
                        type="number"
                        value={(editData?.[yearKey as keyof CorporateData] as any)[m] || 0}
                        onChange={(e) => handleEditMonth(yearKey as any, m, e.target.value)}
                        style={{ width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* 2. Projetos Realizados */}
          <section style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Briefcase color="#0ea5e9" size={24} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Projetos Realizados (24-26)</h2>
              </div>
              {isEditing && (
                <button onClick={handleAddProject} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Plus size={16} /> Adicionar
                </button>
              )}
            </div>

            {!isEditing ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.projects.map((proj, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }}></div>
                    <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>{proj}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {editData?.projects.map((proj, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      value={proj}
                      onChange={(e) => handleUpdateProject(idx, e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <button onClick={() => handleRemoveProject(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Treinamentos (Agenda) */}
          <section style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GraduationCap color="#0f766e" size={24} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Treinamentos & Workshops 2025</h2>
              </div>
              {isEditing && (
                <button onClick={handleAddTraining} style={{ background: '#ecfdf5', color: '#10b981', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <Plus size={16} /> Adicionar
                </button>
              )}
            </div>

            {!isEditing ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.trainings.map((train, idx) => (
                  <li key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    background: '#f8fafc', padding: '16px', borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#14b8a6', flexShrink: 0, width: '100px' }}>
                      <Calendar size={18} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{train.date}</span>
                    </div>
                    <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>{train.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {editData?.trainings.map((train, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      value={train.date}
                      placeholder="DD/MM"
                      onChange={(e) => handleUpdateTraining(idx, 'date', e.target.value)}
                      style={{ width: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <input
                      value={train.title}
                      placeholder="Título do Treinamento"
                      onChange={(e) => handleUpdateTraining(idx, 'title', e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <button onClick={() => handleRemoveTraining(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      </main>
    </div>
  );
}
