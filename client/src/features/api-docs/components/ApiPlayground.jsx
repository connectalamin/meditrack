import { useState } from 'react';
import { Play, Server, Terminal, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meditrack-server-alpha.vercel.app/api';

const ApiPlayground = ({ method, endpoint, defaultBody, requiresAuth = true, isFormData = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [requestBody, setRequestBody] = useState(defaultBody || '');
  const [responseTime, setResponseTime] = useState(null);

  const getTokens = () => {
    const accessToken = localStorage.getItem('accessToken');
    const deviceToken = localStorage.getItem('deviceToken');
    return { accessToken, deviceToken };
  };

  const makeRequest = async () => {
    setIsLoading(true);
    setResponse(null);
    setStatus(null);
    setError(null);
    setResponseTime(null);

    const { accessToken, deviceToken } = getTokens();

    if (requiresAuth && !accessToken) {
      setError('Authentication required. Please sign in to use this endpoint.');
      setIsLoading(false);
      return;
    }

    const startTime = Date.now();

    try {
      const headers = {};
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      if (deviceToken) {
        headers['x-device-token'] = deviceToken;
      }

      let body = null;
      if (method !== 'GET' && requestBody) {
        if (isFormData) {
          // For FormData, don't set Content-Type - browser will set it with boundary
          const formData = new FormData();
          try {
            const jsonBody = JSON.parse(requestBody);
            Object.keys(jsonBody).forEach(key => {
              if (jsonBody[key] !== null && jsonBody[key] !== undefined) {
                formData.append(key, jsonBody[key]);
              }
            });
          } catch {
            // If not JSON, treat as plain text
            formData.append('data', requestBody);
          }
          body = formData;
        } else {
          headers['Content-Type'] = 'application/json';
          try {
            body = JSON.stringify(JSON.parse(requestBody));
          } catch {
            body = requestBody;
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: isFormData && body instanceof FormData ? headers : { ...headers, ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}) },
        body,
      });

      const responseTime = Date.now() - startTime;
      setResponseTime(responseTime);

      const contentType = response.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType && contentType.includes('application/pdf')) {
        responseData = { message: 'PDF file received', contentType: 'application/pdf', size: response.headers.get('content-length') || 'unknown' };
      } else {
        responseData = { message: await response.text() || 'Response received' };
      }

      setStatus(response.status);
      setResponse(responseData);
    } catch (err) {
      const responseTime = Date.now() - startTime;
      setResponseTime(responseTime);
      setError(err.message || 'Request failed');
      setStatus(0);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('accessToken');
  };

  return (
    <div className="my-8 border border-slate-200 dark:border-[#27335D] rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#1B2430]">
      <div className="bg-slate-50 dark:bg-[#111725] px-4 py-3 border-b border-slate-200 dark:border-[#27335D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-slate-400 dark:text-[#94a3b8]" />
          <span className="text-sm font-semibold text-slate-700 dark:text-[#F8FAFC]">Try it out</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isAuthenticated() ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></span>
          <span className="text-xs text-slate-500 dark:text-[#94a3b8] font-medium">
            {isAuthenticated() ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </div>
      </div>
      
      <div className="p-4 grid lg:grid-cols-2 gap-6">
        {/* Request Column */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider mb-2">Endpoint</label>
            <div className="flex items-center gap-2 font-mono text-sm bg-slate-100 dark:bg-[#27335D] p-2 rounded border border-slate-200 dark:border-[#27335D]">
              <span className={`font-bold ${
                method === 'GET' ? 'text-blue-600 dark:text-blue-400' :
                method === 'POST' ? 'text-green-600 dark:text-green-400' :
                method === 'PUT' ? 'text-orange-600 dark:text-orange-400' :
                'text-red-600 dark:text-red-400'
              }`}>{method}</span>
              <span className="text-slate-600 dark:text-[#F8FAFC]">{endpoint}</span>
            </div>
          </div>
          
          {method !== 'GET' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider mb-2">Body</label>
              <textarea 
                className="w-full h-32 font-mono text-xs p-3 bg-slate-50 dark:bg-[#111725] border border-slate-200 dark:border-[#27335D] rounded focus:ring-2 focus:ring-emerald-500 dark:focus:ring-[#34D399] focus:border-emerald-500 dark:focus:border-[#34D399] outline-none resize-none text-slate-900 dark:text-[#F8FAFC]"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder={isFormData ? 'Form data (JSON format)' : 'JSON body'}
              />
            </div>
          )}

          {requiresAuth && !isAuthenticated() && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg">
              <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-yellow-700 dark:text-yellow-400">This endpoint requires authentication</span>
            </div>
          )}

          <button 
            onClick={makeRequest}
            disabled={isLoading || (requiresAuth && !isAuthenticated())}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-[#34D399] dark:text-[#111725] dark:hover:bg-[#2EB886] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-auto"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Play size={16} />
            )}
            {isLoading ? 'Sending...' : 'Send Request'}
          </button>
        </div>

        {/* Response Column */}
        <div className="flex flex-col h-full min-h-[200px]">
          <label className="block text-xs font-semibold text-slate-500 dark:text-[#94a3b8] uppercase tracking-wider mb-2">Response</label>
          <div className={`flex-1 rounded border border-slate-200 dark:border-[#27335D] bg-slate-900 dark:bg-[#0B101B] p-4 font-mono text-xs overflow-auto ${
            response ? (status >= 200 && status < 300 ? 'text-green-400 dark:text-green-300' : 'text-red-400 dark:text-red-300') : 'text-slate-500 dark:text-[#94a3b8]'
          }`}>
            {error ? (
              <div>
                <div className="flex justify-between items-center mb-2 border-b border-slate-800 dark:border-[#27335D] pb-2">
                  <span className="text-xs text-slate-400 dark:text-[#94a3b8]">Status: <span className="text-red-400 dark:text-red-300">Error</span></span>
                  {responseTime && <span className="text-xs text-slate-400 dark:text-[#94a3b8]">{responseTime}ms</span>}
                </div>
                <pre className="whitespace-pre-wrap">{error}</pre>
              </div>
            ) : response ? (
              <>
                <div className="flex justify-between items-center mb-2 border-b border-slate-800 dark:border-[#27335D] pb-2">
                  <span className="text-xs text-slate-400 dark:text-[#94a3b8]">
                    Status: <span className={status >= 200 && status < 300 ? 'text-green-400 dark:text-green-300' : 'text-red-400 dark:text-red-300'}>
                      {status} {status >= 200 && status < 300 ? 'OK' : 'Error'}
                    </span>
                  </span>
                  {responseTime && <span className="text-xs text-slate-400 dark:text-[#94a3b8]">{responseTime}ms</span>}
                </div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-50">
                <Server size={24} className="mb-2" />
                <p>Waiting for request...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiPlayground;
