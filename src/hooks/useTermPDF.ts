// src/hooks/useTermPDF.ts
import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function useTermPDF() {
  const printRef = useRef<HTMLDivElement>(null);

  const generatePDF = useCallback(async (guestName: string, aptNumber: number) => {
    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      // Se a imagem for maior que uma página, divide em múltiplas
      if (scaledHeight > pdfHeight) {
        let heightLeft = scaledHeight;
        let position = 0;
        let page = 1;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = -(pdfHeight * page);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
          heightLeft -= pdfHeight;
          page++;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight);
      }

      const fileName = `Termo_Responsabilidade_Apto${aptNumber}_${guestName.replace(/\s/g, '_')}.pdf`;
      pdf.save(fileName);

      return true;
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return false;
    }
  }, []);

  return { printRef, generatePDF };
}