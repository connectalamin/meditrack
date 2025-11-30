// Health Metrics Configuration and Conversion Utilities

// Conversion constants
const GLUCOSE_CONVERSION_FACTOR = 18.0182; // mg/dL to mmol/L
const HEMOGLOBIN_CONVERSION_FACTOR = 10; // g/dL to g/L

/**
 * Convert glucose value from mg/dL to mmol/L
 */
export const convertGlucoseToMmolL = (value) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  return (numValue / GLUCOSE_CONVERSION_FACTOR).toFixed(2);
};

/**
 * Convert glucose value from mmol/L to mg/dL
 */
export const convertGlucoseToMgDl = (value) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  return Math.round(numValue * GLUCOSE_CONVERSION_FACTOR);
};

/**
 * Convert hemoglobin value from g/dL to g/L
 */
export const convertHemoglobinToGL = (value) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  return (numValue * HEMOGLOBIN_CONVERSION_FACTOR).toFixed(1);
};

/**
 * Convert hemoglobin value from g/L to g/dL
 */
export const convertHemoglobinToGDl = (value) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  return (numValue / HEMOGLOBIN_CONVERSION_FACTOR).toFixed(1);
};

/**
 * Health metric configurations
 */
export const HEALTH_METRICS = {
  'Blood Pressure': {
    defaultUnit: 'mmHg',
    supportedUnits: ['mmHg'],
    hasConversion: false,
    normalRanges: {
      categories: [
        { name: 'Normal', systolic: '90-119', diastolic: '60-79' },
        { name: 'Elevated', systolic: '120-129', diastolic: '< 80' },
        { name: 'Stage 1 Hypertension', systolic: '130-139', diastolic: '80-89' },
        { name: 'Stage 2 Hypertension', systolic: '≥ 140', diastolic: '≥ 90' }
      ],
      note: 'Same for men and women — sex doesn\'t change the normal BP range.'
    }
  },
  'Glucose': {
    defaultUnit: 'mmol/L',
    supportedUnits: ['mmol/L', 'mg/dL'],
    hasConversion: true,
    normalRanges: {
      mgdL: {
        'Fasting': '70–99',
        'After Meal (2 hours)': '< 140',
        'Random / Anytime': '70–140'
      },
      mmolL: {
        'Fasting': '3.9–5.5',
        'After Meal (2 hours)': '< 7.8',
        'Random / Anytime': '3.9–7.8'
      },
      note: 'Men & Women'
    }
  },
  'Hemoglobin': {
    defaultUnit: 'g/dL',
    supportedUnits: ['g/dL', 'g/L'],
    hasConversion: true,
    normalRanges: {
      gdL: {
        'Men': '13.0 – 17.0',
        'Women': '12.0 – 15.5'
      },
      gL: {
        'Men': '130 – 170',
        'Women': '120 – 155'
      },
      note: 'Hemoglobin (Hgb)'
    }
  }
};

/**
 * Get metric configuration
 */
export const getMetricConfig = (metricType) => {
  return HEALTH_METRICS[metricType] || null;
};

/**
 * Check if metric has unit conversion
 */
export const hasUnitConversion = (metricType) => {
  const config = getMetricConfig(metricType);
  return config?.hasConversion || false;
};

/**
 * Get supported units for a metric type
 */
export const getSupportedUnits = (metricType) => {
  const config = getMetricConfig(metricType);
  return config?.supportedUnits || [];
};

/**
 * Get default unit for a metric type
 */
export const getDefaultUnit = (metricType) => {
  const config = getMetricConfig(metricType);
  return config?.defaultUnit || '';
};

/**
 * Convert value based on metric type and units
 */
export const convertValue = (value, metricType, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return value;
  
  if (metricType === 'Glucose') {
    if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
      return convertGlucoseToMmolL(value);
    } else if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
      return convertGlucoseToMgDl(value);
    }
  } else if (metricType === 'Hemoglobin') {
    if (fromUnit === 'g/dL' && toUnit === 'g/L') {
      return convertHemoglobinToGL(value);
    } else if (fromUnit === 'g/L' && toUnit === 'g/dL') {
      return convertHemoglobinToGDl(value);
    }
  }
  
  return value;
};

/**
 * Get normal ranges for a metric type in a specific unit
 */
export const getNormalRanges = (metricType, unit) => {
  const config = getMetricConfig(metricType);
  if (!config || !config.normalRanges) return null;
  
  if (metricType === 'Glucose') {
    return unit === 'mg/dL' ? config.normalRanges.mgdL : config.normalRanges.mmolL;
  } else if (metricType === 'Hemoglobin') {
    return unit === 'g/dL' ? config.normalRanges.gdL : config.normalRanges.gL;
  } else if (metricType === 'Blood Pressure') {
    return config.normalRanges;
  }
  
  return null;
};

/**
 * Get predefined metric types
 */
export const getPredefinedMetricTypes = () => {
  return Object.keys(HEALTH_METRICS);
};

