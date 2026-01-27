import { useState, useEffect } from 'react';
import { 
  Book, 
  Menu, 
  Search, 
  ChevronRight, 
  Code2,
  Shield,
  Calendar,
  Users,
  Pill,
  FileText,
  Activity,
  ClipboardList,
  TrendingUp,
  Scan,
  FileDown,
  AlertCircle
} from 'lucide-react';
import Badge from './components/Badge';
import CodeBlock from './components/CodeBlock';
import Endpoint from './components/Endpoint';
import ApiPlayground from './components/ApiPlayground';
import ParameterTable from './components/ParameterTable';
import MarkdownContent from './components/MarkdownContent';
import { apiSections, apiEndpoints } from './apiEndpoints';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://meditrack-server-alpha.vercel.app/api';

export default function APIDocsTab() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sectionIcons = {
    introduction: Book,
    authentication: Shield,
    appointments: Calendar,
    family: Users,
    medications: Pill,
    reports: FileText,
    'health-data': Activity,
    plans: ClipboardList,
    'purchase-list': ClipboardList,
    analytics: TrendingUp,
    ocr: Scan,
    pdf: FileDown,
    errors: AlertCircle,
  };

  const filteredSections = apiSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSectionContent = () => {
    const section = apiEndpoints[activeSection];
    
    if (!section) {
      return (
        <div className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC] mb-4">
            {apiSections.find(s => s.id === activeSection)?.title || 'Introduction'}
          </h1>
          <p className="text-xl text-slate-600 dark:text-[#94a3b8] mb-6">
            {apiSections.find(s => s.id === activeSection)?.description || ''}
          </p>
        </div>
      );
    }

    if (section.content) {
      // Markdown content (for introduction and errors)
      return <MarkdownContent content={section.content} />;
    }

    // Endpoint-based content
    return (
      <div className="prose prose-slate max-w-none">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#F8FAFC] mb-4">
          {apiSections.find(s => s.id === activeSection)?.title || 'API Documentation'}
        </h1>
        <p className="text-xl text-slate-600 dark:text-[#94a3b8] mb-6 leading-relaxed">
          {apiSections.find(s => s.id === activeSection)?.description || ''}
        </p>

        {section.endpoints?.map((endpoint, index) => (
          <div key={index} className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mb-4 flex items-center group">
              <a href={`#${endpoint.path}`} className="no-underline hover:underline decoration-emerald-500 dark:decoration-[#34D399] underline-offset-4">
                {endpoint.title}
              </a>
            </h2>
            <p className="text-slate-600 dark:text-[#94a3b8] mb-6">
              {endpoint.description}
            </p>

            <Endpoint method={endpoint.method} path={endpoint.path} title={endpoint.title} />

            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] mt-8 mb-4">Parameters</h3>
                <ParameterTable parameters={endpoint.parameters} />
              </>
            )}

            {endpoint.exampleRequest && (
              <>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] mb-4">Example Request</h3>
                <CodeBlock language="json" title="Request Body">
                  {JSON.stringify(endpoint.exampleRequest, null, 2)}
                </CodeBlock>
              </>
            )}

            <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] mt-8 mb-4">Try it out</h3>
            <p className="text-slate-600 dark:text-[#94a3b8] mb-4">
              Use the playground below to test this endpoint live against the API.
            </p>

            <ApiPlayground
              method={endpoint.method}
              endpoint={endpoint.path}
              defaultBody={endpoint.exampleRequest ? JSON.stringify(endpoint.exampleRequest, null, 2) : ''}
              requiresAuth={endpoint.requiresAuth !== false}
              isFormData={endpoint.isFormData || false}
            />

            {endpoint.exampleResponse && (
              <>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] mt-8 mb-4">Response Object</h3>
                <p className="text-slate-600 dark:text-[#94a3b8] mb-4">
                  Returns the {endpoint.title.toLowerCase()} object.
                </p>
                <CodeBlock title="Response" language="json">
                  {JSON.stringify(endpoint.exampleResponse, null, 2)}
                </CodeBlock>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-white dark:bg-[#111725] flex flex-col md:flex-row font-sans text-slate-900 dark:text-[#F8FAFC] -mx-3 md:-mx-4 lg:-mx-8 -mt-6">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#27335D] bg-white dark:bg-[#111725] sticky top-0 z-20">
        <div className="font-bold text-lg tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 dark:bg-[#34D399] rounded-md"></div>
          <span className="text-slate-900 dark:text-[#F8FAFC]">MediTrack API</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-600 dark:text-[#94a3b8]"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-0 z-10 bg-slate-50 dark:bg-[#111725] border-r border-slate-200 dark:border-[#27335D] w-64 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 pt-20 md:pt-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full overflow-y-auto p-6">
          <div className="hidden md:flex items-center gap-2 font-bold text-xl tracking-tight mb-8 text-emerald-700 dark:text-[#34D399]">
            <div className="w-6 h-6 bg-emerald-500 dark:bg-[#34D399] rounded-md shadow-sm"></div>
            <span className="text-slate-900 dark:text-[#F8FAFC]">MediTrack API</span>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#94a3b8]" size={14} />
            <input 
              type="text" 
              placeholder="Search docs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1B2430] border border-slate-200 dark:border-[#27335D] rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-[#34D399] focus:border-emerald-500 dark:focus:border-[#34D399] outline-none text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#94a3b8]"
            />
          </div>

          <nav className="space-y-1">
            {(searchQuery ? filteredSections : apiSections).map((item) => {
              const Icon = sectionIcons[item.id] || Book;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-emerald-50 dark:bg-[#34D399]/10 text-emerald-700 dark:text-[#34D399]' 
                      : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#1B2430] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Icon size={16} />
                  {item.label || item.title}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-[#27335D]">
            <h4 className="text-xs font-semibold text-slate-400 dark:text-[#94a3b8] uppercase tracking-wider mb-4">API Info</h4>
            <div className="text-xs text-slate-500 dark:text-[#94a3b8] space-y-2">
              <p className="text-slate-400 dark:text-[#94a3b8] mb-2">Base URL:</p>
              <p className="font-mono break-all text-slate-600 dark:text-[#94a3b8]">{API_BASE_URL}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-[#94a3b8] mb-8">
            <span>API Docs</span>
            <ChevronRight size={14} />
            <span className="capitalize text-emerald-600 dark:text-[#34D399] font-medium">
              {apiSections.find(s => s.id === activeSection)?.title || activeSection}
            </span>
          </div>

          {/* Content Rendering */}
          <div className="animate-in fade-in duration-300">
            {renderSectionContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
