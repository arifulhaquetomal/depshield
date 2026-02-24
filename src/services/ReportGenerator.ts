import jsPDF from 'jspdf';
import { ScanResult } from '@/types';

export const generateReport = (result: ScanResult) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // -- Header --
    doc.setFillColor(15, 23, 42); // slate-900 like
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('DepShield Security Report', margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 30);
    doc.text(`Target: ${result.repo.fullName}`, margin, 35);

    // -- Executive Summary --
    let y = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Executive Summary', margin, y);

    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(`Overall Risk Level: ${result.overallRiskLevel}`, margin, y);

    y += 7;
    doc.text(`Risk Score: ${result.overallRiskScore}/100`, margin, y);

    y += 7;
    doc.text(`Total Dependencies: ${result.summary.totalDependencies}`, margin, y);

    y += 7;
    doc.text(`Critical Vulnerabilities: ${result.summary.criticalVulnerabilities}`, margin, y);

    // -- Compliance / Top Risks --
    y += 20;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Top Critical Risks', margin, y);

    y += 10;
    doc.setFontSize(10);
    result.topRisks.slice(0, 5).forEach((item, index) => {
        doc.setTextColor(185, 28, 28); // red
        doc.text(`[${item.riskLevel}] ${item.dependency.name} v${item.dependency.version}`, margin, y);

        y += 5;
        doc.setTextColor(71, 85, 105);
        doc.text(`   Reason: ${item.reasons.join(', ')}`, margin, y);
        y += 10;
    });

    // -- Footer --
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - Private & Confidential`, pageWidth / 2, 290, { align: 'center' });
    }

    doc.save(`${result.repo.name}_security_report.pdf`);
};

import { WebScanResult } from './web-scanner';

export const generateWebReport = (result: WebScanResult) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // -- Header --
    doc.setFillColor(15, 23, 42); // slate-900 like
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('DepShield Web Security Report', margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 30);
    doc.text(`Target: ${result.domain}`, margin, 35);

    // -- Executive Summary --
    let y = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Executive Summary', margin, y);

    y += 10;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(`Security Grade: ${result.observatory.grade}`, margin, y);

    y += 7;
    doc.text(`Security Score: ${result.observatory.score}/100`, margin, y);

    y += 7;
    doc.text(`Scan Method: ${result.scanMethod === 'observatory' ? 'Mozilla Observatory' : 'Direct Browser Scan'}`, margin, y);

    // -- Technical Details --
    y += 15;
    doc.setFontSize(14);
    doc.text('Details', margin, y);

    y += 8;
    doc.setFontSize(10);
    doc.text(`HTTPS: ${result.technicalDetails.https ? 'Yes' : 'No'}`, margin, y);
    y += 5;
    doc.text(`Subdomains Found: ${result.certificates.length}`, margin, y);

    // -- Key Findings --
    y += 15;
    doc.setFontSize(14);
    doc.text('Detailed Findings', margin, y);

    y += 10;
    doc.setFontSize(10);
    const tests = Object.values(result.observatory.tests);

    tests.forEach((test) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        doc.setTextColor(test.pass ? 22 : 185, test.pass ? 163 : 28, test.pass ? 74 : 28); // Green vs Red
        doc.text(`[${test.pass ? 'PASS' : 'FAIL'}] ${test.name}`, margin, y);

        y += 5;
        doc.setTextColor(71, 85, 105);
        doc.text(`   ${test.score_description}`, margin, y);
        y += 8;
    });

    // -- Footer --
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} - DepShield Security Audit`, pageWidth / 2, 290, { align: 'center' });
    }

    doc.save(`${result.domain}_web_security_report.pdf`);
};
