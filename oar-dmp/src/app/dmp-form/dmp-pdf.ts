import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable'


export class DmpPdf{
  PDF:jsPDF;

  private pgHeight:number;
  private pgWidth:number;
  private marginL:number;
  private marginR:number;
  private marginTop:number;
  private marginBottom:number;
  private ppi:number;
  private yOffset:number;
  private paragraphWidth:number;

  constructor(PDF:jsPDF, margin: number){
    this.PDF = PDF;    

    this.pgHeight = this.PDF.internal.pageSize.height;
    this.pgWidth = this.PDF.internal.pageSize.width;
    this.ppi = this.PDF.internal.scaleFactor

    this.marginL = margin;
    this.marginR = this.pgWidth-margin;
    this.paragraphWidth = this.marginR-margin
    this.marginTop = margin;
    this.marginBottom = this.pgHeight-margin;
    this.yOffset = margin;
  }

  printHeader(header:string, lineWidth:number, linecolor:string, fontSize:number=35, fontType:string="Helvetica"){
    // Project the height of the header 
    let totalHeaderHeight = (1 + this.marginTop ) * (fontSize/this.ppi);
    totalHeaderHeight += ((1 + this.marginTop ) * (12/this.ppi))*2;
    
    // if total height oif the header is greater than the page height then create new page
    this.newPageCheck(totalHeaderHeight);

    this.PDF.setFont(fontType, "bold").setFontSize(fontSize);
    this.PDF.text(header,this.marginL, this.yOffset+(fontSize/this.ppi));
    this.yOffset += (1 + this.marginTop ) * (fontSize/this.ppi);

    this.PDF.setLineWidth(lineWidth);
    this.PDF.setDrawColor(linecolor);
    this.PDF.line(this.marginL , this.yOffset, this.marginR, this.yOffset);
    this.yOffset += (1 + this.marginTop ) * (12/this.ppi);
  }

  printTextField(fieldName:string, fieldValue:string, fontSize:number=12, fontType:string="Helvetica"){
    let lineStartY = this.yOffset+(fontSize/this.ppi);

    this.newPageCheck(lineStartY);

    // set bold type font for field name
    this.PDF.setFont(fontType, "bold").setFontSize(fontSize);
    // split text to multi line
    let splitText = this.PDF.splitTextToSize(fieldName, this.paragraphWidth)
    this.addMultipleLines(splitText,fontSize);

    // ====================================================
    // set font type to normal
    this.PDF.setFont(fontType, "normal").setFontSize(fontSize);
    splitText = this.PDF.splitTextToSize(fieldValue, this.paragraphWidth)
    this.addMultipleLines(splitText,fontSize);
  }

  printTable(fieldName:string, tblHead:Array<string>, tblBody:Array<Array<string>>, fontSize:number=12, fontType:string="Helvetica"){
    let lineStartY = this.yOffset+(fontSize/this.ppi);

    this.newPageCheck(lineStartY);

    // set bold type font for field name
    this.PDF.setFont(fontType, "bold").setFontSize(fontSize);
    // split text to multi line
    let splitText = this.PDF.splitTextToSize(fieldName, this.paragraphWidth)
    this.addMultipleLines(splitText,fontSize);

    autoTable(this.PDF, {head:[tblHead], body:[tblBody], startY:this.yOffset});

    // Get they coordinate where the table ended
    let finalY = (this.PDF as any).lastAutoTable.finalY;
    // increase the offset by one line
    this.yOffset = finalY + ((1 + this.marginTop ) * (fontSize/this.ppi));

  }

  private addMultipleLines(text:string, fontSize:number){
    for(var i=0; i<text.length; i++){
      this.newPageCheck(this.yOffset);
      this.PDF.text(text[i],this.marginL, this.yOffset+(fontSize/this.ppi))
      this.yOffset += (1 + this.marginTop ) * (fontSize/this.ppi);
    }
  }

  private newPageCheck(yCoord:number){
    //check if next line's y coordinate is greater than the page size
    if (yCoord > this.marginBottom ){
      this.PDF.addPage(); // add new page
      this.yOffset = this.marginTop; //reset y offset
    }
  }

  exportAsPDF(fileName:string="DMP.pdf"){
    this.PDF.save(fileName);
  }
}
