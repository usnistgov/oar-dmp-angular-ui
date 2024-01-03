import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable'

interface dmpPDF {
  PDF:jsPDF,
  margin: number
}

export class DmpPdf implements dmpPDF{
  PDF:jsPDF;
  margin: number;

  private pgHeight:number;
  private pgWidth:number;
  private marginL:number;
  private marginR:number;
  private marginTop:number;
  private marginBottom:number;
  private ppi:number;
  private yOffset:number;

  constructor(PDF:jsPDF, margin: number){
    this.PDF = PDF;    
    this.margin = margin;

    this.pgHeight = this.PDF.internal.pageSize.height;
    this.pgWidth = this.PDF.internal.pageSize.width;
    this.ppi = this.PDF.internal.scaleFactor

    this.marginL = margin;
    this.marginR = this.pgWidth-margin;
    this.marginTop = margin;
    this.marginBottom = this.pgHeight-margin;
    this.yOffset = margin;
  }

  printMainHeader(header:string, lineWidth:number, linecolor:string, fontSize:number=35, fontType:string="Helvetica"){
    this.PDF.setFont(fontType, "bold").setFontSize(fontSize);
    this.PDF.text(header,this.marginL, this.yOffset+(fontSize/this.ppi));
    this.yOffset += (1 + this.marginL ) * (fontSize/this.ppi);

    this.PDF.setLineWidth(lineWidth);
    this.PDF.setDrawColor(linecolor);
    this.PDF.line(this.marginL , this.yOffset, this.marginR, this.yOffset);
    this.yOffset += (1 + this.marginL ) * (12/this.ppi);

  }

  exportAsPDF(fileName:string="DMP.pdf"){
    this.PDF.save(fileName);
  }
}
