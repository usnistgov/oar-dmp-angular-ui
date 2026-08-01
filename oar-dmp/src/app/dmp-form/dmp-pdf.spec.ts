jest.mock('jspdf-autotable', () => jest.fn((pdf: any) => {
  (pdf as any).lastAutoTable = { finalY: 500 };
}));

import autoTable from 'jspdf-autotable';
import { DmpPdf } from './dmp-pdf';

function createMockPDF(pageHeight = 800, pageWidth = 600, scaleFactor = 1) {
  const pdf: any = {
    internal: {
      pageSize: { height: pageHeight, width: pageWidth },
      scaleFactor,
    },
    setFont: jest.fn().mockReturnThis(),
    setFontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    setLineWidth: jest.fn().mockReturnThis(),
    setDrawColor: jest.fn().mockReturnThis(),
    line: jest.fn().mockReturnThis(),
    splitTextToSize: jest.fn((txt: string) => (Array.isArray(txt) ? txt : [txt])),
    addPage: jest.fn().mockReturnThis(),
    save: jest.fn().mockReturnThis(),
    lastAutoTable: undefined,
  };
  return pdf;
}

describe('DmpPdf', () => {
  let mockPDF: any;
  let dmpPdf: DmpPdf;
  const margin = 20;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPDF = createMockPDF();
    dmpPdf = new DmpPdf(mockPDF, margin);
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(dmpPdf).toBeTruthy();
    });

    it('should store the PDF reference', () => {
      expect(dmpPdf.PDF).toBe(mockPDF);
    });

    it('should derive page dimensions and margins from the PDF internals', () => {
      // marginR = pgWidth - margin; paragraphWidth = marginR - margin
      const spy = jest.spyOn(mockPDF, 'text');
      dmpPdf.printHeader('Title', 1, '#000000');
      // marginL passed to text() should equal the margin
      expect(spy).toHaveBeenCalledWith('Title', margin, expect.any(Number));
    });

    it('should compute marginBottom from page height and margin', () => {
      // If we print a header repeatedly until it forces addPage, marginBottom logic is exercised
      const tinyPDF = createMockPDF(30, 600, 1); // marginBottom = 30 - 20 = 10, very small
      const pdfInstance = new DmpPdf(tinyPDF, 20);
      pdfInstance.printHeader('Header', 1, '#000000', 35);
      expect(tinyPDF.addPage).toHaveBeenCalled();
    });
  });

  describe('printHeader', () => {
    it('should set bold font and print the header text', () => {
      dmpPdf.printHeader('My Header', 2, '#123456', 20, 'Times');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Times', 'bold');
      expect(mockPDF.setFontSize).toHaveBeenCalledWith(20);
      expect(mockPDF.text).toHaveBeenCalledWith('My Header', margin, expect.any(Number));
    });

    it('should draw an underline with the given width and color', () => {
      dmpPdf.printHeader('My Header', 3, '#abcdef');
      expect(mockPDF.setLineWidth).toHaveBeenCalledWith(3);
      expect(mockPDF.setDrawColor).toHaveBeenCalledWith('#abcdef');
      expect(mockPDF.line).toHaveBeenCalledWith(margin, expect.any(Number), expect.any(Number), expect.any(Number));
    });

    it('should use default fontSize 35 and fontType Helvetica when not provided', () => {
      dmpPdf.printHeader('Default Header', 1, '#000000');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Helvetica', 'bold');
      expect(mockPDF.setFontSize).toHaveBeenCalledWith(35);
    });

    it('should trigger a new page when projected header height exceeds remaining space', () => {
      const smallPDF = createMockPDF(50, 600, 1);
      const smallPdfInstance = new DmpPdf(smallPDF, 10);
      smallPdfInstance.printHeader('Big Header', 1, '#000000', 35);
      expect(smallPDF.addPage).toHaveBeenCalled();
    });
  });

  describe('printTextField', () => {
    it('should print the field name in bold and the value in normal font', () => {
      dmpPdf.printTextField('Name', 'John Doe');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Helvetica', 'bold');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Helvetica', 'normal');
    });

    it('should strip non-ASCII characters from the field value before rendering', () => {
      const valueWithUnicode = 'Café résumé \u2013 test';
      dmpPdf.printTextField('Description', valueWithUnicode);
      const splitCalls = mockPDF.splitTextToSize.mock.calls.map((c: any[]) => c[0]);
      const valueCallArg = splitCalls.find((arg: string) => arg.includes('test'));
      expect(valueCallArg).not.toMatch(/[\u0080-\uffff]/);
    });

    it('should use custom fontSize and fontType when provided', () => {
      dmpPdf.printTextField('Label', 'Value', 16, 'Courier');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Courier', 'bold');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Courier', 'normal');
      expect(mockPDF.setFontSize).toHaveBeenCalledWith(16);
    });

    it('should call splitTextToSize for both field name and field value', () => {
      dmpPdf.printTextField('FieldName', 'FieldValue');
      expect(mockPDF.splitTextToSize).toHaveBeenCalledWith('FieldName', expect.any(Number));
      expect(mockPDF.splitTextToSize).toHaveBeenCalledWith('FieldValue', expect.any(Number));
    });

    it('should trigger a new page when the line would overflow the bottom margin', () => {
      const smallPDF = createMockPDF(30, 600, 1);
      const smallPdfInstance = new DmpPdf(smallPDF, 20);
      smallPdfInstance.printTextField('Field', 'Value');
      expect(smallPDF.addPage).toHaveBeenCalled();
    });
  });

  describe('printTextLine', () => {
    it('should strip non-ASCII characters from the value before rendering', () => {
      const valueWithUnicode = 'Zürich – 2024';
      dmpPdf.printTextLine(valueWithUnicode);
      const splitCalls = mockPDF.splitTextToSize.mock.calls.map((c: any[]) => c[0]);
      expect(splitCalls[0]).not.toMatch(/[\u0080-\uffff]/);
    });

    it('should set bold font before printing the line', () => {
      dmpPdf.printTextLine('Some text', 14, 'Arial');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Arial', 'bold');
      expect(mockPDF.setFontSize).toHaveBeenCalledWith(14);
    });

    it('should use default fontSize 12 and fontType Helvetica when not provided', () => {
      dmpPdf.printTextLine('Default line');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Helvetica', 'bold');
      expect(mockPDF.setFontSize).toHaveBeenCalledWith(12);
    });

    it('should trigger a new page when the line would overflow the bottom margin', () => {
      const smallPDF = createMockPDF(30, 600, 1);
      const smallPdfInstance = new DmpPdf(smallPDF, 20);
      smallPdfInstance.printTextLine('Overflow line');
      expect(smallPDF.addPage).toHaveBeenCalled();
    });
  });

  describe('printTable', () => {
    it('should print the field name label in bold before the table', () => {
      dmpPdf.printTable('Table Title', ['Col1', 'Col2'], [['a', 'b']]);
      expect(mockPDF.setFont).toHaveBeenCalledWith('Helvetica', 'bold');
      expect(mockPDF.splitTextToSize).toHaveBeenCalledWith('Table Title', expect.any(Number));
    });

    it('should call autoTable with the correct head, body, and startY', () => {
      const head = ['A', 'B'];
      const body = [['1', '2'], ['3', '4']];
      dmpPdf.printTable('My Table', head, body);
      expect(autoTable).toHaveBeenCalledWith(
        mockPDF,
        expect.objectContaining({
          head: [head],
          body,
          startY: expect.any(Number),
          headStyles: { fillColor: 'd6e0f5', textColor: '0d0d0d' },
        })
      );
    });

    it('should advance yOffset based on the finalY reported by autoTable', () => {
      dmpPdf.printTable('T1', ['A'], [['x']]);
      // After this call, printing another element should start below finalY (500)
      dmpPdf.printTextLine('after table');
      const lastTextCallArgs = mockPDF.text.mock.calls[mockPDF.text.mock.calls.length - 1];
      expect(lastTextCallArgs[2]).toBeGreaterThan(500);
    });

    it('should use custom fontSize and fontType for the table label', () => {
      dmpPdf.printTable('Styled Table', ['A'], [['x']], 18, 'Courier');
      expect(mockPDF.setFont).toHaveBeenCalledWith('Courier', 'bold');
      expect(mockPDF.setFontSize).toHaveBeenCalledWith(18);
    });
  });

  describe('newPageCheck (via public methods)', () => {
    it('should not add a page when content fits on the current page', () => {
      dmpPdf.printTextLine('fits fine');
      expect(mockPDF.addPage).not.toHaveBeenCalled();
    });

    it('should add a page and reset yOffset to marginTop when content overflows', () => {
      const smallPDF = createMockPDF(40, 600, 1);
      const smallInstance = new DmpPdf(smallPDF, 20);
      smallInstance.printTextLine('too much content to fit');
      expect(smallPDF.addPage).toHaveBeenCalledTimes(1);
      // subsequent print should render starting near the top margin again
      smallPDF.text.mockClear();
      smallInstance.printTextLine('second line');
      const yArg = smallPDF.text.mock.calls[0][2];
      expect(yArg).toBeLessThan(40);
    });
  });

  describe('exportAsPDF', () => {
    it('should call PDF.save with the default filename when none is provided', () => {
      dmpPdf.exportAsPDF();
      expect(mockPDF.save).toHaveBeenCalledWith('DMP.pdf');
    });

    it('should call PDF.save with a custom filename when provided', () => {
      dmpPdf.exportAsPDF('CustomReport.pdf');
      expect(mockPDF.save).toHaveBeenCalledWith('CustomReport.pdf');
    });
  });
});
