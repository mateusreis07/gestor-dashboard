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
          windowWidth: 1400, // Forces desktop layout to prevent squished charts
          windowHeight: section.scrollHeight + 100, // Pass specific height to avoid viewport crop
        });

        const imgData = canvas.toDataURL('image/png');
        const ratio = innerWidth / canvas.width;
        const finalWidth = innerWidth;
        const finalHeight = canvas.height * ratio;

        const pageUsableHeight = pdfHeight - margin * 2;

        // Se o bloco couber na página limpa, mas não no espaço restante atual, puxa pra nova página.
        if (currentY + finalHeight > pdfHeight - margin && i > 0 && finalHeight <= pageUsableHeight) {
          pdf.addPage();
          currentY = margin;
        }

        if (finalHeight > pageUsableHeight) {
          // Se o bloco é MAIOR que uma página inteira, quebra ele em várias páginas
          if (currentY > margin) {
            pdf.addPage();
            currentY = margin;
          }

          let heightLeft = finalHeight;
          let offsetY = 0; // Tracks vertical slicing offset

          pdf.addImage(imgData, 'PNG', margin, currentY, finalWidth, finalHeight);
          heightLeft -= pageUsableHeight;
          offsetY -= pageUsableHeight;

          while (heightLeft > 0) {
            pdf.addPage();
            // In jsPDF, drawing the image at negative Y coordinates pushes the upper part out of the visible screen,
            // effectively acting like a crop window for the next slice
            pdf.addImage(imgData, 'PNG', margin, offsetY + margin, finalWidth, finalHeight);
            heightLeft -= pageUsableHeight;
            offsetY -= pageUsableHeight;
          }
          currentY = margin; // Próximo bloco inicia já numa página vazia (ou usamos o saldo, mas pra simplificar deixamos limpo)
        } else {
          pdf.addImage(imgData, 'PNG', margin, currentY, finalWidth, finalHeight);
          currentY += finalHeight + 8; // Adiciona um pequeno gap de 8mm entre as seções
        }
      }
    }
    // ===== FALLBACK (Preenche 100% da largura, quebrando livremente a altura) =====
    else {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc',
        windowWidth: 1400,
        windowHeight: container.scrollHeight + 100, // Avoid viewport clipping
      });

      const imgData = canvas.toDataURL('image/png');

      // Expande a largura para 100% da folha (respeitando margem) em vez de encolher o dashboard inteiro
      const ratio = innerWidth / canvas.width;
      const finalWidth = innerWidth;
      const finalHeight = canvas.height * ratio;

      let heightLeft = finalHeight;
      let offsetY = 0;
      const pageUsableHeight = pdfHeight - margin * 2;

      pdf.addImage(imgData, 'PNG', margin, margin, finalWidth, finalHeight);
      heightLeft -= pageUsableHeight;
      offsetY -= pageUsableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, offsetY + margin, finalWidth, finalHeight);
        heightLeft -= pageUsableHeight;
        offsetY -= pageUsableHeight;
      }
    }

    pdf.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
