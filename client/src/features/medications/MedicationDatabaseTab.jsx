import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Edit, Search, Filter, XCircle } from 'lucide-react';
import { 
  useMedications,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication 
} from '../../hooks/useData';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Badge from '../../components/ui/Badge';

const MedicationDatabaseTab = () => {
  const { data: medications = [], isLoading } = useMedications();
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();
  const deleteMedication = useDeleteMedication();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    genericName: '', 
    brandName: '', 
    strength: '', 
    price: '', 
    packSize: '', 
    packSizeDescription: '', 
    primaryUse: '', 
    unit: 'tablets' 
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [infoFilter, setInfoFilter] = useState('all'); // 'all' | 'missingPrice' | 'missingInfo'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc'); // 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedMeds = useMemo(() => {
    const meds = [...medications];
    
    switch (sortBy) {
      case 'name-asc':
        return meds.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return meds.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return meds.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB;
        });
      case 'price-desc':
        return meds.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceB - priceA;
        });
      default:
        return meds.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [medications, sortBy]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(medications.map(m => m.category).filter(Boolean))].sort();
    return cats;
  }, [medications]);

  const filteredMeds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const bySearch = !term
      ? sortedMeds
      : sortedMeds.filter((med) => {
          const name = med.name?.toLowerCase() || '';
          const strength = med.strength?.toLowerCase() || '';
          const genericName = med.genericName?.toLowerCase() || '';
          const category = med.category?.toLowerCase() || '';
          return name.includes(term) || strength.includes(term) || genericName.includes(term) || category.includes(term);
        });

    // Apply category filter
    const byCategory = categoryFilter === 'all'
      ? bySearch
      : bySearch.filter((med) => med.category === categoryFilter);

    if (infoFilter === 'missingPrice') {
      return byCategory.filter((med) => !med.price || med.price <= 0);
    }

    if (infoFilter === 'missingInfo') {
      return byCategory.filter((med) => {
        const noPrice = !med.price || med.price <= 0;
        const noStrength = !med.strength;
        const noPack = !med.packSize || med.packSize <= 0;
        return noPrice || noStrength || noPack;
      });
    }

    return byCategory;
  }, [sortedMeds, searchTerm, infoFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMeds.length / itemsPerPage));

  const paginatedMeds = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMeds.slice(start, start + itemsPerPage);
  }, [filteredMeds, currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      category: '', 
      genericName: '', 
      brandName: '', 
      strength: '', 
      price: '', 
      packSize: '', 
      packSizeDescription: '', 
      primaryUse: '', 
      unit: 'tablets' 
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (med) => {
    setFormData({
      name: med.name || '',
      category: med.category || '',
      genericName: med.genericName || '',
      brandName: med.brandName || med.name || '',
      strength: med.strength || '',
      price: med.price?.toString() || '',
      packSize: med.packSize?.toString() || '1',
      packSizeDescription: med.packSizeDescription || '',
      primaryUse: med.primaryUse || '',
      unit: med.unit || 'tablets'
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const medicationData = {
      ...formData,
      price: formData.price ? Number(formData.price) : 0,
      packSize: formData.packSize ? Number(formData.packSize) : 1
    };

    try {
      if (editingId) {
        await updateMedication.mutateAsync({
          id: editingId,
          updates: medicationData
        });
      } else {
        await createMedication.mutateAsync(medicationData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save medication:', error);
    }
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      try {
        await deleteMedication.mutateAsync(deleteConfirm.id);
      } catch (error) {
        console.error('Failed to delete medication:', error);
      }
    }
    setDeleteConfirm({ isOpen: false, id: null, name: '' });
  };

  const hasActiveFilters = categoryFilter !== 'all' || infoFilter !== 'all' || searchTerm.trim() !== '' || sortBy !== 'name-asc';

  const clearAllFilters = () => {
    setCategoryFilter('all');
    setInfoFilter('all');
    setSearchTerm('');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-[#34D399] mb-1">
            Database
          </p>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            Global Medication Database
          </h2>
          <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-2">
            Shared list of medicines for the family, searchable and filterable.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          <div className="text-xs text-slate-500 dark:text-[#94a3b8]">
            Total medicines:{' '}
            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
              {medications.length}
            </span>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowForm(true); }} 
            className="whitespace-nowrap w-full sm:w-auto flex items-center gap-2 h-11 px-5"
          >
            <Plus size={18} />
            {editingId ? 'Cancel Edit' : 'Add New Medication'}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-4 sm:p-6 bg-white/90 dark:bg-[#1A202C]/90 border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 dark:text-[#64748b]">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, generic name, category, or strength..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200/80 dark:border-[#2D3748]/70 bg-white/90 dark:bg-[#1A202C] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-2">
                  <Filter size={14} className="inline mr-1" />
                  Category
                </label>
                <Select
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map(cat => ({ value: cat, label: cat }))
                  ]}
                  className="w-full"
                />
              </div>
            )}

            {/* Info Status Filter */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-2">
                Status
              </label>
              <Select
                value={infoFilter}
                onChange={(value) => {
                  setInfoFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Medicines' },
                  { value: 'missingPrice', label: 'Missing Price' },
                  { value: 'missingInfo', label: 'Incomplete Info' }
                ]}
                className="w-full"
              />
            </div>

            {/* Sort Filter */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-2">
                Sort By
              </label>
              <Select
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'name-asc', label: 'Name (A-Z)' },
                  { value: 'name-desc', label: 'Name (Z-A)' },
                  { value: 'price-asc', label: 'Price (Low to High)' },
                  { value: 'price-desc', label: 'Price (High to Low)' }
                ]}
                className="w-full"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <XCircle size={16} className="mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 dark:border-[#2D3748]/60">
              <span className="text-xs font-medium text-slate-500 dark:text-[#94a3b8]">Active filters:</span>
              {searchTerm && (
                <Badge variant="info" className="text-xs">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1.5 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {categoryFilter !== 'all' && (
                <Badge variant="info" className="text-xs">
                  Category: {categoryFilter}
                  <button
                    onClick={() => handleCategoryFilterChange('all')}
                    className="ml-1.5 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {infoFilter !== 'all' && (
                <Badge variant={infoFilter === 'missingPrice' ? 'warning' : 'error'} className="text-xs">
                  {infoFilter === 'missingPrice' ? 'Missing Price' : 'Incomplete Info'}
                  <button
                    onClick={() => setInfoFilter('all')}
                    className="ml-1.5 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              )}
              {sortBy !== 'name-asc' && (
                <Badge variant="info" className="text-xs">
                  Sort: {sortBy === 'name-desc' ? 'Name (Z-A)' : sortBy === 'price-asc' ? 'Price (Low to High)' : 'Price (High to Low)'}
                  <button
                    onClick={() => setSortBy('name-asc')}
                    className="ml-1.5 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-[#94a3b8] pt-3 border-t border-slate-200/70 dark:border-[#2D3748]/60">
            <span>
              Showing{' '}
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {filteredMeds.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {medications.length}
              </span>{' '}
              medicines
            </span>
            {hasActiveFilters && (
              <span className="text-xs text-slate-400 dark:text-[#64748b]">
                Filters applied – adjust or clear to see all medicines.
              </span>
            )}
          </div>
        </div>
      </Card>

      {showForm && (
        <Card className="bg-white/90 dark:bg-[#1A202C]/90 border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-[#F8FAFC]">
            {editingId ? 'Edit Medication' : 'Add New Medication'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#94a3b8] mb-4">
            Store the key details for each medication so you can reuse them across plans and purchase lists.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Brand Name" placeholder="e.g. Napa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Input label="Generic Name (Optional)" placeholder="e.g. Paracetamol" value={formData.genericName} onChange={e => setFormData({...formData, genericName: e.target.value})} />
              <Input label="Category (Optional)" placeholder="e.g. Pain & Fever" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input label="Strength" placeholder="500mg" value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} />
              <Input label="Price (Optional)" type="number" placeholder="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <Input label="Qty Per Pack" type="number" placeholder="10" value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} />
              <Select 
                label="Unit" 
                value={formData.unit} 
                onChange={value => setFormData({...formData, unit: value})}
                options={[
                  { value: 'tablets', label: 'Tablets' },
                  { value: 'capsules', label: 'Capsules' },
                  { value: 'bottles', label: 'Bottles' },
                  { value: 'tubes', label: 'Tubes' },
                  { value: 'drops', label: 'Drops' },
                  { value: 'syrup', label: 'Syrup' },
                  { value: 'ointment', label: 'Ointment' }
                ]}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Pack Size Description (Optional)" placeholder="e.g. Strip of 10 Tablets" value={formData.packSizeDescription} onChange={e => setFormData({...formData, packSizeDescription: e.target.value})} />
              <Input label="Primary Use (Optional)" placeholder="e.g. Fever, mild headache" value={formData.primaryUse} onChange={e => setFormData({...formData, primaryUse: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="flex items-center gap-2">
                {editingId ? 'Update Medication' : 'Save to Database'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Medications Grid */}
      {paginatedMeds.length === 0 ? (
        <Card className="p-12 text-center bg-white/90 dark:bg-[#1A202C]/90 border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-[#27335D] flex items-center justify-center">
              <Search className="text-slate-400 dark:text-[#94a3b8]" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] mb-2">
              No medicines found
            </h3>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8] mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms'
                : 'Get started by adding your first medication'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            ) : (
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus size={18} className="mr-2" />
                Add New Medication
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedMeds.map(med => (
            <Card 
              key={med.id} 
              className="p-5 flex flex-col justify-between group bg-white/90 dark:bg-[#1A202C]/90 border border-slate-200/80 dark:border-[#2D3748]/60 shadow-sm hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-400/60 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex-1">
                {/* Header with Actions */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-base text-slate-900 dark:text-[#F8FAFC] truncate" title={med.name}>
                      {med.name}
                    </h3>
                    {med.genericName && (
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1 truncate" title={med.genericName}>
                        {med.genericName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button 
                      onClick={() => handleEdit(med)} 
                      className="p-1.5 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(med.id, med.name)} 
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Category Badge */}
                {med.category && (
                  <div className="mb-3">
                    <Badge variant="info" className="text-xs">
                      {med.category}
                    </Badge>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {med.strength && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-[#94a3b8] min-w-[70px]">Strength:</span>
                      <span className="text-xs text-slate-700 dark:text-[#F8FAFC]">{med.strength}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-[#94a3b8] min-w-[70px]">Pack:</span>
                    <span className="text-xs text-slate-700 dark:text-[#F8FAFC]">
                      {med.packSizeDescription || `${med.packSize} ${med.unit}`}
                    </span>
                  </div>
                  {med.primaryUse && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-[#2D3748]/60">
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-2" title={med.primaryUse}>
                        {med.primaryUse}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Price */}
              <div className="pt-4 border-t border-slate-200/70 dark:border-[#2D3748]/60">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-[#94a3b8]">Price</span>
                  <span className={`font-bold text-base ${
                    med.price > 0 
                      ? 'text-emerald-600 dark:text-[#34D399]' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {med.price > 0 ? `${med.price.toLocaleString()} BDT` : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredMeds.length > 0 && totalPages > 1 && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-[#94a3b8]">
              Showing{' '}
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {Math.min(currentPage * itemsPerPage, filteredMeds.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {filteredMeds.length}
              </span>{' '}
              medicines
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-[#2D3748]/70 text-sm font-medium text-slate-700 dark:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#2A3741] transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                  let page;
                  if (totalPages <= 7) {
                    page = idx + 1;
                  } else if (currentPage <= 4) {
                    page = idx + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + idx;
                  } else {
                    page = currentPage - 3 + idx;
                  }
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium flex items-center justify-center border transition-colors ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-[#34D399] dark:bg-[#34D399]/10 dark:text-[#34D399]'
                          : 'border-slate-200/80 dark:border-[#2D3748]/70 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#2A3741]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 7 && currentPage < totalPages - 3 && (
                  <>
                    <span className="px-2 text-slate-400 dark:text-slate-500">...</span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      className="min-w-[36px] h-9 rounded-lg text-sm font-medium flex items-center justify-center border border-slate-200/80 dark:border-[#2D3748]/70 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#2A3741] transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-[#2D3748]/70 text-sm font-medium text-slate-700 dark:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#2A3741] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Medication"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default MedicationDatabaseTab;
