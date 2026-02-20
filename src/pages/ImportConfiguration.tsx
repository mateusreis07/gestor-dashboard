import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Calendar, Trash } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { parseXlsx } from '../utils/xlsxParser';
import { saveTeamTickets, saveTeamChamados, saveMonthData, loadMonthData } from '../utils/storage';
import { teamService } from '../services/teamService';

export const ImportConfiguration: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // O "time atual" é o usuário logado (ou o time selecionado pelo gestor via URL)
  const resolvedTeamId = teamId || user?.id;
  const teamName = user?.name || user?.email || 'Time';

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState<{ tickets: number; chamados: number }>({ tickets: 0, chamados: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load stats for selected month when it changes
  useEffect(() => {
    if (resolvedTeamId && selectedMonth) {
      const data = loadMonthData(resolvedTeamId, selectedMonth);
      if (data) {
        setStats({
          tickets: data.tickets?.length || 0,
          chamados: data.chamados?.length || 0
        });
      } else {
        setStats({ tickets: 0, chamados: 0 });
      }
    }
  }, [resolvedTeamId, selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'xlsx') => {
    const file = event.target.files?.[0];
    if (!file || !resolvedTeamId) return;

    setLoading(true);
    setMessage(null);

    try {
      if (type === 'csv') {
        const parsedTickets = await parseCSV(file);
        console.log('[Import] Parsed tickets:', parsedTickets);

        // 1. Salva no localStorage (compatibilidade com dashboard atual)
        saveMonthData(resolvedTeamId, selectedMonth, { tickets: parsedTickets });
        saveTeamTickets(resolvedTeamId, parsedTickets);

        // 2. Persiste no banco via API
        try {
          await teamService.uploadTickets(resolvedTeamId, parsedTickets, selectedMonth);
          setMessage({ type: 'success', text: `☁️ ${parsedTickets.length} tickets importados e salvos no banco para ${selectedMonth}.` });
        } catch (apiErr) {
          console.warn('API upload falhou, dados salvos localmente:', apiErr);
          setMessage({ type: 'success', text: `⚠️ ${parsedTickets.length} tickets salvos localmente. Falha ao salvar no banco.` });
        }

        setStats(prev => ({ ...prev, tickets: parsedTickets.length }));
      } else if (type === 'xlsx') {
        const parsedChamados = await parseXlsx(file);
        console.log('[Import] Parsed chamados:', parsedChamados);

        // 1. Salva no localStorage
        saveMonthData(resolvedTeamId, selectedMonth, { chamados: parsedChamados });
        saveTeamChamados(resolvedTeamId, new Date(selectedMonth).getMonth(), parsedChamados);

        // 2. Persiste no banco via API
        try {
          await teamService.uploadChamados(resolvedTeamId, parsedChamados, selectedMonth);
          setMessage({ type: 'success', text: `☁️ ${parsedChamados.length} chamados importados e salvos no banco para ${selectedMonth}.` });
        } catch (apiErr) {
          console.warn('API upload falhou, dados salvos localmente:', apiErr);
          setMessage({ type: 'success', text: `⚠️ ${parsedChamados.length} chamados salvos localmente. Falha ao salvar no banco.` });
        }

        setStats(prev => ({ ...prev, chamados: parsedChamados.length }));
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erro ao processar arquivo. Verifique o formato.' });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    if (!resolvedTeamId) return;
    if (!window.confirm(`TEM CERTEZA? Isso apagará os dados de tickets e chamados do mês ${selectedMonth}. Se houver dados errados, isso ajudará a limpar.`)) {
      return;
    }

    setLoading(true);
    try {
      await teamService.resetData(resolvedTeamId, selectedMonth);
      setMessage({ type: 'success', text: `Dados de ${selectedMonth} limpos com sucesso. Importe novamente.` });
      setStats({ tickets: 0, chamados: 0 });
      // Limpar localStorage deste mês
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao limpar dados.' });
    } finally {
      setLoading(false);
    }
  };

  if (!resolvedTeamId) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  return (
    <div className="layout-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <button
        onClick={() => navigate(`/app/team/${resolvedTeamId}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginBottom: '24px' }}
      >
        <ArrowLeft size={20} /> Voltar ao Dashboard
      </button>

      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Configuração de Importação</h1>
        <p style={{ color: '#6b7280' }}>Gerencie os dados do time <strong>{teamName}</strong> por período.</p>
      </header>

      {/* MONTH SELECTION */}
      <section style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>
          Selecione o Mês de Referência
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Calendar size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              style={{
                width: '100%', padding: '12px 12px 12px 42px',
                fontSize: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1',
                color: '#1e293b', fontWeight: 500, boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            onClick={handleReset}
            title={`Limpar dados de ${selectedMonth}`}
            style={{
              padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5',
              background: '#fee2e2', color: '#dc2626', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Trash size={20} />
          </button>
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.875rem', color: '#64748b', display: 'flex', gap: '24px' }}>
          <span>Dados salvos neste mês:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: stats.tickets > 0 ? '#16a34a' : '#94a3b8' }}>
            tickets: <strong>{stats.tickets}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: stats.chamados > 0 ? '#16a34a' : '#94a3b8' }}>
            chamados: <strong>{stats.chamados}</strong>
          </span>
        </div>
      </section>

      {/* UPLOAD SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

        {/* CSV Upload */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Upload size={24} color="#2563eb" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>Importar Tickets (CSV)</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '24px' }}>
            Carregue o arquivo CSV exportado do sistema de tickets para o mês de <strong>{selectedMonth}</strong>.
          </p>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#2563eb', color: 'white', padding: '10px 20px',
            borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
          }}>
            <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e, 'csv')} style={{ display: 'none' }} disabled={loading} />
            {loading ? 'Processando...' : 'Selecionar Arquivo CSV'}
          </label>
        </div>

        {/* JIRA Upload */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileSpreadsheet size={24} color="#16a34a" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>Importar Chamados (Jira)</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '24px' }}>
            Carregue a planilha XLSX exportada do Jira para o mês de <strong>{selectedMonth}</strong>.
          </p>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#16a34a', color: 'white', padding: '10px 20px',
            borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
          }}>
            <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'xlsx')} style={{ display: 'none' }} disabled={loading} />
            {loading ? 'Processando...' : 'Selecionar Arquivo XLSX'}
          </label>
        </div>
      </div>




      {
        message && (
          <div style={{
            marginTop: '24px', padding: '16px', borderRadius: '8px',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex', alignItems: 'center', gap: '12px',
            color: message.type === 'success' ? '#166534' : '#991b1b'
          }}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontWeight: 500 }}>{message.text}</span>
          </div>
        )
      }
    </div >
  );
};
