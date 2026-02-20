import { X } from 'lucide-react';
import type { Chamado } from '../../utils/types';
import styles from './StatusDetailsModal.module.css';

interface Props {
  status: string;
  chamados: Chamado[];
  onClose: () => void;
}

export function StatusDetailsModal({ status, chamados, onClose }: Props) {
  if (!status) return null;

  const filteredChamados = chamados.filter(c => c.statusChamado === status);

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    if (!isoString.includes('T')) return isoString; // Fallback se já viajou cru do CSV

    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;

      const day = String(d.getUTCDate()).padStart(2, '0');
      const monthNames = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
      const month = monthNames[d.getUTCMonth()];
      const year = d.getUTCFullYear();

      let hours = d.getUTCHours();
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');

      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Hora "0" vira 12
      const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

      // Quando for 00:00, escondemos a hora para não poluir chamados que não tenham horário exato
      if (hours === 12 && minutes === '00' && ampm === 'AM') {
        return `${day}/${month}/${year}`;
      }

      return `${day}/${month}/${year} ${strTime}`;
    } catch {
      return isoString; // ultimo fallback
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Chamados - <span className={styles.statusHighlight}>{status}</span>
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {filteredChamados.length === 0 ? (
            <p className={styles.empty}>Nenhum chamado encontrado com este status.</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Num</th>
                    <th>Resumo</th>
                    <th>Criado</th>
                    <th>Fim do Prazo</th>
                    <th>Relator</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChamados.map((chamado) => (
                    <tr key={chamado.numeroChamado}>
                      <td className={styles.colId}>{chamado.numeroChamado}</td>
                      <td className={styles.colSummary} title={chamado.resumo}>
                        {chamado.resumo}
                      </td>
                      <td className={styles.colDate}>{formatDate(chamado.criado)}</td>
                      <td className={styles.colDate}>{formatDate(chamado.fimDoPrazo)}</td>
                      <td className={styles.colReporter}>{chamado.relator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          Total de <strong>{filteredChamados.length}</strong> chamados encontrados.
        </div>
      </div>
    </div>
  );
}
