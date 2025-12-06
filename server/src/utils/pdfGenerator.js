import puppeteer from 'puppeteer';

/**
 * Generate PDF from HTML string using Puppeteer
 * @param {string} html - HTML content to convert to PDF
 * @param {object} options - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generatePDFFromHTML = async (html, options = {}) => {
  let browser;
  try {
    console.log('Starting PDF generation...');
    console.log('HTML length:', html.length);
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-web-security'
      ]
    });

    console.log('Browser launched successfully');

    const page = await browser.newPage();
    
    // Set a longer timeout for page operations
    page.setDefaultTimeout(30000);
    
    console.log('Setting page content...');
    // Set content with a more lenient wait condition
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Page content set, waiting...');
    // Wait a bit for any dynamic content (waitForTimeout was removed in newer Puppeteer versions)
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Generating PDF...');
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      ...options
    });

    console.log('PDF generated, size:', pdf ? pdf.length : 0);

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
    console.error('Error stack:', error.stack);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
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
    
    .metric-section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    
    .metric-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #10b981;
    }
    
    .metric-meta {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 12px;
    }
    
    .averages-box {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .averages-title {
      font-size: 10px;
      font-weight: 700;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .averages-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .average-item {
      text-align: center;
    }
    
    .average-label {
      font-size: 9px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    
    .average-value {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 3px;
    }
    
    .average-meta {
      font-size: 8px;
      color: #64748b;
    }
    
    .no-data {
      font-size: 10px;
      color: #94a3b8;
      font-style: italic;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 16px;
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
    
    @media print {
      body {
        padding: 0;
      }
      
      .header {
        page-break-inside: avoid;
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
  <div class="header">
    <h1>VITAL REPORT</h1>
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
  
  ${groupedData.map(({ type, records, displayUnit, timeAverages }) => {
    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    };
    return `
    <div class="metric-section">
      <div class="metric-title">${escapeHtml(type)}</div>
      <div class="metric-meta">
        ${records.length} record${records.length !== 1 ? 's' : ''} • Unit: ${escapeHtml(displayUnit || 'N/A')}
      </div>
      ${timeAverages ? `
      <div class="averages-box">
        <div class="averages-title">Period Averages</div>
        <div class="averages-grid">
          <div class="average-item">
            <div class="average-label">1 Week</div>
            ${timeAverages.oneWeek.avg 
              ? `<div class="average-value">${escapeHtml(timeAverages.oneWeek.avg)}</div>
                 <div class="average-meta">${escapeHtml(displayUnit || '')} (${timeAverages.oneWeek.count} records)</div>`
              : '<div class="no-data">No data</div>'
            }
          </div>
          <div class="average-item">
            <div class="average-label">1 Month</div>
            ${timeAverages.oneMonth.avg 
              ? `<div class="average-value">${escapeHtml(timeAverages.oneMonth.avg)}</div>
                 <div class="average-meta">${escapeHtml(displayUnit || '')} (${timeAverages.oneMonth.count} records)</div>`
              : '<div class="no-data">No data</div>'
            }
          </div>
          <div class="average-item">
            <div class="average-label">3 Months</div>
            ${timeAverages.threeMonths.avg 
              ? `<div class="average-value">${escapeHtml(timeAverages.threeMonths.avg)}</div>
                 <div class="average-meta">${escapeHtml(displayUnit || '')} (${timeAverages.threeMonths.count} records)</div>`
              : '<div class="no-data">No data</div>'
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
</body>
</html>
  `.trim();
};

