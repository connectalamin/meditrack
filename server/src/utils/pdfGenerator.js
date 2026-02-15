import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Keep Chromium binary compressed to stay within Vercel size limits
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

/**
 * Generate PDF from HTML string using Puppeteer
 * @param {string} html - HTML content to convert to PDF
 * @param {object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePDFFromHTML = async (html, options = {}) => {
  let browser;
  let page;
  try {
    console.log('Starting PDF generation...');
    console.log('HTML length:', html.length);
    
    // Launch browser with error handling
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
      console.log('Browser launched successfully');
    } catch (launchError) {
      console.error('Failed to launch browser:', launchError);
      throw new Error(`Failed to launch browser: ${launchError.message}`);
    }

    try {
      page = await browser.newPage();
      console.log('Page created successfully');
    } catch (pageError) {
      console.error('Failed to create page:', pageError);
      throw new Error(`Failed to create page: ${pageError.message}`);
    }
    
    // Set a longer timeout for page operations
    page.setDefaultTimeout(60000); // Increased to 60 seconds
    
    console.log('Setting page content...');
    // Set content with a more lenient wait condition
    try {
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      console.log('Page content set successfully');
    } catch (contentError) {
      console.error('Failed to set page content:', contentError);
      throw new Error(`Failed to set page content: ${contentError.message}`);
    }

    console.log('Waiting for content to render...');
    // Wait a bit for any dynamic content (waitForTimeout was removed in newer Puppeteer versions)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time

    console.log('Generating PDF...');
    // Generate PDF
    let pdf;
    try {
      pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        timeout: 60000, // 60 second timeout for PDF generation
        ...options
      });
      console.log('PDF generated, size:', pdf ? pdf.length : 0);
    } catch (pdfError) {
      console.error('Failed to generate PDF:', pdfError);
      throw new Error(`Failed to generate PDF: ${pdfError.message}`);
    }

    if (!pdf) {
      throw new Error('PDF generation returned null');
    }

    if (!Buffer.isBuffer(pdf) && !(pdf instanceof Uint8Array)) {
      throw new Error(`PDF is not a valid buffer. Type: ${typeof pdf}`);
    }

    if (pdf.length === 0) {
      throw new Error('Generated PDF is empty (0 bytes)');
    }

    // Convert to Buffer if it's a Uint8Array
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

    console.log('PDF buffer created, final size:', pdfBuffer.length);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Close page first, then browser
    if (page) {
      try {
        await page.close();
        console.log('Page closed');
      } catch (closeError) {
        console.error('Error closing page:', closeError);
      }
    }
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
};

/**
 * Generate HTML template for individual metric report
 */
