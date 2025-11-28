// localStorage utility functions

const STORAGE_KEYS = {
  USER: 'meditrack_user',
  APPOINTMENTS: 'meditrack_appointments',
  FAMILY: 'meditrack_family',
  MEDICATIONS: 'meditrack_medications',
  REPORTS: 'meditrack_reports',
  HEALTH_DATA: 'meditrack_health_data',
  PLANS: 'meditrack_plans',
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const clearStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

export const clearAllStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing all localStorage:', error);
  }
};

export { STORAGE_KEYS };

