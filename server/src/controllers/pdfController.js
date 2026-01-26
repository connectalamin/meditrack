import prisma from '../config/database.js';
import { generatePDFFromHTML, generateMetricReportHTML, generateAllVitalsReportHTML } from '../utils/pdfGenerator.js';

/**
 * Calculate time-based averages for a metric
 */
const calculateTimeBasedAverages = (records, type, displayUnit, hasConversion, convertValue) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const getValue = (record) => {
    if (type === 'Blood Pressure') {
      const [sys, dia] = record.value.split('/').map(Number);
      return { systolic: sys, diastolic: dia };
    }
    let val = Number(record.value);
    if (hasConversion && displayUnit && record.unit && record.unit !== displayUnit) {
      val = parseFloat(convertValue(record.value, type, record.unit, displayUnit)) || val;
    }
    return val;
  };

  const filterByDate = (startDate) => {
    return records.filter(r => {
      const recordDate = new Date(r.date + (r.time ? `T${r.time}` : ''));
      return recordDate >= startDate;
    });
  };

  const calculateAvg = (filteredRecords) => {
    if (filteredRecords.length === 0) return null;
    if (type === 'Blood Pressure') {
      const avgSys = filteredRecords.reduce((sum, r) => {
        const val = getValue(r);
        return sum + (isNaN(val.systolic) ? 0 : val.systolic);
      }, 0) / filteredRecords.length;
      const avgDia = filteredRecords.reduce((sum, r) => {
        const val = getValue(r);
        return sum + (isNaN(val.diastolic) ? 0 : val.diastolic);
      }, 0) / filteredRecords.length;
      return `${Math.round(avgSys)}/${Math.round(avgDia)}`;
    } else {
      const avg = filteredRecords.reduce((sum, r) => {
        const val = getValue(r);
        return sum + (isNaN(val) ? 0 : val);
      }, 0) / filteredRecords.length;
      return avg.toFixed(2);
    }
  };

  return {
    oneWeek: { avg: calculateAvg(filterByDate(oneWeekAgo)), count: filterByDate(oneWeekAgo).length },
    oneMonth: { avg: calculateAvg(filterByDate(oneMonthAgo)), count: filterByDate(oneMonthAgo).length },
    threeMonths: { avg: calculateAvg(filterByDate(threeMonthsAgo)), count: filterByDate(threeMonthsAgo).length }
  };
};

/**
 * Unit conversion functions matching client-side implementation
 */
const GLUCOSE_CONVERSION_FACTOR = 18.0182; // mg/dL to mmol/L
const HEMOGLOBIN_CONVERSION_FACTOR = 10; // g/dL to g/L

const convertValue = (value, type, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;

  // Glucose conversions
  if (type === 'Glucose') {
    if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
      return (numValue / GLUCOSE_CONVERSION_FACTOR).toFixed(2);
    } else if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
      return Math.round(numValue * GLUCOSE_CONVERSION_FACTOR).toString();
    }
  }
  
  // Hemoglobin conversions
  if (type === 'Hemoglobin') {
    if (fromUnit === 'g/dL' && toUnit === 'g/L') {
      return (numValue * HEMOGLOBIN_CONVERSION_FACTOR).toFixed(1);
    } else if (fromUnit === 'g/L' && toUnit === 'g/dL') {
      return (numValue / HEMOGLOBIN_CONVERSION_FACTOR).toFixed(1);
    }
  }

  // Temperature conversions
  if (type === 'Temperature') {
    if (fromUnit === '°F' && toUnit === '°C') {
      return ((numValue - 32) * 5 / 9).toFixed(2);
    }
    if (fromUnit === '°C' && toUnit === '°F') {
      return ((numValue * 9 / 5) + 32).toFixed(2);
    }
  }

  // Weight conversions
  if (type === 'Weight') {
    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return (numValue * 0.453592).toFixed(2);
    }
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return (numValue * 2.20462).toFixed(2);
    }
  }

  // Default: return original value if conversion not supported
  return value;
};

/**
 * Get default unit for a metric type
 */
const getDefaultUnit = (type) => {
  const defaults = {
    'Blood Pressure': 'mmHg',
    'Glucose': 'mmol/L', // Default per client config
    'Hemoglobin': 'g/dL',
    'Temperature': '°F',
    'Weight': 'lbs',
    'Heart Rate': 'bpm',
    'Oxygen Saturation': '%'
  };
  return defaults[type] || '';
};

/**
 * Check if metric has unit conversion
 */
const hasUnitConversion = (type) => {
  return ['Glucose', 'Hemoglobin', 'Temperature', 'Weight'].includes(type);
};

/**
 * Generate PDF for individual metric
 */