export const generateMetricReportHTML = (data) => {
  const { type, memberName, metricData, displayUnit, timeAverages, generatedDate, totalRecords } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${type} - Vital Log Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, #f5f7fa 0%, #e2e8f0 100%);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .header-info {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      font-size: 12px;
      color: #64748b;
    }
    
    .header-info div {
      display: flex;
      flex-direction: column;
    }
    
    .header-info strong {
      color: #1e293b;
      margin-bottom: 2px;
    }
    
    .averages-box {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }
    
    .averages-title {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    
    .averages-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    
    .average-item {
      text-align: center;
    }
    
    .average-label {
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    .average-value {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    
    .average-meta {
      font-size: 9px;
      color: #64748b;
    }
    
    .no-data {
      font-size: 12px;
      color: #94a3b8;
      font-style: italic;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 24px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    thead {
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    
    th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      color: #1e293b;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    
    tbody tr:hover {
      background: #f8fafc;
    }
    
    .summary {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    
    .summary-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 12px;
    }
    
    .summary-value {
      font-size: 13px;
      color: #334155;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .header {
        page-break-inside: avoid;
      }
      
      .averages-box {
        page-break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${type.toUpperCase()} - VITAL LOG REPORT</h1>
    <div class="header-info">
      <div>
        <strong>Patient:</strong>
        <span>${memberName}</span>
      </div>
      <div>
        <strong>Generated:</strong>
        <span>${generatedDate}</span>
      </div>
      <div>
        <strong>Total Records:</strong>
        <span>${totalRecords}</span>
      </div>
    </div>
  </div>
  
  <div class="averages-box">
    <div class="averages-title">Period Averages</div>
    <div class="averages-grid">
      <div class="average-item">
        <div class="average-label">1 Week</div>
        ${timeAverages.oneWeek.avg 
          ? `<div class="average-value">${timeAverages.oneWeek.avg}</div>
             <div class="average-meta">${displayUnit} (${timeAverages.oneWeek.count} records)</div>`
          : '<div class="no-data">No data</div>'
        }
      </div>
      <div class="average-item">
        <div class="average-label">1 Month</div>
        ${timeAverages.oneMonth.avg 
          ? `<div class="average-value">${timeAverages.oneMonth.avg}</div>
             <div class="average-meta">${displayUnit} (${timeAverages.oneMonth.count} records)</div>`
          : '<div class="no-data">No data</div>'
        }
      </div>
      <div class="average-item">
        <div class="average-label">3 Months</div>
        ${timeAverages.threeMonths.avg 
          ? `<div class="average-value">${timeAverages.threeMonths.avg}</div>
             <div class="average-meta">${displayUnit} (${timeAverages.threeMonths.count} records)</div>`
          : '<div class="no-data">No data</div>'
        }
      </div>
    </div>
  </div>
  
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Value</th>
          <th>Unit</th>
        </tr>
      </thead>
      <tbody>
        ${metricData.map(record => {
          const date = new Date(record.date);
          const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          const timeStr = (record.time || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const displayValue = String(record.displayValue || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `
            <tr>
              <td>${dateStr}</td>
              <td>${timeStr}</td>
              <td>${displayValue}</td>
              <td>${(displayUnit || record.unit || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>
  
  ${metricData.length > 1 ? `
    <div class="summary">
      <div class="summary-title">Summary</div>
      <div class="summary-value">${data.summaryText}</div>
    </div>
  ` : ''}
</body>
</html>
  `.trim();
};

/**
 * Generate HTML template for all vitals report
 * Redesigned to match the newer colourful, card-based dashboard look.
 */
export const generateAllVitalsReportHTML = (data) => {
  const { memberName, groupedData, generatedDate, totalRecords } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vital Report - ${memberName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
      background: #0b1120;
      line-height: 1.6;
      padding: 24px;
    }

    .page {
      max-width: 820px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 45%, #f8fafc 100%);
      border-radius: 18px;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);
      padding: 28px 32px 32px;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }
    
    .header {
      background: radial-gradient(circle at top left, #bbf7d0 0%, #ecfeff 35%, #e5e7eb 100%);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
      border: 1px solid rgba(148, 163, 184, 0.4);
    }
    
    .header-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 12px;
    }

    .title-block h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .title-sub {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #0369a1;
      font-weight: 600;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      background: rgba(15, 118, 110, 0.08);
      color: #047857;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .header-info {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 11px;
      color: #64748b;
    }
    
    .header-info div {
      display: flex;
      flex-direction: column;
      min-width: 120px;
    }
    
    .label {
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.12em;
      color: #6b7280;
      margin-bottom: 3px;
      font-weight: 600;
    }

    .value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }
    
    .metric-section {
      margin-bottom: 26px;
      page-break-inside: avoid;
      padding: 18px 20px 20px;
      border-radius: 16px;
      background: #ffffff;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
    }
    
    .metric-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .metric-pill {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(16, 185, 129, 0.06);
      color: #0f766e;
      border: 1px solid rgba(34, 197, 94, 0.35);
    }
    
    .metric-meta {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 14px;
    }
    
    .averages-box {
      background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 40%, #ecfeff 100%);
      border-radius: 12px;
      padding: 14px 16px 16px;
      margin-bottom: 14px;
      border: 1px solid rgba(5, 150, 105, 0.6);
    }
    
    .averages-title {
      font-size: 10px;
      font-weight: 700;
      color: #064e3b;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      margin-bottom: 10px;
    }
    
    .averages-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    
    .average-item {
      text-align: center;
    }
    
    .average-label {
      font-size: 9px;
      font-weight: 600;
      color: #065f46;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    
    .average-value {
      font-size: 16px;
      font-weight: 800;
      color: #022c22;
      margin-bottom: 2px;
    }
    
    .average-meta {
      font-size: 8px;
      color: #047857;
    }
    
    .no-data {
      font-size: 10px;
      color: #0f172a;
      font-style: italic;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 2px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    
    thead {
      background: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
    }
    
    th {
      padding: 8px 8px;
      text-align: left;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.08em;
    }
    
    td {
      padding: 7px 8px;
      border-top: 1px solid #e5e7eb;
      color: #111827;
      background: #ffffff;
    }
    
    tbody tr:nth-child(even) td {
      background: #f9fafb;
    }

    .footer {
      margin-top: 18px;
      font-size: 9px;
      text-align: center;
      color: #6b7280;
    }
    
    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      
      .page {
        box-shadow: none;
        border-radius: 0;
        border: none;
      }
      
      .metric-section {
        page-break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-title-row">
        <div class="title-block">
          <h1>VITAL REPORT</h1>
          <div class="title-sub">Clinical summary overview</div>
        </div>
        <div class="badge">Confidential health data</div>
      </div>
      <div class="header-info">
        <div>
          <div class="label">Patient</div>
          <div class="value">${memberName}</div>
        </div>
        <div>
          <div class="label">Generated</div>
          <div class="value">${generatedDate}</div>
        </div>
        <div>
          <div class="label">Total Records</div>
          <div class="value">${totalRecords}</div>
        </div>
      </div>
    </div>
  
    ${groupedData.map(({ type, records, displayUnit, timeAverages }) => {
      const escapeHtml = (str) => {
        if (!str) return '';
        return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
      };
      return `
      <div class="metric-section">
        <div class="metric-title">
          <span>${escapeHtml(type)}</span>
          <span class="metric-pill">${records.length} record${records.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="metric-meta">
          Unit: ${escapeHtml(displayUnit || 'N/A')}
        </div>
        ${timeAverages ? `
        <div class="averages-box">
          <div class="averages-title">Period averages</div>
          <div class="averages-grid">
            <div class="average-item">
              <div class="average-label">1 Week</div>
              ${timeAverages.oneWeek.avg 
                ? `<div class="average-value">${escapeHtml(timeAverages.oneWeek.avg)}</div>
                   <div class="average-meta">${escapeHtml(displayUnit || '')} (${timeAverages.oneWeek.count} records)</div>`
                : '<div class="no-data">No data in last 7 days</div>'
              }
            </div>
            <div class="average-item">
              <div class="average-label">1 Month</div>
              ${timeAverages.oneMonth.avg 
                ? `<div class="average-value">${escapeHtml(timeAverages.oneMonth.avg)}</div>
                   <div class="average-meta">${escapeHtml(displayUnit || '')} (${timeAverages.oneMonth.count} records)</div>`
                : '<div class="no-data">No data in last 30 days</div>'
              }
            </div>
            <div class="average-item">
              <div class="average-label">3 Months</div>
              ${timeAverages.threeMonths.avg 
                ? `<div class="average-value">${escapeHtml(timeAverages.threeMonths.avg)}</div>
                   <div class="average-meta">${escapeHtml(displayUnit || '')} (${timeAverages.threeMonths.count} records)</div>`
                : '<div class="no-data">No data in last 90 days</div>'
              }
            </div>
          </div>
        </div>
        ` : ''}
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Value</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(record => {
                const date = new Date(record.date);
                const dateStr = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                const timeStr = escapeHtml(record.time || '-');
                const displayValue = escapeHtml(String(record.displayValue || ''));
                return `
                  <tr>
                    <td>${dateStr}</td>
                    <td>${timeStr}</td>
                    <td>${displayValue}</td>
                    <td>${escapeHtml(displayUnit || record.unit || '')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    }).join('')}

    <div class="footer">
      Generated by MediTrack · This report is for informational purposes and does not replace professional medical advice.
    </div>
  </div>
</body>
</html>
  `.trim();
};

