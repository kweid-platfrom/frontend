'use client';

import React, { useState, useMemo } from 'react';
import {
  Download, Grid, List, Sparkles, Plus, Loader2, ArrowLeft,
  Database, Search, Check, Copy, User, Mail, Phone, MapPin,
  CreditCard, Calendar, Lock, Globe, Palette, FileText, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Pagination from '../common/Pagination';
import EnhancedBulkActionsBar from '../common/EnhancedBulkActionsBar';

const ICON_MAP = { User, Mail, Phone, MapPin, CreditCard, Database, Calendar, Lock, Globe, Palette, FileText, Hash };

const COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  pink: 'bg-pink-100 text-pink-600',
  gray: 'bg-gray-100 text-gray-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  orange: 'bg-orange-100 text-orange-600',
  teal: 'bg-teal-100 text-teal-600',
  violet: 'bg-violet-100 text-violet-600',
};

const predefinedTypes = [
  { id: 'names', name: 'Names', description: 'Generate random names for testing user profiles', icon: 'User', color: 'blue' },
  { id: 'emails', name: 'Emails', description: 'Generate random email addresses', icon: 'Mail', color: 'purple' },
  { id: 'phone-numbers', name: 'Phone Numbers', description: 'Generate random phone numbers', icon: 'Phone', color: 'green' },
  { id: 'addresses', name: 'Addresses', description: 'Generate random addresses', icon: 'MapPin', color: 'red' },
  { id: 'credit-cards', name: 'Credit Cards', description: 'Generate test credit card numbers', icon: 'CreditCard', color: 'yellow' },
  { id: 'personal-data', name: 'Personal Data', description: 'Generate comprehensive personal profiles', icon: 'Database', color: 'indigo' },
  { id: 'dates', name: 'Dates', description: 'Generate random dates', icon: 'Calendar', color: 'pink' },
  { id: 'passwords', name: 'Passwords', description: 'Generate secure passwords', icon: 'Lock', color: 'gray' },
  { id: 'usernames', name: 'Usernames', description: 'Generate random usernames', icon: 'User', color: 'cyan' },
  { id: 'urls', name: 'URLs', description: 'Generate random URLs', icon: 'Globe', color: 'blue' },
  { id: 'colors', name: 'Colors', description: 'Generate random colors', icon: 'Palette', color: 'orange' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate Lorem Ipsum text', icon: 'FileText', color: 'teal' },
  { id: 'ssn', name: 'Social Security Numbers', description: 'Generate random SSNs', icon: 'Hash', color: 'violet' },
];

const generators = {
  names: () => [
    `John ${['Doe', 'Smith', 'Johnson'][Math.floor(Math.random() * 3)]}`,
    `Jane ${['Doe', 'Smith', 'Johnson'][Math.floor(Math.random() * 3)]}`,
    `Bob ${['Doe', 'Smith', 'Johnson'][Math.floor(Math.random() * 3)]}`,
  ],
  emails: () => [
    `user${Math.floor(Math.random() * 1000)}@example.com`,
    `test${Math.floor(Math.random() * 1000)}@gmail.com`,
    `dev${Math.floor(Math.random() * 1000)}@test.com`,
  ],
  'phone-numbers': () => [
    `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
  ],
  addresses: () => [
    `${Math.floor(Math.random() * 9999)} Main St, Anytown, CA ${Math.floor(Math.random() * 90000 + 10000)}`,
    `${Math.floor(Math.random() * 9999)} Oak Ave, Somewhere, NY ${Math.floor(Math.random() * 90000 + 10000)}`,
    `${Math.floor(Math.random() * 9999)} Pine Rd, Nowheresville, TX ${Math.floor(Math.random() * 90000 + 10000)}`,
  ],
  'credit-cards': () => [
    `4111 1111 1111 ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    `5555 5555 5555 ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    `4111 1111 1111 ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  ],
  'personal-data': () => [
    `Name: John Doe, Email: john@example.com, Phone: +1-555-123-4567`,
    `Name: Jane Smith, Email: jane@test.com, Phone: +1-555-987-6543`,
    `Name: Bob Johnson, Email: bob@gmail.com, Phone: +1-555-456-7890`,
  ],
  dates: () => {
    const start = new Date(2000, 0, 1);
    const end = new Date();
    return Array.from({ length: 3 }, () => {
      const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      return date.toISOString().split('T')[0];
    });
  },
  passwords: () => [
    Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!@',
    Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4).toUpperCase() + '#$',
    Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-4).toUpperCase() + '%^',
  ],
  usernames: () => [
    `user_${Math.random().toString(36).substring(7)}`,
    `dev_${Math.random().toString(36).substring(7)}`,
    `test_${Math.random().toString(36).substring(7)}`,
  ],
  urls: () => [
    `https://www.example-${Math.floor(Math.random() * 100)}.com`,
    `https://test-site-${Math.floor(Math.random() * 100)}.com`,
    `https://demo-app-${Math.floor(Math.random() * 100)}.io`,
  ],
  colors: () => [
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
  ],
  'lorem-ipsum': () => [
    'Lorem ipsum dolor sit amet.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.',
  ],
  ssn: () => [
    `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 9000 + 1000)}`,
  ],
};