export const generateMetricPDF = async (req, res, next) => {
  try {
    const { familyMemberId, type } = req.params;

    // Verify family member access
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    const userIds = [req.user.id];
    if (user?.linkedFamilyId) {
      userIds.push(user.linkedFamilyId);
    }

    const usersLinkedToMe = await prisma.user.findMany({
      where: { linkedFamilyId: req.user.id },
      select: { id: true }
    });
    
    usersLinkedToMe.forEach(u => {
      if (!userIds.includes(u.id)) {
        userIds.push(u.id);
      }
    });

    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        userId: { in: userIds }
      }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Get health data for this metric type
    const healthData = await prisma.healthData.findMany({
      where: {
        familyMemberId,
        type
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    if (healthData.length === 0) {
      return res.status(404).json({ message: 'No data available for this metric' });
    }

    // Get display unit (use first record's unit or default)
    const displayUnit = healthData[0]?.unit || getDefaultUnit(type);
    const hasConversion = hasUnitConversion(type);

    // Calculate time-based averages
    const timeAverages = calculateTimeBasedAverages(healthData, type, displayUnit, hasConversion, convertValue);

    // Process records for display
    const metricData = healthData.map(record => {
      let displayValue = record.value;
      if (hasConversion && displayUnit && record.unit && record.unit !== displayUnit) {
        displayValue = convertValue(record.value, type, record.unit, displayUnit);
      }
      return {
        ...record,
        displayValue
      };
    });

    // Calculate summary
    let summaryText = '';
    if (metricData.length > 1) {
      if (type === 'Blood Pressure') {
        const avgSys = healthData.reduce((sum, r) => {
          const [sys] = r.value.split('/').map(Number);
          return sum + (isNaN(sys) ? 0 : sys);
        }, 0) / healthData.length;
        const avgDia = healthData.reduce((sum, r) => {
          const [, dia] = r.value.split('/').map(Number);
          return sum + (isNaN(dia) ? 0 : dia);
        }, 0) / healthData.length;
        summaryText = `Average: ${Math.round(avgSys)}/${Math.round(avgDia)} ${displayUnit || 'mmHg'}`;
      } else {
        const avg = healthData.reduce((sum, r) => {
          let val = Number(r.value);
          if (hasConversion && displayUnit && r.unit && r.unit !== displayUnit) {
            val = parseFloat(convertValue(r.value, type, r.unit, displayUnit)) || val;
          }
          return sum + (isNaN(val) ? 0 : val);
        }, 0) / healthData.length;
        summaryText = `Average: ${avg.toFixed(2)} ${displayUnit}`;
      }
    }

    // Generate HTML
    const html = generateMetricReportHTML({
      type,
      memberName: familyMember.name,
      metricData,
      displayUnit,
      timeAverages,
      generatedDate: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      totalRecords: healthData.length,
      summaryText
    });

    // Generate PDF
    const pdf = await generatePDFFromHTML(html);

    // Validate PDF buffer (Puppeteer returns Buffer or Uint8Array)
    if (!pdf) {
      throw new Error('Generated PDF is null');
    }
    
    // Convert to Buffer if needed
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    
    if (pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty (0 bytes)');
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vital-log-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Send PDF buffer and ensure response is ended
    res.send(pdfBuffer);
    console.log('PDF sent successfully, size:', pdfBuffer.length);
  } catch (error) {
    console.error('Error generating metric PDF:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Generate PDF for all vitals
 */
export const generateAllVitalsPDF = async (req, res, next) => {
  try {
    const { familyMemberId } = req.params;

    // Verify family member access
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    const userIds = [req.user.id];
    if (user?.linkedFamilyId) {
      userIds.push(user.linkedFamilyId);
    }

    const usersLinkedToMe = await prisma.user.findMany({
      where: { linkedFamilyId: req.user.id },
      select: { id: true }
    });
    
    usersLinkedToMe.forEach(u => {
      if (!userIds.includes(u.id)) {
        userIds.push(u.id);
      }
    });

    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        userId: { in: userIds }
      }
    });

    if (!familyMember) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    // Get all health data
    const healthData = await prisma.healthData.findMany({
      where: { familyMemberId },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    if (healthData.length === 0) {
      return res.status(404).json({ message: 'No health data available' });
    }

    // Group by metric type
    const groupedByType = {};
    healthData.forEach(record => {
      if (!groupedByType[record.type]) {
        groupedByType[record.type] = [];
      }
      groupedByType[record.type].push(record);
    });

    // Process each group
    const groupedData = Object.entries(groupedByType).map(([type, records]) => {
      const displayUnit = records[0]?.unit || getDefaultUnit(type);
      const hasConversion = hasUnitConversion(type);

      const processedRecords = records.map(record => {
        let displayValue = record.value;
        if (hasConversion && displayUnit && record.unit && record.unit !== displayUnit) {
          displayValue = convertValue(record.value, type, record.unit, displayUnit);
        }
        return {
          ...record,
          displayValue
        };
      });

      // Calculate time-based averages for this metric type
      const timeAverages = calculateTimeBasedAverages(records, type, displayUnit, hasConversion, convertValue);

      return {
        type,
        records: processedRecords,
        displayUnit,
        timeAverages
      };
    });

    // Generate HTML
    const html = generateAllVitalsReportHTML({
      memberName: familyMember.name,
      groupedData,
      generatedDate: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      totalRecords: healthData.length
    });

    // Generate PDF
    const pdf = await generatePDFFromHTML(html);

    // Validate PDF buffer (Puppeteer returns Buffer or Uint8Array)
    if (!pdf) {
      throw new Error('Generated PDF is null');
    }
    
    // Convert to Buffer if needed
    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
    
    if (pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty (0 bytes)');
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${familyMember.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vital-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Send PDF buffer and ensure response is ended
    res.send(pdfBuffer);
    console.log('PDF sent successfully, size:', pdfBuffer.length);
  } catch (error) {
    console.error('Error generating all vitals PDF:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

