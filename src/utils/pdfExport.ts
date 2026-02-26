import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportDashboardToPDF = async (elementId: string, filename: string): Promise<boolean> => {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`Element with id ${elementId} not found.`);
    return false;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // 10mm margin on sides
    const innerWidth = pdfWidth - margin * 2;
    let currentY = margin;

    // Busca blocos demarcados para não serem "cortados" ao meio na quebra de página
    const sections = Array.from(container.querySelectorAll('.pdf-page-section')) as HTMLElement[];

    // ===== LÓGICA AVANÇADA (Multipage Sem Quebra) =====
    if (sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc',
        });

        const imgData = canvas.toDataURL('image/png');
        const ratio = innerWidth / canvas.width;
        const finalWidth = innerWidth;
        const finalHeight = canvas.height * ratio;

        // Se a altura do bloco não couber no espaço restante da página, cria nova página
        // Exceção: se finalHeight > pdfHeight, ele vai vazar um pouco mas não quebra no topo.
        if (currentY + finalHeight > pdfHeight - margin && i > 0) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, currentY, finalWidth, finalHeight);
        currentY += finalHeight + 8; // Adiciona um pequeno gap de 8mm entre as seções
      }
    }
    // ===== FALLBACK (Preenche 100% da largura, quebrando livremente a altura) =====
    else {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
      });

      const imgData = canvas.toDataURL('image/png');

      // Expande a largura para 100% da folha (respeitando margem) em vez de encolher o dashboard inteiro
      const ratio = innerWidth / canvas.width;
      const finalWidth = innerWidth;
      const finalHeight = canvas.height * ratio;

      let heightLeft = finalHeight;
      let position = currentY;

      pdf.addImage(imgData, 'PNG', margin, position, finalWidth, finalHeight);
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - finalHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, finalWidth, finalHeight);
        heightLeft -= (pdfHeight - margin * 2);
      }
    }

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
