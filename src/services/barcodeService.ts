import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';

interface BarcodeOptions {
  type: 'human' | 'animal';
  sampleId: string;
  subjectId: string;
  name: string;
}

export const generateBarcode = (options: BarcodeOptions): string => {
  const { type, sampleId, subjectId, name } = options;
  const prefix = type === 'human' ? 'H' : 'A';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export const printBarcode = async (options: BarcodeOptions): Promise<void> => {
  const barcodeValue = generateBarcode(options);
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  
  // Generate barcode on canvas
  JsBarcode(canvas, barcodeValue, {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 20,
    fontOptions: 'bold',
  });

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add barcode to PDF
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 10, 10, 100, 50);

  // Add sample information
  pdf.setFontSize(12);
  pdf.text(`Sample ID: ${options.sampleId}`, 10, 70);
  pdf.text(`Subject ID: ${options.subjectId}`, 10, 80);
  pdf.text(`Name: ${options.name}`, 10, 90);
  pdf.text(`Type: ${options.type}`, 10, 100);

  // Print PDF
  pdf.autoPrint();
  pdf.output('dataurlnewwindow');
};

export const downloadBarcode = async (options: BarcodeOptions): Promise<void> => {
  const barcodeValue = generateBarcode(options);
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  
  // Generate barcode on canvas
  JsBarcode(canvas, barcodeValue, {
    format: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    fontSize: 20,
    fontOptions: 'bold',
  });

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add barcode to PDF
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 10, 10, 100, 50);

  // Add sample information
  pdf.setFontSize(12);
  pdf.text(`Sample ID: ${options.sampleId}`, 10, 70);
  pdf.text(`Subject ID: ${options.subjectId}`, 10, 80);
  pdf.text(`Name: ${options.name}`, 10, 90);
  pdf.text(`Type: ${options.type}`, 10, 100);

  // Download PDF
  pdf.save(`barcode-${options.sampleId}.pdf`);
}; 