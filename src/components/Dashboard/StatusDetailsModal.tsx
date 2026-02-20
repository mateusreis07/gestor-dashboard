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
                      <td className={styles.colDate}>{chamado.criado}</td>
                      <td className={styles.colDate}>{chamado.fimDoPrazo || '-'}</td>
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
