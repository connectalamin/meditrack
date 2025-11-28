import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../utils/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [family, setFamily] = useState([]);
  const [medications, setMedications] = useState([]);
  const [reports, setReports] = useState([]);
  const [healthData, setHealthData] = useState({});
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user and data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          const response = await api.authAPI.getMe();
          setUser(response.user);
          await loadAllData();
    }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('deviceToken');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Load all data when user is logged in
  const loadAllData = async () => {
    try {
      const [appts, fam, meds, reps] = await Promise.all([
        api.appointmentsAPI.getAll().catch(() => []),
        api.familyAPI.getAll().catch(() => []),
        api.medicationsAPI.getAll().catch(() => []),
        api.reportsAPI.getAll().catch(() => []),
      ]);

      setAppointments(appts);
      setFamily(fam);
      setMedications(meds);
      setReports(reps);

      // Load health data and plans for each family member
      const healthDataMap = {};
      const plansMap = {};
      
      for (const member of fam) {
        try {
          const [hd, pl] = await Promise.all([
            api.healthDataAPI.getByMember(member.id).catch(() => []),
            api.plansAPI.getByMember(member.id).catch(() => []),
          ]);
          healthDataMap[member.id] = hd;
          plansMap[member.id] = pl;
        } catch (error) {
          console.error(`Failed to load data for member ${member.id}:`, error);
        }
      }

      setHealthData(healthDataMap);
      setPlans(plansMap);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message);
    }
  };

  // User functions
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.authAPI.login(email, password);
      setUser(response.user);
      await loadAllData();
      return response.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      setError(null);
      const response = await api.authAPI.register(email, password, displayName);
      setUser(response.user);
      await loadAllData();
      return response.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const googleLogin = async (idToken) => {
    try {
      setError(null);
      const response = await api.authAPI.googleLogin(idToken);
      setUser(response.user);
      await loadAllData();
      return response.user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
    setUser(null);
      setAppointments([]);
      setFamily([]);
      setMedications([]);
      setReports([]);
      setHealthData({});
      setPlans({});
    }
  };

  // Appointments functions
  const addAppointment = async (appointment) => {
    try {
      const newAppointment = await api.appointmentsAPI.create(appointment);
    setAppointments(prev => [...prev, newAppointment]);
    return newAppointment;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteAppointment = async (id) => {
    try {
      await api.appointmentsAPI.delete(id);
    setAppointments(prev => prev.filter(apt => apt.id !== id));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateAppointment = async (id, updates) => {
    try {
      const updated = await api.appointmentsAPI.update(id, updates);
    setAppointments(prev =>
        prev.map(apt => apt.id === id ? updated : apt)
    );
      return updated;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Family functions
  const addFamilyMember = async (member) => {
    try {
      const newMember = await api.familyAPI.create(member);
    setFamily(prev => [...prev, newMember]);
      setHealthData(prev => ({ ...prev, [newMember.id]: [] }));
      setPlans(prev => ({ ...prev, [newMember.id]: [] }));
    return newMember;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteFamilyMember = async (id) => {
    try {
      await api.familyAPI.delete(id);
    setFamily(prev => prev.filter(m => m.id !== id));
    setHealthData(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setPlans(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateFamilyMember = async (id, updates) => {
    try {
      const updated = await api.familyAPI.update(id, updates);
    setFamily(prev =>
        prev.map(m => m.id === id ? updated : m)
    );
      return updated;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Medications functions
  const addMedication = async (medication) => {
    try {
      const newMedication = await api.medicationsAPI.create(medication);
    setMedications(prev => [...prev, newMedication]);
    return newMedication;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteMedication = async (id) => {
    try {
      await api.medicationsAPI.delete(id);
    setMedications(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateMedication = async (id, updates) => {
    try {
      const updated = await api.medicationsAPI.update(id, updates);
    setMedications(prev =>
        prev.map(m => m.id === id ? updated : m)
    );
      return updated;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Reports functions
  const addReport = async (report) => {
    try {
      const newReport = await api.reportsAPI.create({
      ...report,
      date: report.date || new Date().toISOString(),
      });
    setReports(prev => [...prev, newReport]);
    return newReport;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteReport = async (id) => {
    try {
      await api.reportsAPI.delete(id);
    setReports(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateReport = async (id, updates) => {
    try {
      const updated = await api.reportsAPI.update(id, updates);
    setReports(prev =>
        prev.map(r => r.id === id ? updated : r)
    );
      return updated;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Health Data functions (per family member)
  const addHealthData = async (memberId, data) => {
    try {
      const newData = await api.healthDataAPI.create(memberId, data);
    setHealthData(prev => ({
      ...prev,
      [memberId]: [...(prev[memberId] || []), newData],
    }));
    return newData;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteHealthData = async (memberId, dataId) => {
    try {
      await api.healthDataAPI.delete(memberId, dataId);
    setHealthData(prev => ({
      ...prev,
      [memberId]: (prev[memberId] || []).filter(d => d.id !== dataId),
    }));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getHealthDataForMember = (memberId) => {
    return healthData[memberId] || [];
  };

  // Plans functions (per family member)
  const addPlan = async (memberId, plan) => {
    try {
      const newPlan = await api.plansAPI.create(memberId, plan);
    setPlans(prev => ({
      ...prev,
      [memberId]: [...(prev[memberId] || []), newPlan],
    }));
    return newPlan;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updatePlan = async (memberId, planId, updates) => {
    try {
      const updatedPlan = await api.plansAPI.update(memberId, planId, updates);
      setPlans(prev => ({
        ...prev,
        [memberId]: (prev[memberId] || []).map(p => p.id === planId ? updatedPlan : p),
      }));
      return updatedPlan;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deletePlan = async (memberId, planId) => {
    try {
      await api.plansAPI.delete(memberId, planId);
    setPlans(prev => ({
      ...prev,
      [memberId]: (prev[memberId] || []).filter(p => p.id !== planId),
    }));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getPlansForMember = (memberId) => {
    return plans[memberId] || [];
  };

  const clearAllData = async () => {
    try {
      setError(null);
      await api.authAPI.clearData();
      setAppointments([]);
      setFamily([]);
      setMedications([]);
      setReports([]);
      setHealthData({});
      setPlans({});
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    // State
    user,
    appointments,
    family,
    medications,
    reports,
    healthData,
    plans,
    loading,
    error,
    // User functions
    login,
    register,
    googleLogin,
    logout,
    // Appointments functions
    addAppointment,
    deleteAppointment,
    updateAppointment,
    // Family functions
    addFamilyMember,
    deleteFamilyMember,
    updateFamilyMember,
    // Medications functions
    addMedication,
    deleteMedication,
    updateMedication,
    // Reports functions
    addReport,
    deleteReport,
    updateReport,
    // Health Data functions
    addHealthData,
    deleteHealthData,
    getHealthDataForMember,
    // Plans functions
    addPlan,
    updatePlan,
    deletePlan,
    getPlansForMember,
    // Utility
    loadAllData,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