const TestData = () => {
  const [types, setTypes] = useState(predefinedTypes);
  const [data, setData] = useState({});
  const [selectedType, setSelectedType] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', icon: 'Database', color: 'blue' });
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [typesPage, setTypesPage] = useState(1);
  const [typesPerPage, setTypesPerPage] = useState(20);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedTypeIds, setSelectedTypeIds] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const filteredTypes = useMemo(() => types.filter(t => t.name.toLowerCase().includes(search.toLowerCase())), [types, search]);
  const paginatedTypes = useMemo(() => {
    const start = (typesPage - 1) * typesPerPage;
    return filteredTypes.slice(start, start + typesPerPage);
  }, [filteredTypes, typesPage, typesPerPage]);

  const currentItems = useMemo(() => {
    if (!selectedType) return [];
    return data[selectedType] || [];
  }, [data, selectedType]);

  const paginatedItems = useMemo(() => {
    const start = (itemsPage - 1) * itemsPerPage;
    return currentItems.slice(start, start + itemsPerPage);
  }, [currentItems, itemsPage, itemsPerPage]);

  const handleAddType = () => {
    const { name, description, icon, color } = typeForm;
    if (!name.trim()) return;
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (types.find(t => t.id === id)) return;
    setTypes(prev => [...prev, { id, name, description, icon, color }]);
    setTypeForm({ name: '', description: '', icon: 'Database', color: 'blue' });
    setIsTypeOpen(false);
  };

  const handleRandomGenerate = async () => {
    setGenerateLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const generator = generators[selectedType] || (() => ['Sample Data 1', 'Sample Data 2', 'Sample Data 3']);
    const newValues = generator();
    const newItems = newValues.map((value, i) => ({ id: Date.now() + i, value }));
    setData(prev => ({ ...prev, [selectedType]: [...(prev[selectedType] || []), ...newItems] }));
    setGenerateLoading(false);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const generator = generators[selectedType] || (() => ['AI Sample 1', 'AI Sample 2']);
    const newValues = generator().slice(0, 2).map(v => `AI: ${v}`);
    const newItems = newValues.map((value, i) => ({ id: Date.now() + i + 1000, value }));
    setData(prev => ({ ...prev, [selectedType]: [...(prev[selectedType] || []), ...newItems] }));
    setAiPrompt('');
    setAiLoading(false);
    setIsAIOpen(false);
  };

  const copyToClipboard = (text, itemId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportData = (typeId) => {
    const type = types.find(t => t.id === typeId);
    const items = data[typeId] || [];
    if (items.length === 0) return;
    let csv = 'Type,Value\n';
    items.forEach(item => { csv += `"${type.name}","${item.value.replace(/"/g, '""')}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.name.toLowerCase().replace(/\s/g, '-')}-testdata.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTypeAction = (actionId, selectedIds) => {
    if (actionId === 'delete') {
      setTypes(prev => prev.filter(t => !selectedIds.includes(t.id)));
      selectedIds.forEach(id => {
        setData(prev => {
          const newData = { ...prev };
          delete newData[id];
          return newData;
        });
      });
      setSelectedTypeIds([]);
    }
  };

  const handleItemAction = (actionId, selectedIds) => {
    if (actionId === 'delete') {
      setData(prev => ({
        ...prev,
        [selectedType]: (prev[selectedType] || []).filter(item => !selectedIds.includes(item.id))
      }));
      setSelectedItemIds([]);
    }
  };

  const toggleTypeSelection = (id) => {
    setSelectedTypeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleItemSelection = (id) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAllTypes = () => {
    if (selectedTypeIds.length === paginatedTypes.length && paginatedTypes.length > 0) {
      setSelectedTypeIds([]);
    } else {
      setSelectedTypeIds(paginatedTypes.map(type => type.id));
    }
  };

  if (selectedType) {
    const type = types.find(t => t.id === selectedType);
    const TypeIcon = ICON_MAP[type?.icon] || Database;
    const iconColorClass = COLOR_MAP[type?.color] || COLOR_MAP.blue;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300">
            <div className="border-b border-gray-200 px-6 py-5">
              {/* HEADER ROW */}
              <div className="flex items-center justify-between">
                {/* Left side: back, icon, title + count */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setSelectedType(null); setSelectedItemIds([]); setItemsPage(1); }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  <div className={`w-12 h-12 rounded-lg ${iconColorClass} flex items-center justify-center`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{type?.name}</h2>
                    <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                      {currentItems.length} {currentItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                {/* Right side: Export, Random Generate, AI Generate */}
                <div className="flex items-center gap-3">
                  {currentItems.length > 0 && (
                    <button
                      onClick={() => exportData(selectedType)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}

                  <button
                    onClick={handleRandomGenerate}
                    disabled={generateLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {generateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Random Generate
                  </button>

                  <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
                    <DialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors">
                        <Sparkles className="w-4 h-4" />
                        AI Generate
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>AI Generate Test Data</DialogTitle>
                        <DialogDescription>Describe what test data you need for {type?.name}.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder={`e.g. "Generate 3 invalid ${type?.name.toLowerCase()} for testing"`}
                        />
                        <DialogFooter>
                          <Button onClick={handleAIGenerate} disabled={aiLoading}>
                            {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Generate with AI
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="px-6 py-4">
              {currentItems.length === 0 ? (
                <div className="text-center py-16">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No test data yet. Use the generate buttons above!</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {/* Select All Row */}
                  <div className="flex items-center gap-4 border-b  py-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length === currentItems.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemIds(currentItems.map((item) => item.id));
                        } else {
                          setSelectedItemIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-600">
                      {selectedItemIds.length === currentItems.length
                        ? "All selected"
                        : selectedItemIds.length > 0
                          ? `${selectedItemIds.length} selected`
                          : "Select all"}
                    </span>
                  </div>

                  {/* Items */}
                  {paginatedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors ${index !== paginatedItems.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1 font-mono text-sm text-gray-700 truncate">
                        {item.value || '<empty>'}
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.value, item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors min-w-[75px]"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {currentItems.length > itemsPerPage && (
              <Pagination
                currentPage={itemsPage}
                totalItems={currentItems.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setItemsPage}
                onItemsPerPageChange={(value) => { setItemsPerPage(value); setItemsPage(1); }}
              />
            )}
          </div>

          <EnhancedBulkActionsBar
            selectedItems={selectedItemIds}
            onClearSelection={() => setSelectedItemIds([])}
            assetType="testData"
            onAction={handleItemAction}
            portalId="test-data-bulk-actions"
          />
        </div>
      </div>
    );

  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-wrap">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  <span className="hidden sm:inline">Test Data Library</span>
                  <span className="sm:hidden">Test Data</span>
                </h1>
                <div className="flex items-center space-x-2 ml-2">
                  <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-normal">
                    {filteredTypes.length} {filteredTypes.length === 1 ? 'type' : 'types'}
                  </span>
                </div>
              </div>
            </div>
            <Dialog open={isTypeOpen} onOpenChange={setIsTypeOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded- hover:bg-teal-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Type
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Test Data Type</DialogTitle>
                  <DialogDescription>Create a custom test data type.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      placeholder="e.g., Custom Type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                      placeholder="Brief description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon</Label>
                      <select
                        id="icon"
                        value={typeForm.icon}
                        onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {Object.keys(ICON_MAP).map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <select
                        id="color"
                        value={typeForm.color}
                        onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {Object.keys(COLOR_MAP).map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddType}>Add Type</Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedTypeIds.length === paginatedTypes.length && paginatedTypes.length > 0}
                onChange={handleSelectAllTypes}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search types..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setTypesPage(1); }}
                  className="pl-10 w-64 h-9"
                />
              </div>

              <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedTypes.map((type) => {
                  const TypeIcon = ICON_MAP[type.icon] || Database;
                  const iconColorClass = COLOR_MAP[type.color] || COLOR_MAP.blue;
                  const isSelected = selectedTypeIds.includes(type.id);
                  const itemCount = (data[type.id] || []).length;

                  return (
                    <div
                      key={type.id}
                      onDoubleClick={() => setSelectedType(type.id)}
                      className={`group relative bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-teal-500 border-teal-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggleTypeSelection(type.id); }}
                        className="absolute top-3 left-3 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      />

                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`w-12 h-12 rounded-lg ${iconColorClass} flex items-center justify-center`}>
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        <div className="w-full">
                          <h3 className="font-medium text-gray-900 text-sm truncate">{type.name}</h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">{type.description}</p>
                          <p className="text-xs text-gray-400 mt-2">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {paginatedTypes.length === 0 && (
                  <div className="col-span-full text-center py-16">
                    <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No types found.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTypes.map((type) => {
                  const TypeIcon = ICON_MAP[type.icon] || Database;
                  const iconColorClass = COLOR_MAP[type.color] || COLOR_MAP.blue;
                  const isSelected = selectedTypeIds.includes(type.id);
                  const itemCount = (data[type.id] || []).length;

                  return (
                    <div
                      key={type.id}
                      onDoubleClick={() => setSelectedType(type.id)}
                      className={`group flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${isSelected ? 'ring-2 ring-teal-500 border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); toggleTypeSelection(type.id); }}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div className={`w-10 h-10 rounded-lg ${iconColorClass} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm">{type.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{type.description}</p>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
                {paginatedTypes.length === 0 && (
                  <div className="text-center py-16">
                    <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No types found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {filteredTypes.length > typesPerPage && (
          <Pagination
            currentPage={typesPage}
            totalItems={filteredTypes.length}
            itemsPerPage={typesPerPage}
            onPageChange={setTypesPage}
            onItemsPerPageChange={(value) => { setTypesPerPage(value); setTypesPage(1); }}
          />
        )}
      </div>

      <EnhancedBulkActionsBar
        selectedItems={selectedTypeIds}
        onClearSelection={() => setSelectedTypeIds([])}
        assetType="testData"
        onAction={handleTypeAction}
        portalId="test-data-types-bulk-actions"
      />
    </div>
  );
};

export default TestData;
