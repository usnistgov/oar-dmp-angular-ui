
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { DMP_Meta } from '../types/DMP.types';
import { DmpPdf } from '../dmp-form/dmp-pdf';

type ExportFormat = 'PDF' | 'Markdown' | 'JSON';

const SECTION_COLOR = '#1A52BC';

/**
 * Generates DMP exports (PDF / Markdown / JSON).
 *
 * Stateless and reentrant: every export builds its own PDF document / markdown
 * buffer locally rather than on instance fields, so concurrent or back-to-back
 * exports can't clobber each other's output.
 */

@Injectable({
  providedIn: 'root'
})

export class DmpExportService {

  /** Entry point. Dispatches on format. */
  export(dmp: DMP_Meta | undefined, format: ExportFormat): void {
    if (!dmp) {
      console.error('DmpExportService.export called with no DMP');
      return;
    }
    switch (format) {
      case 'JSON':     this.exportJson(dmp); break;
      case 'PDF':      this.exportPdf(dmp); break;
      case 'Markdown': this.exportMarkdown(dmp); break;
    }
  }

  // ==========================================================================
  // JSON
  // ==========================================================================

  private exportJson(dmp: DMP_Meta): void {
    const blob = new Blob([JSON.stringify(dmp, null, 2)], { type: 'text/json' });
    saveAs(blob, 'DMP.json');
  }

  // ==========================================================================
  // PDF
  // ==========================================================================

  private exportPdf(dmp: DMP_Meta): void {
    // A4 = 8.27 x 11.69 in
    const pdf = new jsPDF('p', 'in', 'a4');
    const doc = new DmpPdf(pdf, 0.5);

    doc.printHeader('Data Management Plan', 0.1, '#707b7c');

    this.buildBasicInfoPdf(doc, dmp);
    this.buildResearchersPdf(doc, dmp);
    this.buildKeywordsPdf(doc, dmp);
    this.buildTechnicalPdf(doc, dmp);
    this.buildEthicalPdf(doc, dmp);
    this.buildSecurityPdf(doc, dmp);
    this.buildDataDescriptionPdf(doc, dmp);
    this.buildPreservationPdf(doc, dmp);

    doc.exportAsPDF();
  }

  private buildBasicInfoPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Basic Information', 0.05, SECTION_COLOR, 20);

