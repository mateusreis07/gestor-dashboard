import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Briefcase, Calendar, Edit, Save, X, Trash2, Plus, ArrowLeft, GraduationCap, LayoutDashboard, Settings, LogOut, BarChart2, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell } from 'recharts';
import { loadCorporateData, saveCorporateData } from '../utils/corporateData';
import { corporateService } from '../services/corporateService';
import type { CorporateData } from '../utils/corporateData';
import styles from './TeamDashboard.module.css';

export function CorporateDashboard() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { teamId: paramsTeamId } = useParams<{ teamId: string }>();

  const [data, setData] = useState<CorporateData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CorporateData | null>(null);

  const teamId = paramsTeamId || localStorage.getItem('gestor_current_team_id');
  const teamName = localStorage.getItem('gestor_current_team_name') || 'Equipe';

  const [currentTeam, setCurrentTeam] = useState<any>(null);

  useEffect(() => {
    const resolvedTeamId = paramsTeamId || localStorage.getItem('gestor_current_team_id') || (role === 'TEAM' && user ? user.id : null);
    if (!resolvedTeamId) return;

    if (user && (role === 'TEAM' || resolvedTeamId === user.id)) {
      setCurrentTeam({
        id: user.id,
        name: user.name || user.email,
        avatarUrl: (user as any).avatarUrl,
      });
      return;
    }

    import('../services/teamService').then(({ managerTeamsService }) => {
      managerTeamsService.listTeams().then(teams => {
        const team = teams.find((t: any) => t.id === resolvedTeamId);
        if (team) {
          setCurrentTeam(team);
        }
      }).catch(err => console.error(err));
    });
  }, [paramsTeamId, role, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiData = await corporateService.getCorporateData();
        if (apiData) {
          setData(apiData);
          setEditData(JSON.parse(JSON.stringify(apiData)));
        } else {
          // Fallback to local defaults if nothing on backend yet
          const loaded = loadCorporateData();
          setData(loaded);
          setEditData(JSON.parse(JSON.stringify(loaded)));
        }
      } catch (err) {
        console.error('Failed to fetch corporate data, using local fallback:', err);
        const loaded = loadCorporateData();
        setData(loaded);
        setEditData(JSON.parse(JSON.stringify(loaded)));
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (editData) {
      try {
        await corporateService.updateCorporateData(editData);
        // Backup via localStorage too
        saveCorporateData(editData);
        setData(editData);
        setIsEditing(false);
      } catch (err) {
        console.error('Failed to save to API:', err);
        alert('Erro ao salvar os institucionais no banco. Tentando salvar localmente...');
        saveCorporateData(editData);
        setData(editData);
        setIsEditing(false);
      }
    }
  };

  const yearsKeys = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).filter(k => k.startsWith('calls')).sort();
  }, [data]);

  const totals = useMemo(() => {
    if (!data) return {};
    const t: Record<string, number> = {};
    yearsKeys.forEach(key => {
      const year = key.replace('calls', '');
      t[year] = Object.values(data[key]).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number;
    });
    return t;
  }, [data, yearsKeys]);

  const ptMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const enMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  const getYearData = (yearData: any) => {
    if (!yearData) return [];
    return enMonths.map((m, idx) => ({
      name: ptMonths[idx],
      value: yearData[m] || 0
    }));
  };

  const yearlyData = useMemo(() => {
    return yearsKeys.map(key => {
      const year = key.replace('calls', '');
      return { name: year, value: totals[year] || 0 };
    });
  }, [yearsKeys, totals]);

  const handleEditMonth = (yearKey: string, month: string, value: string) => {
    if (!editData) return;
    const val = parseInt(value, 10);
    setEditData({
      ...editData,
      [yearKey]: {
        ...editData[yearKey],
        [month]: isNaN(val) ? 0 : val
      }
    });
  };

  const handleCreateYear = () => {
    if (!editData) return;
    const nextYear = prompt("Digite o novo ano (ex: 2027):");
    if (!nextYear || isNaN(Number(nextYear))) return;

    setEditData({
      ...editData,
      [`calls${nextYear}`]: {
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
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

  const getGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const KPICard = ({ year, total, previousTotal }: { year: string, total: number, previousTotal: number | null }) => {
    const growth = previousTotal !== null ? getGrowth(total, previousTotal) : null;
    const isPositive = growth ? Number(growth) > 0 : null;

    return (
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1rem', color: '#64748b', margin: '0 0 12px 0', fontWeight: 500 }}>Chamados {year}</h3>
        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#14b8a6', margin: 0, letterSpacing: '-1px' }}>
          {total.toLocaleString('pt-BR')}
        </p>
        {growth !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '0.9rem', fontWeight: 500 }}>
            {isPositive ? (
              <span style={{ color: '#10b981' }}>↗ +{growth}%</span>
            ) : (
              <span style={{ color: '#ef4444' }}>↘ {growth}%</span>
            )}
            <span style={{ color: '#94a3b8', fontWeight: 400 }}>vs ano anterior</span>
          </div>
        )}
      </div>
    );
  };

  const MonthlyBarChart = ({ chartData, title, color }: { chartData: any[], title: string, color: string }) => (
    <div style={{ padding: '8px 0', flex: 1, minWidth: '45%' }}>
      <h4 style={{ fontSize: '1rem', color: '#64748b', marginBottom: '24px', fontWeight: 500 }}>{title}</h4>
      <div style={{ height: '240px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40}>
              <LabelList dataKey="value" position="top" fill="#64748b" fontSize={10} formatter={(v: any) => v > 0 ? v : ''} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const YEAR_COLORS = ['#a855f7', '#f59e0b', '#14b8a6', '#0ea5e9']; // 2023, 2024, 2025, 2026

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={40} color="#0ea5e9" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748b', fontWeight: 500, fontSize: '1rem' }}>Carregando dados institucionais...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
      {/* ===== HEADER ===== */}
      <div className={styles.layoutContainer}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className={styles.headerPanel}>
            <div className={styles.headerLeft}>
              {role === 'MANAGER' && (
                <button onClick={() => navigate('/app/overview')} className={styles.backButton}>
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className={styles.teamAvatar} style={currentTeam?.avatarUrl ? { background: `url(${currentTeam.avatarUrl}) center/cover` } : { background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}>
                {!currentTeam?.avatarUrl && <LayoutDashboard size={24} />}
              </div>
              <div className={styles.teamInfo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.roleBadge}>
                    {role === 'MANAGER' ? 'Portal Executivo' : 'Portal Operacional'}
                  </span>
                </div>
                <h1 className={styles.teamName}>
                  {currentTeam?.name || teamName}
                </h1>
              </div>
            </div>

            <div className={styles.headerActions}>
              {role !== 'MANAGER' && (
                <button
                  onClick={() => navigate(teamId ? `/app/team/${teamId}/import` : '/app/dashboard')}
                  className={styles.configButton}
                  title="Configurar Log"
                >
                  <Settings size={18} />
                  <span className="desktop-only" style={{ display: typeof window !== 'undefined' && window.innerWidth > 768 ? 'inline' : 'none' }}>Configurar</span>
                </button>
              )}

              <button onClick={() => { logout(); navigate('/welcome'); }} className={styles.backButton} style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }} title="Sair">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main style={{ marginTop: '0px' }}>
          <div className={styles.tabsContainer}>
            <button
              onClick={() => navigate(role === 'MANAGER' ? (teamId ? `/app/team/${teamId}` : '/app/overview') : '/app/dashboard')}
              className={styles.tabButton}>
              <LayoutDashboard size={20} />
              Visão Operacional
            </button>
            <button
              onClick={() => navigate(role === 'MANAGER' ? (teamId ? `/app/team/${teamId}/indicadores` : '/app/overview') : '/app/indicadores')}
              className={styles.tabButton}>
              <BarChart2 size={20} />
              KPIs e Indicadores
            </button>
            <button
              onClick={() => navigate('/app/institucional')}
              className={`${styles.tabButton} ${styles.active}`}>
              <Building2 size={20} />
              Metas Institucionais
            </button>
          </div>
        </main>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto 32px', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Action Bar for Institutional View (Team Editing Features) */}
        {role === 'TEAM' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '12px 24px', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '8px' }}>
                <Building2 color="#3b82f6" size={20} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Dados Institucionais</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ background: '#2563eb', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, transition: 'all 0.2s' }}
                >
                  <Edit size={16} /> Editar Dados
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(JSON.parse(JSON.stringify(data)));
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
          </div>
        ) : null}

        {/* KPIs */}
        {!isEditing && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {yearsKeys.map((key, idx) => {
              const year = key.replace('calls', '');
              const prevKey = yearsKeys[idx - 1];
              const prevYear = prevKey ? prevKey.replace('calls', '') : null;
              return (
                <KPICard
                  key={year}
                  year={year}
                  total={totals[year]}
                  previousTotal={prevYear ? totals[prevYear] : null}
                />
              );
            })}
          </div>
        )}

        {/* Charts: Monthly */}
        <section style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Chamados por Mês</h2>
            {isEditing && (
              <button
                onClick={handleCreateYear}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Adicionar Ano
              </button>
            )}
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', rowGap: '48px' }}>
              {yearsKeys.map((key, idx) => {
                const year = key.replace('calls', '');
                return (
                  <MonthlyBarChart
                    key={year}
                    title={year}
                    color={YEAR_COLORS[idx % YEAR_COLORS.length]}
                    chartData={data ? getYearData(data[key]) : []}
                  />
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', overflowX: 'auto' }}>
              {(editData ? Object.keys(editData).filter(k => k.startsWith('calls')).sort() : []).map((yearKey) => (
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

        {/* Charts: Yearly Total */}
        {!isEditing && (
          <section style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 32px 0' }}>Total de Chamados por Ano</h2>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(value: any) => [Number(value).toLocaleString('pt-BR'), 'Total']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {yearlyData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={YEAR_COLORS[index % YEAR_COLORS.length]} />
                    ))}
                    <LabelList dataKey="value" position="top" fill="#64748b" fontSize={12} formatter={(v: any) => Number(v).toLocaleString('pt-BR')} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

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
