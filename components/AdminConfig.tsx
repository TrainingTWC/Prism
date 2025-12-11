import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { CONFIG } from '../contexts/config';
import { Users, ClipboardList, FileJson, Plus, Trash2, Edit2, Save, X, Download } from 'lucide-react';
import { AM_ID_TO_NAME } from '../utils/amNameMapping';

type AdminTab = 'roles' | 'checklists' | 'raw' | 'audit-details' | 'store-health';

const AdminConfig: React.FC = () => {
  const { userRole } = useAuth();
  const { config, loading, save, refresh } = useConfig();
  const [activeTab, setActiveTab] = useState<AdminTab>('checklists');
  const [json, setJson] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<string | null>(null);

  useEffect(() => {
    try {
      setJson(JSON.stringify(config, null, 2));
      console.log('AdminConfig - Config loaded:', config);
      console.log('AdminConfig - Has CHECKLISTS:', !!config?.CHECKLISTS);
      console.log('AdminConfig - CHECKLISTS keys:', Object.keys(config?.CHECKLISTS || {}));
    } catch (e) {
      console.error('AdminConfig - Error loading config:', e);
      setJson('{}');
    }
  }, [config]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'editor') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-slate-400">Editor privileges required</p>
      </div>
    </div>
  );

  const onSave = async () => {
    setSaving(true);
    try {
      const parsed = JSON.parse(json);
      const ok = await save(parsed);
      if (ok) {
        await refresh();
        alert('✅ Configuration saved successfully');
      } else {
        alert('❌ Save failed');
      }
    } catch (e) {
      alert('❌ Invalid JSON format');
    } finally {
      setSaving(false);
    }
  };

  const onExport = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `prism-config-${new Date().toISOString().split('T')[0]}.json`; 
    a.click(); 
    URL.revokeObjectURL(url);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJson(String(ev.target?.result || '{}'));
    };
    reader.readAsText(f);
  };

  const tabs = [
    { id: 'checklists' as AdminTab, label: 'Checklists & Weightage', icon: ClipboardList },
    { id: 'audit-details' as AdminTab, label: 'Audit Details', icon: Edit2 },
    { id: 'roles' as AdminTab, label: 'Role Mapping', icon: Users },
    { id: 'store-health' as AdminTab, label: 'Store Health', icon: Download },
    { id: 'raw' as AdminTab, label: 'Raw JSON Editor', icon: FileJson }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Admin Configuration Center
          </h1>
        </div>
        <p className="text-gray-600 dark:text-slate-400">
          Manage checklists, role mappings, and system configuration. Changes are saved to the server and applied immediately.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'checklists' && (
            <ChecklistsEditor config={config} setJson={setJson} saving={saving} onSave={onSave} />
          )}

          {activeTab === 'audit-details' && (
            <AuditDetailsEditor config={config} setJson={setJson} saving={saving} onSave={onSave} />
          )}

          {activeTab === 'roles' && (
            <RoleMappingEditor config={config} setJson={setJson} saving={saving} onSave={onSave} />
          )}

          {activeTab === 'store-health' && (
            <StoreHealthExport config={config} setJson={setJson} saving={saving} onSave={onSave} />
          )}

          {activeTab === 'raw' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Raw JSON Configuration
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  Advanced editor for direct JSON manipulation. Use with caution.
                </p>
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={onSave} 
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <FileJson className="w-4 h-4" />
                    Export
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Import
                    <input type="file" accept="application/json" onChange={onImport} className="hidden" />
                  </label>
                </div>
              </div>
              <textarea 
                value={json} 
                onChange={(e) => setJson(e.target.value)} 
                rows={24}
                className="w-full font-mono text-sm p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Checklists Editor Component
const ChecklistsEditor: React.FC<{ config: any; setJson: (s: string) => void; saving: boolean; onSave: () => void }> = ({ config, setJson, saving, onSave }) => {
  const [selectedChecklist, setSelectedChecklist] = useState<string>('TRAINING');
  
  // Memoize checklists to prevent unnecessary re-renders
  const checklists = React.useMemo(() => {
    const cls = config?.CHECKLISTS || {};
    console.log('📦 checklists memo recalculating, CHECKLISTS keys:', Object.keys(cls));
    return cls;
  }, [config?.CHECKLISTS]);
  
  const checklistKeys = Object.keys(checklists);

  console.log('ChecklistsEditor - Rendering with config:', config);
  console.log('ChecklistsEditor - CHECKLISTS:', checklists);
  console.log('ChecklistsEditor - Selected checklist:', selectedChecklist);
  console.log('ChecklistsEditor - Checklist keys:', checklistKeys);
  console.log('ChecklistsEditor - TRAINING data:', checklists['TRAINING']);
  console.log('ChecklistsEditor - TRAINING data length:', checklists['TRAINING']?.length);

  // Use local editable state
  const [editableChecklist, setEditableChecklist] = useState<any[]>([]);
  
  // Expand first 3 sections by default
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => {
    return new Set([0, 1, 2]);
  });

  // Initialize editableChecklist when component mounts or config loads
  React.useEffect(() => {
    const currentData = checklists[selectedChecklist];
    if (currentData && Array.isArray(currentData) && currentData.length > 0) {
      console.log('🔄 Initializing editableChecklist from config, length:', currentData.length);
      setEditableChecklist(JSON.parse(JSON.stringify(currentData)));
    } else {
      console.log('⚠️ No data found for', selectedChecklist, 'in checklists');
    }
  }, [checklists, selectedChecklist]);

  // Sync editable state with config when checklist changes
  React.useEffect(() => {
    const currentData = checklists[selectedChecklist] || [];
    console.log('AdminConfig - Loading checklist:', selectedChecklist);
    console.log('AdminConfig - Checklists object:', checklists);
    console.log('AdminConfig - Current data:', currentData);
    console.log('AdminConfig - Data length:', currentData.length);
    if (currentData.length > 0) {
      setEditableChecklist(JSON.parse(JSON.stringify(currentData)));
    }
  }, [selectedChecklist, checklists]);

  // Sync changes back to config
  React.useEffect(() => {
    if (editableChecklist.length > 0 || checklists[selectedChecklist]?.length === 0) {
      const newConfig = {
        ...config,
        CHECKLISTS: {
          ...config.CHECKLISTS,
          [selectedChecklist]: editableChecklist
        }
      };
      setJson(JSON.stringify(newConfig, null, 2));
    }
  }, [editableChecklist]);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const updateChecklist = (updatedSections: any[]) => {
    setEditableChecklist(updatedSections);
  };

  const addSection = () => {
    const newSection = {
      id: `NewSection_${Date.now()}`,
      title: 'New Section',
      items: []
    };
    updateChecklist([...editableChecklist, newSection]);
    setExpandedSections(new Set([...expandedSections, editableChecklist.length]));
  };

  const deleteSection = (sectionIndex: number) => {
    if (confirm('Delete this entire section and all its questions?')) {
      updateChecklist(editableChecklist.filter((_: any, i: number) => i !== sectionIndex));
    }
  };

  const duplicateSection = (sectionIndex: number) => {
    const sectionCopy = JSON.parse(JSON.stringify(editableChecklist[sectionIndex]));
    sectionCopy.id = `${sectionCopy.id}_copy_${Date.now()}`;
    sectionCopy.title = `${sectionCopy.title} (Copy)`;
    updateChecklist([...editableChecklist, sectionCopy]);
  };

  const addItem = (sectionIndex: number) => {
    const newItem = {
      id: `Q_${Date.now()}`,
      q: 'New Question',
      w: 1,
      type: 'radio',
      allowImage: false
    };
    const updated = [...editableChecklist];
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      items: [...(updated[sectionIndex].items || []), newItem]
    };
    updateChecklist(updated);
  };

  const duplicateItem = (sectionIndex: number, itemIndex: number) => {
    const updated = [...editableChecklist];
    const itemCopy = JSON.parse(JSON.stringify(updated[sectionIndex].items[itemIndex]));
    itemCopy.id = `${itemCopy.id}_copy_${Date.now()}`;
    updated[sectionIndex] = {
      ...updated[sectionIndex],
      items: [...updated[sectionIndex].items, itemCopy]
    };
    updateChecklist(updated);
  };

  const deleteItem = (sectionIndex: number, itemIndex: number) => {
    if (confirm('Delete this question?')) {
      const updated = [...editableChecklist];
      updated[sectionIndex] = {
        ...updated[sectionIndex],
        items: updated[sectionIndex].items.filter((_: any, i: number) => i !== itemIndex)
      };
      updateChecklist(updated);
    }
  };

  const moveItem = (sectionIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    const updated = [...editableChecklist];
    const items = [...updated[sectionIndex].items];
    const newIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    [items[itemIndex], items[newIndex]] = [items[newIndex], items[itemIndex]];
    updated[sectionIndex] = { ...updated[sectionIndex], items };
    updateChecklist(updated);
  };

  const updateSection = (sectionIndex: number, field: string, value: any) => {
    const updated = [...editableChecklist];
    updated[sectionIndex] = { ...updated[sectionIndex], [field]: value };
    updateChecklist(updated);
  };

  const updateItem = (sectionIndex: number, itemIndex: number, field: string, value: any) => {
    const updated = [...editableChecklist];
    const items = [...updated[sectionIndex].items];
    items[itemIndex] = { ...items[itemIndex], [field]: value };
    updated[sectionIndex] = { ...updated[sectionIndex], items };
    updateChecklist(updated);
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Edit Checklist: {selectedChecklist}
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Modify questions, sections, response types, weights, and all checklist settings.
          </p>
        </div>
        <button 
          onClick={onSave} 
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-60"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Checklist Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {checklistKeys.map(key => (
            <button
              key={key}
              onClick={() => {
                setSelectedChecklist(key);
                setExpandedSections(new Set([0]));
              }}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
                selectedChecklist === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {key} Checklist
            </button>
          ))}
        </div>
      </div>

      {/* Loading/Empty State */}
      {editableChecklist.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            No Sections Yet
          </h3>
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Start building your {selectedChecklist} checklist by adding the first section.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            DEBUG: editableChecklist.length = {editableChecklist.length}, 
            checklists[{selectedChecklist}] = {JSON.stringify(checklists[selectedChecklist])?.substring(0, 100)}...
          </p>
          <button
            onClick={addSection}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add First Section
          </button>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {editableChecklist.length > 0 && editableChecklist.map((section: any, sectionIndex: number) => {
          const isExpanded = expandedSections.has(sectionIndex);
          return (
            <div key={sectionIndex} className="border-2 border-purple-200 dark:border-purple-900 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 border-b border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                          Section {sectionIndex + 1}
                        </span>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                          {section.title || 'Untitled Section'}
                        </h4>
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          ({section.items?.length || 0} questions)
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">ID: {section.id}</p>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => duplicateSection(sectionIndex)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Duplicate section"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteSection(sectionIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Content (Expanded) */}
              {isExpanded && (
                <div className="p-4">
                  {/* Section Metadata */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Section ID</label>
                      <input
                        type="text"
                        value={section.id || ''}
                        onChange={(e) => updateSection(sectionIndex, 'id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                        placeholder="e.g., TrainingMaterials"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Section Title</label>
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm"
                        placeholder="e.g., Training Materials"
                      />
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm font-bold text-gray-900 dark:text-slate-100">Questions in this Section</h5>
                      <button
                        onClick={() => addItem(sectionIndex)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Question
                      </button>
                    </div>

                    {(section.items || []).map((item: any, itemIndex: number) => (
                      <div key={itemIndex} className="border border-gray-300 dark:border-slate-600 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800 hover:shadow-md transition-shadow">
                        {/* Question Header with Move/Delete */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-200 dark:bg-slate-700 text-xs font-bold rounded">Q{itemIndex + 1}</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400">ID: {item.id}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveItem(sectionIndex, itemIndex, 'up')}
                              disabled={itemIndex === 0}
                              className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                              title="Move up"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveItem(sectionIndex, itemIndex, 'down')}
                              disabled={itemIndex === section.items.length - 1}
                              className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                              title="Move down"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => duplicateItem(sectionIndex, itemIndex)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="Duplicate"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteItem(sectionIndex, itemIndex)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Fields Grid */}
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Question ID</label>
                            <input
                              type="text"
                              value={item.id || ''}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, 'id', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                              placeholder="TM_1"
                            />
                          </div>
                          <div className="col-span-5">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Question Text</label>
                            <textarea
                              value={item.q || ''}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, 'q', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                              rows={2}
                              placeholder="Enter question..."
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Response Type</label>
                            <select
                              value={item.type || 'radio'}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, 'type', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                            >
                              <option value="radio">Yes/No/NA</option>
                              <option value="text">Text Input</option>
                              <option value="rating">Rating (1-5)</option>
                              <option value="dropdown">Dropdown</option>
                            </select>
                          </div>

                          {/* Data Source for Dropdown */}
                          {item.type === 'dropdown' && (
                            <>
                              <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                  Data Source
                                </label>
                                <select
                                  value={item.source || ''}
                                  onChange={(e) => updateItem(sectionIndex, itemIndex, 'source', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                                >
                                  <option value="">Custom Choices</option>
                                  <option value="STORES">Stores List</option>
                                  <option value="AREA_MANAGERS">Area Managers</option>
                                  <option value="HR_PERSONNEL">HR Personnel</option>
                                  <option value="REGIONS">Regions</option>
                                  <option value="EMPLOYEE_LIST">Emp. List</option>
                                </select>
                              </div>
                              {!item.source && (
                                <div className="col-span-4">
                                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    Custom Choices (comma-separated)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.choices?.join(', ') || ''}
                                    onChange={(e) => updateItem(sectionIndex, itemIndex, 'choices', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                                    className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                                    placeholder="Option 1, Option 2, Option 3"
                                  />
                                </div>
                              )}
                            </>
                          )}

                          <div className="col-span-1">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Weight</label>
                            <input
                              type="number"
                              min="0"
                              value={item.w ?? 1}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                updateItem(sectionIndex, itemIndex, 'w', isNaN(val) ? 0 : val);
                              }}
                              className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Neg W</label>
                            <input
                              type="number"
                              value={item.wneg ?? 0}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                updateItem(sectionIndex, itemIndex, 'wneg', isNaN(val) ? 0 : val);
                              }}
                              className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                              <input
                                type="checkbox"
                                checked={item.required || false}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, 'required', e.target.checked)}
                                className="mr-1"
                              />
                              Required
                            </label>
                          </div>
                        </div>

                        {/* Additional Options */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Subsection (optional)</label>
                            <input
                              type="text"
                              value={item.section || ''}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, 'section', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                              placeholder="e.g., Personal Hygiene"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Help Text (optional)</label>
                            <input
                              type="text"
                              value={item.helpText || ''}
                              onChange={(e) => updateItem(sectionIndex, itemIndex, 'helpText', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                              placeholder="Additional guidance..."
                            />
                          </div>
                        </div>

                        {/* Image Upload Options */}
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={item.allowImage || false}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, 'allowImage', e.target.checked)}
                                className="w-4 h-4"
                              />
                              📷 Allow Image Upload
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={item.allowCamera || false}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, 'allowCamera', e.target.checked)}
                                className="w-4 h-4"
                              />
                              📸 Allow Camera Capture
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={item.requireImage || false}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, 'requireImage', e.target.checked)}
                                disabled={!item.allowImage && !item.allowCamera}
                                className="w-4 h-4 disabled:opacity-50"
                              />
                              ✅ Image Required
                            </label>
                          </div>
                          {(item.allowImage || item.allowCamera) && (
                            <div className="mt-2">
                              <label className="block text-xs text-gray-600 dark:text-slate-400 mb-1">Max Images Allowed</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={item.maxImages || 3}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, 'maxImages', parseInt(e.target.value) || 3)}
                                className="w-24 px-2 py-1 border rounded text-xs dark:bg-slate-700 dark:border-slate-600"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {section.items?.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                        <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No questions in this section yet.</p>
                        <button
                          onClick={() => addItem(sectionIndex)}
                          className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          Add your first question →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Section Button */}
        <button
          onClick={addSection}
          className="w-full py-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-purple-600 dark:text-purple-400 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add New Section to {selectedChecklist} Checklist
        </button>
      </div>
    </div>
  );
};

// Audit Details Editor Component
const AuditDetailsEditor: React.FC<{ config: any; setJson: (s: string) => void; saving: boolean; onSave: () => void }> = ({ config, setJson, saving, onSave }) => {
  const [selectedChecklist, setSelectedChecklist] = useState<string>('TRAINING');
  const checklistKeys = ['TRAINING', 'OPERATIONS', 'HR', 'QA', 'FINANCE'];
  
  const [fields, setFields] = useState<any[]>([]);

  React.useEffect(() => {
    const auditDetails = config?.AUDIT_DETAILS || {};
    const currentFields = auditDetails[selectedChecklist] || [];
    console.log('AuditDetailsEditor - Loading fields for:', selectedChecklist);
    console.log('AuditDetailsEditor - AUDIT_DETAILS:', config?.AUDIT_DETAILS);
    console.log('AuditDetailsEditor - Current fields:', currentFields);
    console.log('AuditDetailsEditor - Fields length:', currentFields.length);
    setFields(JSON.parse(JSON.stringify(currentFields)));
  }, [selectedChecklist, config]);

  React.useEffect(() => {
    if (fields.length > 0) {
      const newConfig = {
        ...config,
        AUDIT_DETAILS: {
          ...config.AUDIT_DETAILS,
          [selectedChecklist]: fields
        }
      };
      setJson(JSON.stringify(newConfig, null, 2));
    }
  }, [fields]);

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        id: `CUSTOM_FIELD_${Date.now()}`,
        label: 'New Field',
        type: 'text',
        required: false
      }
    ]);
  };

  const deleteField = (index: number) => {
    if (confirm('Delete this field?')) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFields(updated);
  };

  return (
    <div>
      {/* Checklist Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {checklistKeys.map(key => (
            <button
              key={key}
              onClick={() => setSelectedChecklist(key)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
                selectedChecklist === key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {key} Audit Details
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            {selectedChecklist} Audit Details Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Configure the audit information fields that appear at the start of {selectedChecklist.toLowerCase()} audit forms.
          </p>
        </div>
        <button 
          onClick={onSave} 
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Field ID */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Field ID
                </label>
                <input
                  type="text"
                  value={field.id}
                  onChange={(e) => updateField(index, 'id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Field Label */}
              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(index, 'label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Field Type */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={field.type}
                  onChange={(e) => updateField(index, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="date">Date</option>
                  <option value="time">Time</option>
                  <option value="number">Number</option>
                </select>
              </div>

              {/* Required */}
              <div className="col-span-1 flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, 'required', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">Required</span>
                </label>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-end gap-2">
                <button
                  onClick={() => moveField(index, 'up')}
                  disabled={index === 0}
                  className="p-2 text-gray-600 hover:text-purple-600 disabled:opacity-30"
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveField(index, 'down')}
                  disabled={index === fields.length - 1}
                  className="p-2 text-gray-600 hover:text-purple-600 disabled:opacity-30"
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteField(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                  title="Delete Field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Additional options for dropdown */}
            {field.type === 'dropdown' && (
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Data Source
                  </label>
                  <select
                    value={field.source || ''}
                    onChange={(e) => updateField(index, 'source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Custom Choices</option>
                    <option value="STORES">Stores List</option>
                    <option value="AREA_MANAGERS">Area Managers</option>
                    <option value="HR_PERSONNEL">HR Personnel</option>
                    <option value="REGIONS">Regions</option>
                    <option value="EMPLOYEE_LIST">Emp. List</option>
                  </select>
                </div>
                {!field.source && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Custom Choices (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={field.choices?.join(', ') || ''}
                      onChange={(e) => updateField(index, 'choices', e.target.value.split(',').map((s: string) => s.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Field Button */}
        <button
          onClick={addField}
          className="w-full py-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg text-purple-600 dark:text-purple-400 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add New Audit Field
        </button>
      </div>
    </div>
  );
};

// Role Mapping Editor Component
const RoleMappingEditor: React.FC<{ config: any; setJson: (s: string) => void; saving: boolean; onSave: () => void }> = ({ config, setJson, saving, onSave }) => {
  const [storeMappings, setStoreMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [employeeData, setEmployeeData] = useState<Record<string, string>>({});

  // Load employee data
  React.useEffect(() => {
    fetch('/Prism/employee_data.json')
      .then(res => res.json())
      .then((data: Array<{code: string, name: string}>) => {
        const mapping: Record<string, string> = {};
        data.forEach(emp => {
          // Store both lowercase and uppercase versions for flexible matching
          mapping[emp.code.toUpperCase()] = emp.name;
          mapping[emp.code.toLowerCase()] = emp.name;
        });
        setEmployeeData(mapping);
      })
      .catch(err => console.error('Failed to load employee data:', err));
  }, []);

  const getPersonnelDisplay = (id: string) => {
    if (!id) return '';
    const name = employeeData[id] || employeeData[id.toUpperCase()] || employeeData[id.toLowerCase()];
    return name ? `${id} - ${name}` : id;
  };

  // Load comprehensive_store_mapping.json
  React.useEffect(() => {
    fetch('/Prism/comprehensive_store_mapping.json')
      .then(res => res.json())
      .then(data => {
        setStoreMappings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load store mappings:', err);
        setLoading(false);
      });
  }, []);

  const updateMapping = (index: number, field: string, value: string) => {
    const updated = [...storeMappings];
    updated[index] = { ...updated[index], [field]: value };
    setStoreMappings(updated);
  };

  const saveMapping = (index: number) => {
    setEditingRow(null);
    // Update config with new mappings
    const newConfig = {
      ...config,
      STORE_MAPPINGS: storeMappings
    };
    setJson(JSON.stringify(newConfig, null, 2));
  };

  const deleteMapping = (index: number) => {
    if (confirm('Delete this store mapping?')) {
      const updated = storeMappings.filter((_, i) => i !== index);
      setStoreMappings(updated);
      const newConfig = {
        ...config,
        STORE_MAPPINGS: updated
      };
      setJson(JSON.stringify(newConfig, null, 2));
    }
  };

  const addNewStore = () => {
    const newStore = {
      'Store ID': `S${String(storeMappings.length + 1).padStart(3, '0')}`,
      'Store Name': 'New Store',
      'Region': 'South',
      'Menu': 'REGULAR',
      'Store Type': 'Highstreet',
      'Concept': 'Experience',
      'HRBP': '',
      'Trainer': '',
      'AM': '',
      'E-Learning Specialist': 'H541',
      'Training Head': 'H3237',
      'HR Head': 'H2081'
    };
    setStoreMappings([...storeMappings, newStore]);
    setEditingRow(storeMappings.length);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        alert('Invalid CSV file');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });

      setStoreMappings(data);
      const newConfig = {
        ...config,
        STORE_MAPPINGS: data
      };
      setJson(JSON.stringify(newConfig, null, 2));
      alert(`✅ Loaded ${data.length} store mappings from CSV`);
    };
    reader.readAsText(file);
  };

  const exportToCSV = () => {
    const headers = ['Store ID', 'Store Name', 'Region', 'Menu', 'Store Type', 'Concept', 'HRBP', 'Trainer', 'AM', 'E-Learning Specialist', 'Training Head', 'HR Head'];
    const csvContent = [
      headers.join(','),
      ...storeMappings.map(store => 
        headers.map(h => `"${store[h] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store-mappings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const headers = ['Store ID', 'Store Name', 'Region', 'Menu', 'Store Type', 'Concept', 'HRBP', 'Trainer', 'AM', 'E-Learning Specialist', 'Training Head', 'HR Head'];
    const template = [
      headers.join(','),
      '"S999","Example Store","South","REGULAR","Highstreet","Experience","H1234","H5678","H9012","H541","H3237","H2081"'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'store-mapping-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter stores
  const filteredStores = storeMappings.filter(store => {
    const matchesSearch = searchTerm === '' || 
      store['Store ID']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store['AM']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store['HRBP']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store['Trainer']?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = filterRegion === '' || store['Region'] === filterRegion;
    
    return matchesSearch && matchesRegion;
  });

  const regions = Array.from(new Set(storeMappings.map(s => s['Region']).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Loading store mappings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Store Role Mapping
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Manage store assignments for Area Managers, HRBP, and Trainers. Single source of truth from comprehensive_store_mapping.json
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-sm"
          >
            <FileJson className="w-4 h-4" />
            CSV Template
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors cursor-pointer text-sm">
            <Plus className="w-4 h-4" />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={onSave} 
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-60 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Store ID, Name, AM, HRBP, or Trainer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Regions</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
        <button
          onClick={addNewStore}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Store
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-4 text-sm text-gray-600 dark:text-slate-400">
        <span>Total: <strong className="text-gray-900 dark:text-slate-100">{storeMappings.length}</strong> stores</span>
        <span>Filtered: <strong className="text-gray-900 dark:text-slate-100">{filteredStores.length}</strong> stores</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Store ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Store Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Menu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Store Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Concept</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">HRBP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Trainer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">AM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">E-Learning Specialist</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Training Head</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">HR Head</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredStores.map((store, index) => {
                const originalIndex = storeMappings.indexOf(store);
                const isEditing = editingRow === originalIndex;
                
                return (
                  <tr key={originalIndex} className={`${isEditing ? 'bg-purple-50 dark:bg-purple-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['Store ID']}
                          onChange={(e) => updateMapping(originalIndex, 'Store ID', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                        />
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-slate-100">{store['Store ID']}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['Store Name']}
                          onChange={(e) => updateMapping(originalIndex, 'Store Name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                        />
                      ) : (
                        <span className="text-gray-900 dark:text-slate-100">{store['Store Name']}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <select
                          value={store['Region']}
                          onChange={(e) => updateMapping(originalIndex, 'Region', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                        >
                          <option value="North">North</option>
                          <option value="South">South</option>
                          <option value="West">West</option>
                          <option value="East">East</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {store['Region']}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['Menu']}
                          onChange={(e) => updateMapping(originalIndex, 'Menu', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                        />
                      ) : (
                        store['Menu']
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['Store Type']}
                          onChange={(e) => updateMapping(originalIndex, 'Store Type', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                        />
                      ) : (
                        store['Store Type']
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['Concept']}
                          onChange={(e) => updateMapping(originalIndex, 'Concept', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                        />
                      ) : (
                        store['Concept']
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['HRBP']}
                          onChange={(e) => updateMapping(originalIndex, 'HRBP', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                          placeholder="H1234"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">{store['HRBP']}</span>
                          {(employeeData[store['HRBP']] || employeeData[store['HRBP']?.toUpperCase()] || employeeData[store['HRBP']?.toLowerCase()]) && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              {employeeData[store['HRBP']] || employeeData[store['HRBP']?.toUpperCase()] || employeeData[store['HRBP']?.toLowerCase()]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['Trainer']}
                          onChange={(e) => updateMapping(originalIndex, 'Trainer', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                          placeholder="H1234"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-mono text-green-600 dark:text-green-400 font-semibold">{store['Trainer']}</span>
                          {(employeeData[store['Trainer']] || employeeData[store['Trainer']?.toUpperCase()] || employeeData[store['Trainer']?.toLowerCase()]) && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              {employeeData[store['Trainer']] || employeeData[store['Trainer']?.toUpperCase()] || employeeData[store['Trainer']?.toLowerCase()]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['AM']}
                          onChange={(e) => updateMapping(originalIndex, 'AM', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                          placeholder="H1234"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{store['AM']}</span>
                          {(employeeData[store['AM']] || employeeData[store['AM']?.toUpperCase()] || employeeData[store['AM']?.toLowerCase()]) && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              {employeeData[store['AM']] || employeeData[store['AM']?.toUpperCase()] || employeeData[store['AM']?.toLowerCase()]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['E-Learning Specialist']}
                          onChange={(e) => updateMapping(originalIndex, 'E-Learning Specialist', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                          placeholder="H1234"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">{store['E-Learning Specialist']}</span>
                          {(employeeData[store['E-Learning Specialist']] || employeeData[store['E-Learning Specialist']?.toUpperCase()] || employeeData[store['E-Learning Specialist']?.toLowerCase()]) && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              {employeeData[store['E-Learning Specialist']] || employeeData[store['E-Learning Specialist']?.toUpperCase()] || employeeData[store['E-Learning Specialist']?.toLowerCase()]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['Training Head']}
                          onChange={(e) => updateMapping(originalIndex, 'Training Head', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                          placeholder="H1234"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{store['Training Head']}</span>
                          {(employeeData[store['Training Head']] || employeeData[store['Training Head']?.toUpperCase()] || employeeData[store['Training Head']?.toLowerCase()]) && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              {employeeData[store['Training Head']] || employeeData[store['Training Head']?.toUpperCase()] || employeeData[store['Training Head']?.toLowerCase()]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {isEditing ? (
                        <input
                          type="text"
                          value={store['HR Head']}
                          onChange={(e) => updateMapping(originalIndex, 'HR Head', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm"
                          placeholder="H1234"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-mono text-pink-600 dark:text-pink-400 font-semibold">{store['HR Head']}</span>
                          {(employeeData[store['HR Head']] || employeeData[store['HR Head']?.toUpperCase()] || employeeData[store['HR Head']?.toLowerCase()]) && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              {employeeData[store['HR Head']] || employeeData[store['HR Head']?.toUpperCase()] || employeeData[store['HR Head']?.toLowerCase()]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveMapping(originalIndex)}
                              className="p-1 text-green-600 hover:text-green-700 dark:text-green-400"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingRow(null)}
                              className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingRow(originalIndex)}
                              className="p-1 text-purple-600 hover:text-purple-700 dark:text-purple-400"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMapping(originalIndex)}
                              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400">
          No stores found matching your filters.
        </div>
      )}
    </div>
  );
};

// Store Health Export Component
const StoreHealthExport: React.FC<{ config: any; setJson: (s: string) => void; saving: boolean; onSave: () => void }> = ({ config }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [downloadFormat, setDownloadFormat] = useState('xlsx');
  const [auditData, setAuditData] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);

  // Fetch monthly trends data from Google Sheets
  const fetchMonthlyTrends = async () => {
    try {
      const url = 'https://script.google.com/macros/s/AKfycbytDw7gOZXNJdJ-oS_G347Xj9NiUxBRmPfmwRZgQ3SbKqZ2OQ2D0j5nNm91vxMOrlwRQg/exec';
      console.log('📡 Fetching Monthly_Trends data...');
      const response = await fetch(url);
      const data = await response.json();
      const rows = data.rows || [];
      
      // Process and normalize the data
      const processed = rows.map((row: any) => {
        let period = row.observed_period;
        
        // Convert date strings to YYYY-MM format
        if (typeof period === 'string' && period.includes('/')) {
          const match = period.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            const month = match[1].padStart(2, '0');
            const year = match[3];
            period = `${year}-${month}`;
          }
        }
        
        return { ...row, observed_period: period };
      });
      
      console.log('✅ Fetched monthly trends:', processed.length, 'entries');
      return processed;
    } catch (error) {
      console.error('❌ Error fetching monthly trends:', error);
      return [];
    }
  };

  // Fetch comprehensive store mapping and audit data
  useEffect(() => {
    const fetchAllData = async () => {
      console.log('🔄 StoreHealthExport: Starting data fetch for month:', selectedMonth);
      setLoading(true);
      try {
        // Helper function to normalize store IDs for comparison
        const normalizeStoreId = (id: string): string => {
          if (!id) return '';
          const idStr = id.toString().toUpperCase();
          // Remove 'S' prefix if exists and pad to 3 digits
          const numericPart = idStr.replace(/^S/, '');
          return numericPart.padStart(3, '0');
        };

        // Load comprehensive store mapping
        console.log('📡 Loading comprehensive store mapping...');
        const base = (import.meta as any).env?.BASE_URL || '/';
        const mappingResponse = await fetch(`${base}comprehensive_store_mapping.json`);
        const storeMapping = await mappingResponse.json();
        console.log('✅ Loaded store mapping:', storeMapping.length, 'stores');
        setAllStores(storeMapping);

        // Fetch monthly trends data instead of raw training data
        console.log('📡 StoreHealthExport: Calling fetchMonthlyTrends()...');
        const trendsData = await fetchMonthlyTrends();
        
        console.log('✅ StoreHealthExport: Monthly trends data received:', {
          totalEntries: trendsData.length
        });
        
        // Build a map of latest audits by store for the selected month
        // Use normalized store IDs as keys
        const latestAuditsByStore = new Map();
        
        trendsData.forEach((entry: any) => {
          const storeId = entry.store_id;
          if (!storeId) return;
          
          const normalizedId = normalizeStoreId(storeId);
          const entryMonth = entry.observed_period;
          
          // Only use data for the selected month exactly
          if (entryMonth === selectedMonth) {
            console.log('🔍 Processing monthly trend entry:', {
              originalStoreId: storeId,
              normalizedStoreId: normalizedId,
              percentage: entry.percentage_score,
              month: entryMonth
            });
            
            latestAuditsByStore.set(normalizedId, {
              percent: entry.percentage_score,
              auditMonth: entryMonth
            });
          }
        });

        console.log('📋 Audit map contains', latestAuditsByStore.size, 'unique stores for month:', selectedMonth);

        // Merge store mapping with audit data
        const mergedData = storeMapping.map((store: any) => {
          const normalizedStoreId = normalizeStoreId(store['Store ID']);
          const audit = latestAuditsByStore.get(normalizedStoreId);
          const amId = store.AM;
          const amName = AM_ID_TO_NAME[amId] || amId;
          
          return {
            storeID: store['Store ID'],
            storeName: store['Store Name'],
            region: store['Region'],
            amName: amName,
            trainerName: store['Trainer'] || 'N/A',
            percent: audit ? audit.percent : null,
            auditMonth: audit ? audit.auditMonth : 'No Audit'
          };
        });
        
        console.log('📊 StoreHealthExport: Merged data complete', {
          totalStores: mergedData.length,
          storesWithAudits: mergedData.filter(s => s.percent !== null).length,
          storesWithoutAudits: mergedData.filter(s => s.percent === null).length
        });
        
        setAuditData(mergedData);
      } catch (error) {
        console.error('❌ StoreHealthExport: Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchAllData();
  }, [selectedMonth]);

  const downloadStoreHealth = () => {
    setLoading(true);
    
    // Prepare data
    const headers = ['Store ID', 'Store Name', 'Region', 'AM', 'Trainer', 'Audit Percentage', 'Health', 'Last Audit Date'];
    
    // Map audit data to required format
    const rows = auditData.map((store: any) => {
      const auditScore = store.percent !== null ? parseFloat(store.percent) : null;
      // Store health logic from Training Audit Dashboard
      let health = 'No Audit';
      if (auditScore !== null) {
        health = auditScore < 56 ? 'Needs Attention' : 
                 auditScore < 81 ? 'Brewing' : 'Perfect Shot';
      }

      // Format last audit date (show month-year or 'No Audit')
      let lastAuditDate = 'No Audit';
      if (store.auditMonth && store.auditMonth !== 'No Audit') {
        const [year, month] = store.auditMonth.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        lastAuditDate = `${monthNames[parseInt(month) - 1]} ${year}`;
      }

      return [
        store.storeID,
        store.storeName,
        store.region,
        store.amName,
        store.trainerName,
        auditScore !== null ? auditScore.toFixed(1) : 'N/A',
        health,
        lastAuditDate
      ];
    });

    if (downloadFormat === 'xlsx') {
      // Excel format with proper formatting
      import('xlsx').then((XLSX) => {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        
        // Set column widths
        ws['!cols'] = [
          { wch: 12 },  // Store ID
          { wch: 25 },  // Store Name
          { wch: 10 },  // Region
          { wch: 15 },  // AM
          { wch: 15 },  // Trainer
          { wch: 15 },  // Audit Percentage
          { wch: 18 },  // Health
          { wch: 18 }   // Last Audit Date
        ];
        
        // Create workbook and add worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Store Health');
        
        // Generate file
        XLSX.writeFile(wb, `Store_Health_${selectedMonth}.xlsx`);
        setLoading(false);
      }).catch(err => {
        console.error('Error loading xlsx library:', err);
        // Fallback to CSV if xlsx fails to load
        downloadAsCSV(headers, rows);
      });
    } else {
      // CSV format
      downloadAsCSV(headers, rows);
    }
  };

  const downloadAsCSV = (headers: string[], rows: any[][]) => {
    // Function to escape CSV cells
    const escapeCsvCell = (cell: any) => {
      const str = String(cell || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(h => escapeCsvCell(h)).join(','),
      ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(','))
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const csvWithBOM = '\uFEFF' + csvContent;
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Store_Health_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Store Health Report
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Download store health data for analysis and reporting. Select a month and preferred format below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Month Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Select Month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {auditData.length} total stores ({auditData.filter(s => s.percent !== null).length} with audits)
          </p>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Download Format
          </label>
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Includes all stores with latest audit scores
          </p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Store ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Store Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Region</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">AM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Trainer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Audit %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Health</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Last Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {loading ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-slate-400">Loading store health data...</p>
              </td>
            </tr>
          ) : auditData.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                No store data available.
              </td>
            </tr>
          ) : (
            auditData.slice(0, 10).map((store: any) => {
              const auditScore = store.percent !== null ? parseFloat(store.percent) : null;
              // Store health logic from Training Audit Dashboard
              let health = 'No Audit';
              let healthColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
              
              if (auditScore !== null) {
                health = auditScore < 56 ? 'Needs Attention' : 
                         auditScore < 81 ? 'Brewing' : 'Perfect Shot';
                healthColor = health === 'Perfect Shot' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                             health === 'Brewing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                             'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
              }

              // Format last audit date
              let lastAuditDate = 'No Audit';
              if (store.auditMonth && store.auditMonth !== 'No Audit') {
                const [year, month] = store.auditMonth.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                lastAuditDate = `${monthNames[parseInt(month) - 1]} ${year}`;
              }
              
              return (
                <tr key={store.storeID} className="text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium">{store.storeID}</td>
                  <td className="px-4 py-3">{store.storeName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {store.region}
                    </span>
                  </td>
                  <td className="px-4 py-3">{store.amName}</td>
                  <td className="px-4 py-3">{store.trainerName}</td>
                  <td className="px-4 py-3 font-medium">{auditScore !== null ? auditScore.toFixed(1) + '%' : 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${healthColor}`}>
                      {health}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{lastAuditDate}</td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
        {auditData.length > 10 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700">
            Showing 10 of {auditData.length} stores ({auditData.filter(s => s.percent !== null).length} with audits, {auditData.filter(s => s.percent === null).length} without audits). Download the report to see all data.
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="flex justify-end">
        <button
          onClick={downloadStoreHealth}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-60"
        >
          <Download className="w-5 h-5" />
          {loading ? 'Preparing Download...' : 'Download Store Health Data'}
        </button>
      </div>
    </div>
  );
};

export default AdminConfig;