    if (dmp.title != null) doc.printTextField('Title', dmp.title);
    if (dmp.startDate != null) doc.printTextField('Start Date', dmp.startDate);
    if (dmp.dmpSearchable != null) doc.printTextField('Make DMP Searchable', dmp.dmpSearchable);
    if (dmp.funding !== undefined) {
      doc.printTable('Funding', ['Grant Source', 'Grant ID'],
        [[dmp.funding.grant_source, dmp.funding.grant_id]]);
    }
    if (dmp.projectDescription != null) doc.printTextField('Project Description', dmp.projectDescription);
  }

  private buildResearchersPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Researchers', 0.05, SECTION_COLOR, 20);

    if (dmp.contributors !== undefined) {
      const head = ['Name', 'Surname', 'Primary\nContact', 'Institution', 'ORG ID', 'e-mail', 'ORCID'];
      const body = dmp.contributors.map(c => [
        c.firstName, c.lastName, c.primary_contact, c.institution,
        c.groupNumber, c.emailAddress, c.orcid,
      ]);
      doc.printTable('Contributors', head, body);
    }

    if (dmp.organizations !== undefined) {
      const head = ['Group Name', 'Division Name', 'OU Name'];
      const body = dmp.organizations.map(o => [o.groupName, o.divisionName, o.ouName]);
      doc.printTable('Organization(s) Associated With This DMP', head, body);
    }
  }

  private buildKeywordsPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Keywords / Phrases', 0.05, SECTION_COLOR, 20);
    if (dmp.keywords !== undefined) {
      doc.printTable('', ['Keywords / Phrases'], dmp.keywords.map(k => [k]));
    }
  }

  private buildTechnicalPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Technical Requirements', 0.05, SECTION_COLOR, 20);

    if (dmp.dataSize != null) {
      doc.printTextField('Estimated Data Size',
        dmp.dataSize + dmp.sizeUnit + ' ' + dmp.dataSizeDescription);
    }

    const sw = dmp.softwareDevelopment;
    if (sw != null) {
      doc.printTextField('Software Development', sw.development);
      if (sw.softwareUse !== '') doc.printTextField('Software developed for this project will be for', sw.softwareUse);
      if (sw.softwareDatabase !== '') doc.printTextField('Does the software development require a database?', sw.softwareDatabase);
      if (sw.softwareWebsite !== '') doc.printTextField('Will the software development produce a website interface?', sw.softwareWebsite);
    }

    if (dmp.technicalResources !== undefined) {
      doc.printTable('', ['Technical resources equipment needed/used'],
        dmp.technicalResources.map(r => [r]));
    }

    if (dmp.instruments !== undefined) {
      const body = dmp.instruments.map(i => [i.name, i.description_url]);
      doc.printTable('Instruments needed/used',
        ['Instrument Name', 'Description / URL Landing Page'], body);
    }
  }

  private buildEthicalPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Ethical Concerns', 0.05, SECTION_COLOR, 20);

    const e = dmp.ethical_issues;
    if (e == null) return;

    if (e.irb_number != null) doc.printTextField('IRB number', e.irb_number);
    if (e.ethical_issues_exist !== '') {
      doc.printTextField('Are there any ethical issues related to the data that this DMP describes?', e.ethical_issues_exist);
    }
    if (e.ethical_issues_description !== '') {
      doc.printTextField('Describe any ethical issues raised in this project (human subjects etc)', e.ethical_issues_description);
    }
    if (e.ethical_issues_report !== '') {
      doc.printTextField('Ethical issues report', e.ethical_issues_report);
    }
  }

  private buildSecurityPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Security and Privacy', 0.05, SECTION_COLOR, 20);

    const sp = dmp.security_and_privacy;
    if (sp?.data_sensitivity !== undefined) {
      doc.printTable('', ['Data Sensitivity Level(s)'], sp.data_sensitivity.map(d => [d]));
      if (sp.cui !== undefined) {
        doc.printTable('', ['Controlled Unclassified Information (CUI)'], sp.cui.map(c => [c]));
      }
    }
  }

  private buildDataDescriptionPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Data Description', 0.05, SECTION_COLOR, 20);

    if (dmp.dataDescription != null) doc.printTextField('', dmp.dataDescription);
    if (dmp.dataCategories !== undefined) {
      doc.printTable('', ['Categories of the data that will be generated'],
        dmp.dataCategories.map(c => [c]));
    }
  }

  private buildPreservationPdf(doc: DmpPdf, dmp: DMP_Meta): void {
    doc.printHeader('Data Preservation and Accessibility', 0.05, SECTION_COLOR, 20);

    if (dmp.preservationDescription != null) doc.printTextField('Preservation Description', dmp.preservationDescription);
    if (dmp.dataAccess != null) doc.printTextField('Data discoverablity and accessiblity plan', dmp.dataAccess);
    if (dmp.pathsURLs !== undefined) {
      doc.printTable('', ['File path(s) / URL(s) for where data will be saved'],
        dmp.pathsURLs.map(p => [p]));
    }
  }

  // ==========================================================================
  // Markdown
  // ==========================================================================

  private exportMarkdown(dmp: DMP_Meta): void {
    const md: string[] = [];
    md.push('# Data Management Plan  \n');

    this.buildBasicInfoMd(md, dmp);
    this.buildResearchersMd(md, dmp);
    this.buildKeywordsMd(md, dmp);
    this.buildTechnicalMd(md, dmp);
    this.buildEthicalMd(md, dmp);
    this.buildSecurityMd(md, dmp);
    this.buildDataDescriptionMd(md, dmp);
    this.buildPreservationMd(md, dmp);

    const blob = new Blob(md, { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'DMP.md');
  }

  private sectionHeadingMd(md: string[], title: string): void {
    md.push('---  \n');
    md.push('## ' + title + '  \n');
    md.push('---  \n');
  }

  private field(md: string[], label: string, value: any): void {
    md.push('**' + label + ':** ' + this.escapeMarkdownText(value) + '  \n');
  }

  private buildBasicInfoMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Basic Information');
    if (dmp.title != null) this.field(md, 'Title', dmp.title);
    if (dmp.startDate != null) this.field(md, 'Start Date', dmp.startDate);
    if (dmp.dmpSearchable != null) this.field(md, 'Make DMP Searchable', dmp.dmpSearchable);
    if (dmp.funding !== undefined) {
      this.markdownTable(md, 'Funding', ['Grant Source', 'Grant ID'],
        [[dmp.funding.grant_source, dmp.funding.grant_id]]);
    }
    if (dmp.projectDescription != null) this.field(md, 'Project Description', dmp.projectDescription);
  }

  private buildResearchersMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Researchers');
    if (dmp.contributors !== undefined) {
      const head = ['Name', 'Surname', 'Primary Contact', 'Institution', 'ORG ID', 'e-mail', 'ORCID'];
      const body = dmp.contributors.map(c => [
        c.firstName, c.lastName, c.primary_contact, c.institution,
        c.groupNumber, c.emailAddress, c.orcid,
      ]);
      this.markdownTable(md, 'Contributors', head, body);
    }
    if (dmp.organizations !== undefined) {
      const body = dmp.organizations.map(o => [o.groupName, o.divisionName, o.ouName]);
      this.markdownTable(md, 'Organization(s) Associated With This DMP',
        ['Group Name', 'Division Name', 'OU Name'], body);
    }
  }

  private buildKeywordsMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Keywords / Phrases');
    if (dmp.keywords !== undefined) {
      this.markdownTable(md, '', ['Keywords / Phrases'], dmp.keywords.map(k => [k]));
    }
  }

  private buildTechnicalMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Technical Requirements');
    if (dmp.dataSize != null) {
      this.field(md, 'Estimated Data Size',
        dmp.dataSize + dmp.sizeUnit + ' ' + dmp.dataSizeDescription);
    }
    const sw = dmp.softwareDevelopment;
    if (sw != null) {
      this.field(md, 'Software Development', sw.development);
      if (sw.softwareUse !== '') this.field(md, 'Software developed for this project will be for', sw.softwareUse);
      if (sw.softwareDatabase !== '') this.field(md, 'Does the software development require a database?', sw.softwareDatabase);
      if (sw.softwareWebsite !== '') this.field(md, 'Will the software development produce a website interface?', sw.softwareWebsite);
    }
    if (dmp.technicalResources !== undefined) {
      this.markdownTable(md, '', ['Technical resources equipment needed/used'],
        dmp.technicalResources.map(r => [r]));
    }
    if (dmp.instruments !== undefined) {
      const body = dmp.instruments.map(i => [i.name, i.description_url]);
      this.markdownTable(md, 'Instruments needed/used',
        ['Instrument Name', 'Description / URL Landing Page'], body);
    }
  }

  private buildEthicalMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Ethical Concerns');
    const e = dmp.ethical_issues;
    if (e == null) return;
    if (e.irb_number != null) this.field(md, 'IRB number', e.irb_number);
    if (e.ethical_issues_exist !== '') this.field(md, 'Are there any ethical issues related to the data that this DMP describes?', e.ethical_issues_exist);
    if (e.ethical_issues_description !== '') this.field(md, 'Describe any ethical issues raised in this project (human subjects etc)', e.ethical_issues_description);
    if (e.ethical_issues_report !== '') this.field(md, 'Ethical issues report', e.ethical_issues_report);
  }

  private buildSecurityMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Security and Privacy');
    const sp = dmp.security_and_privacy;
    if (sp?.data_sensitivity !== undefined) {
      this.markdownTable(md, '', ['Data Sensitivity Level(s)'], sp.data_sensitivity.map(d => [d]));
      if (sp.cui !== undefined) {
        this.markdownTable(md, '', ['Controlled Unclassified Information (CUI)'], sp.cui.map(c => [c]));
      }
    }
  }

  private buildDataDescriptionMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Data Description');
    if (dmp.dataDescription != null) md.push(this.escapeMarkdownText(dmp.dataDescription) + '  \n');
    if (dmp.dataCategories !== undefined) {
      this.markdownTable(md, '', ['Categories of the data that will be generated'],
        dmp.dataCategories.map(c => [c]));
    }
  }

  private buildPreservationMd(md: string[], dmp: DMP_Meta): void {
    this.sectionHeadingMd(md, 'Data Preservation and Accessibility');
    if (dmp.preservationDescription != null) md.push('**Preservation Description**:' + this.escapeMarkdownText(dmp.preservationDescription) + '  \n');
    if (dmp.dataAccess != null) md.push('**Data discoverablity and accessiblity plan**:' + this.escapeMarkdownText(dmp.dataAccess) + '  \n');
    if (dmp.pathsURLs !== undefined) {
      this.markdownTable(md, '', ['File path(s) / URL(s) for where data will be saved'],
        dmp.pathsURLs.map(p => [p]));
    }
  }

  private markdownTable(md: string[], fieldName: string, tblHead: string[], tblBody: string[][]): void {
    if (fieldName !== '') {
      md.push('  \n');
      md.push('**' + this.escapeMarkdownText(fieldName) + ':**  \n');
    }
    md.push('  \n');

    md.push('|' + tblHead.map(h => this.escapeMarkdownCell(h)).join('|') + '|  \n');

    let sep = '|';
    for (let i = 0; i < tblHead.length; i++) sep += ' --- |';
    md.push(sep + '  \n');

    for (const row of tblBody) {
      md.push('|' + row.map(c => this.escapeMarkdownCell(c)).join('|') + '|  \n');
    }
    md.push('  \n');
  }

  // ==========================================================================
  // Escaping (unchanged from the component)
  // ==========================================================================

  /** Escape for a Markdown TABLE CELL: neutralize pipes, newlines, block
   *  markers, inline HTML, and link/code syntax. */
  private escapeMarkdownCell(value: any): string {
    if (value === null || value === undefined) return '';
    let s = String(value);
    s = s.replace(/\r\n|\r|\n/g, ' ');
    s = s.replace(/\\/g, '\\\\');
    s = s.replace(/\|/g, '\\|');
    s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    s = s.replace(/`/g, '\\`');
    return s;
  }

  /** Escape for Markdown PROSE: block markers and HTML matter, pipes don't. */
  private escapeMarkdownText(value: any): string {
    if (value === null || value === undefined) return '';
    let s = String(value);
    s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/`/g, '\\`');
    s = s.replace(/^(\s*)([#>\-*+])/gm, '$1\\$2');
    return s;
  }
}
