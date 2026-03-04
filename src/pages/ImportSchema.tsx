import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, Upload, Database, Edit3, Brain, BarChart3, PieChart, Users, Layers, Tag, MapPin, Clock, Hash, FileText, CheckCircle, AlertCircle, Activity } from 'lucide-react';

export const ImportSchema: React.FC = () => {
  const navigate = useNavigate();

  const glpiColumns = [
    { col: 'ID', field: 'ID', icon: <Hash size={15} />, desc: 'Identificação única do ticket', usage: 'Filtro de validação' },
    { col: 'Título', field: 'titulo', icon: <FileText size={15} />, desc: 'Título do chamado', usage: 'Exibição' },
    { col: 'Status', field: 'status', icon: <CheckCircle size={15} />, desc: 'Status atual do ticket', usage: 'Referência' },
    { col: 'Data de abertura', field: 'dataAbertura', icon: <Clock size={15} />, desc: 'Data/hora de abertura', usage: 'Filtro por mês, histórico mensal' },
    { col: 'Última atualização', field: 'ultimaAtualizacao', icon: <Clock size={15} />, desc: 'Última modificação', usage: 'Referência temporal' },
    { col: 'Requerente - Requerente', field: 'requerente', icon: <Users size={15} />, desc: 'Quem solicitou o suporte', usage: 'Gráfico Top 5 Requerentes' },
    { col: 'Atribuído - Técnico', field: 'tecnico', icon: <Users size={15} />, desc: 'Técnico responsável', usage: 'Análise IA (carga por técnico)' },
    { col: 'Categoria', field: 'categoria', icon: <Tag size={15} />, desc: 'Categoria do chamado', usage: 'Gráfico Top 5 Categorias' },
    { col: 'Localização', field: 'localizacao', icon: <MapPin size={15} />, desc: 'Local de referência', usage: 'Referência de localidade' },
    { col: 'Origem da requisição', field: 'origem', icon: <Layers size={15} />, desc: 'Canal de origem (Helpdesk, Email)', usage: 'Gráfico Origens de Requisição' },
  ];

  const jiraColumns = [
    { col: 'Nº Chamado', field: 'numeroChamado', icon: <Hash size={15} />, desc: 'Identificação do chamado', usage: 'Código único, validação' },
    { col: 'Resumo', field: 'resumo', icon: <FileText size={15} />, desc: 'Título/descrição do chamado', usage: 'Exibição' },
    { col: 'Criado', field: 'criado', icon: <Clock size={15} />, desc: 'Data de criação', usage: 'Filtro por mês' },
    { col: 'Fim do prazo', field: 'fimDoPrazo', icon: <Clock size={15} />, desc: 'Data limite do chamado', usage: 'Referência de prazo' },
    { col: 'Prazo Ajustado', field: 'prazoAjustado', icon: <Clock size={15} />, desc: 'Prazo revisado', usage: 'Referência' },
    { col: 'Status do chamado', field: 'statusChamado', icon: <CheckCircle size={15} />, desc: 'Status atual', usage: 'Gráfico Distribuição de Status' },
    { col: 'Relator', field: 'relator', icon: <Users size={15} />, desc: 'Quem abriu o chamado', usage: 'Referência' },
    { col: 'Módulo', field: 'modulo', icon: <Layers size={15} />, desc: 'Módulo do sistema', usage: 'Análise IA (módulos afetados)' },
    { col: 'Funcionalidade', field: 'funcionalidade', icon: <Tag size={15} />, desc: 'Funcionalidade impactada', usage: 'Gráfico Top 10 Funcionalidades' },
  ];

  const manualFields = [
    { field: 'satisfaction', label: 'Índice de Satisfação', desc: 'Nota de 0 a 5' },
    { field: 'manuals', label: 'Manuais Enviados', desc: 'Quantidade de manuais' },
    { field: 'projetos', label: 'Projetos', desc: 'Projetos em andamento' },
    { field: 'treinamentos', label: 'Treinamentos', desc: 'Treinamentos ministrados' },
    { field: 'peticionamento', label: 'Peticionamento', desc: 'Evolução de Peticionamento' },
    { field: 'extrajudiciais', label: 'Extrajudiciais', desc: 'Novos Extrajudiciais' },
    { field: 'documentos', label: 'Documentos Emitidos', desc: 'Total de documentos' },
    { field: 'movimentos', label: 'Movimentos Taxonômicos', desc: 'Movimentos registrados' },
  ];

  const sectionStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    padding: '32px',
    marginBottom: '28px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    background: color === 'blue' ? '#eff6ff' : color === 'green' ? '#f0fdf4' : '#faf5ff',
    color: color === 'blue' ? '#2563eb' : color === 'green' ? '#16a34a' : '#7c3aed',
    border: `1px solid ${color === 'blue' ? '#bfdbfe' : color === 'green' ? '#bbf7d0' : '#ddd6fe'}`,
  });

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #e2e8f0',
    background: '#f8fafc',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '0.9rem',
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Back Button */}
        <button
          onClick={() => navigate('/app/overview')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px',
            background: '#ffffff', border: '1px solid #e2e8f0', width: '42px', height: '42px', padding: 0,
            borderRadius: '12px', justifyContent: 'center', transition: 'all 0.2s', color: '#64748b',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          title="Voltar ao Overview"
          onMouseOver={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.color = '#0ea5e9'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
        >
          <ArrowLeft size={20} />
        </button>

        {/* Page Header */}
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            }}>
              <Database size={26} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Esquema de Importação
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
                Estrutura de colunas mapeadas nas planilhas de dados do sistema
              </p>
            </div>
          </div>
        </header>

        {/* INFO BANNER */}
        <div style={{
          ...sectionStyle,
          background: 'linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%)',
          border: '1px solid #bae6fd',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
          padding: '24px 28px',
        }}>
          <AlertCircle size={22} color="#0ea5e9" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.9rem', color: '#1e40af', lineHeight: 1.6 }}>
            <strong>Sobre esta página: </strong>
            Aqui estão documentadas as colunas que o sistema espera encontrar nos arquivos importados.
            Se os nomes das colunas forem diferentes, o parser tentará encontrar equivalentes automaticamente
            (busca case-insensitive, sem acentos). Para garantir compatibilidade, use os nomes exatos listados abaixo.
          </div>
        </div>

        {/* ── SECTION 1: GLPI (CSV) ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: '#f0f9ff', border: '1px solid #bae6fd',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={22} color="#0ea5e9" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  GLPI — Tickets
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                  Suporte / Operação
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={badgeStyle('blue')}>
                <Upload size={12} /> Arquivo CSV
              </span>
              <span style={badgeStyle('blue')}>
                {glpiColumns.length} colunas
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, borderTopLeftRadius: '12px' }}>#</th>
                  <th style={thStyle}>Coluna CSV</th>
                  <th style={thStyle}>Campo Interno</th>
                  <th style={thStyle}>Descrição</th>
                  <th style={{ ...thStyle, borderTopRightRadius: '12px' }}>Usado Em</th>
                </tr>
              </thead>
              <tbody>
                {glpiColumns.map((c, i) => (
                  <tr key={i} onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 600, width: '40px' }}>{i + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#0ea5e9' }}>{c.icon}</span>
                        <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{c.col}</code>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <code style={{ color: '#8b5cf6', fontSize: '0.85rem' }}>{c.field}</code>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{c.desc}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {c.usage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Painéis alimentados pelo GLPI */}
          <div style={{ marginTop: '20px', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Painéis alimentados:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {['Volume de Tickets', 'Top 5 Categorias', 'Top 5 Requerentes', 'Origens de Requisição', 'Histórico Mensal', 'IA Insights'].map((p, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                  background: p === 'IA Insights' ? '#faf5ff' : '#f0f9ff',
                  color: p === 'IA Insights' ? '#7c3aed' : '#0369a1',
                  border: `1px solid ${p === 'IA Insights' ? '#ddd6fe' : '#bae6fd'}`,
                }}>
                  {p === 'IA Insights' ? <Brain size={12} /> : <BarChart3 size={12} />}
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 2: JIRA (XLSX) ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileSpreadsheet size={22} color="#10b981" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  JIRA — Chamados
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                  Projetos / Sustentação
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={badgeStyle('green')}>
                <FileSpreadsheet size={12} /> Arquivo XLSX
              </span>
              <span style={badgeStyle('green')}>
                {jiraColumns.length} colunas
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, borderTopLeftRadius: '12px' }}>#</th>
                  <th style={thStyle}>Coluna XLSX</th>
                  <th style={thStyle}>Campo Interno</th>
                  <th style={thStyle}>Descrição</th>
                  <th style={{ ...thStyle, borderTopRightRadius: '12px' }}>Usado Em</th>
                </tr>
              </thead>
              <tbody>
                {jiraColumns.map((c, i) => (
                  <tr key={i} onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontWeight: 600, width: '40px' }}>{i + 1}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10b981' }}>{c.icon}</span>
                        <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{c.col}</code>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <code style={{ color: '#8b5cf6', fontSize: '0.85rem' }}>{c.field}</code>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{c.desc}</td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '0.8rem', color: '#475569', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        {c.usage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Painéis alimentados pelo JIRA */}
          <div style={{ marginTop: '20px', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Painéis alimentados:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {['Volume de Chamados', 'Distribuição de Status', 'Top 10 Funcionalidades', 'IA Insights'].map((p, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                  background: p === 'IA Insights' ? '#faf5ff' : '#f0fdf4',
                  color: p === 'IA Insights' ? '#7c3aed' : '#166534',
                  border: `1px solid ${p === 'IA Insights' ? '#ddd6fe' : '#bbf7d0'}`,
                }}>
                  {p === 'IA Insights' ? <Brain size={12} /> : p.includes('Status') ? <PieChart size={12} /> : <BarChart3 size={12} />}
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Parser Intelligence Note */}
          <div style={{ marginTop: '16px', padding: '14px 20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Activity size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Parser inteligente:</strong> O sistema aceita variações de nome de coluna automaticamente
              (ex: "Título" = "Resumo", "Status" = "Status do chamado", "Data de criação" = "Criado").
              Busca normalizada, case-insensitive e sem acentos.
            </span>
          </div>
        </div>

        {/* ── SECTION 3: MANUAL STATS ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: '#faf5ff', border: '1px solid #ddd6fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Edit3 size={22} color="#7c3aed" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Métricas Manuais
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                Cards coloridos inseridos via dashboard (por mês)
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {manualFields.map((f, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#fafbfc',
                transition: 'all 0.2s',
              }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#c4b5fd'; e.currentTarget.style.background = '#faf5ff'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fafbfc'; }}
              >
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>{f.label}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{f.desc}</div>
                <code style={{ display: 'inline-block', marginTop: '8px', color: '#8b5cf6', fontSize: '0.75rem', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px' }}>{f.field}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0 16px 0',
          color: '#94a3b8',
          fontSize: '0.8rem',
        }}>
          Esquema de dados v1.0 — GestorOS
        </div>
      </div>
    </div>
  );
};
