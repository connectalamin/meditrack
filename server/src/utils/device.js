export const getDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  // Simple device name extraction
  if (userAgent.includes('Chrome')) {
    return 'Chrome Browser';
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox Browser';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari Browser';
  } else if (userAgent.includes('Edge')) {
    return 'Edge Browser';
  } else if (userAgent.includes('Mobile')) {
    return 'Mobile Device';
  }
  
  return 'Unknown Device';
};

