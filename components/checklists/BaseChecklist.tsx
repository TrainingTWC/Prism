import React, { useState, useEffect } from 'react';
import { UserRole } from '../../roleMapping';

export interface ChecklistItem {
  id: string;
  text: string;
  score: number;
  answer: 'yes' | 'no' | 'na' | '';
  notes?: string;
  images?: string[];
}

export interface ChecklistSection {
  id: string;
  category: string;
  objective: string;
  maxScore: number;
  items: ChecklistItem[];
  sectionNotes?: string;
}

export interface ChecklistData {
  storeId: string;
  storeName: string;
  auditorName: string;
  auditorId: string;
  date: string;
  sections: ChecklistSection[];
  overallNotes?: string;
  signature?: string;
}

interface BaseChecklistProps {
  userRole: UserRole;
  checklistType: string;
  title: string;
  sections: ChecklistSection[];
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
}

const BaseChecklist: React.FC<BaseChecklistProps> = ({
  userRole,
  checklistType,
  title,
  sections: initialSections,
  onStatsUpdate
}) => {
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [auditorName, setAuditorName] = useState('');
  const [auditorId, setAuditorId] = useState('');
  const [sections, setSections] = useState<ChecklistSection[]>(initialSections);
  const [overallNotes, setOverallNotes] = useState('');
  const [signature, setSignature] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showImages, setShowImages] = useState<Record<string, boolean>>({});

  const STORES = [
    { id: 'S001', name: 'Koramangala 1' },
    { id: 'S002', name: 'CMH Indiranagar' },
    { id: 'S024', name: 'Deer Park' },
    { id: 'S043', name: 'Kemps Corner' },
    { id: 'S048', name: 'Kalyani Nagar' }
  ];

  // Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`checklist-${checklistType}`);
    if (savedData) {
      try {
        const data: ChecklistData = JSON.parse(savedData);
        setStoreId(data.storeId || '');
        setStoreName(data.storeName || '');
        setAuditorName(data.auditorName || '');
        setAuditorId(data.auditorId || '');
        setSections(data.sections || initialSections);
        setOverallNotes(data.overallNotes || '');
        setSignature(data.signature || '');
      } catch (error) {
        console.error('Error loading saved checklist data:', error);
      }
    }
  }, [checklistType, initialSections]);

  // Save data whenever state changes
  useEffect(() => {
    const data: ChecklistData = {
      storeId,
      storeName,
      auditorName,
      auditorId,
      date: new Date().toISOString(),
      sections,
      overallNotes,
      signature
    };
    localStorage.setItem(`checklist-${checklistType}`, JSON.stringify(data));
  }, [checklistType, storeId, storeName, auditorName, auditorId, sections, overallNotes, signature]);

  // Calculate statistics
  useEffect(() => {
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
    const completedItems = sections.reduce((sum, section) => 
      sum + section.items.filter(item => item.answer !== '').length, 0
    );
    
    const totalPossibleScore = sections.reduce((sum, section) => sum + section.maxScore, 0);
    const actualScore = sections.reduce((sum, section) => {
      const sectionScore = section.items.reduce((itemSum, item) => {
        if (item.answer === 'yes') return itemSum + item.score;
        if (item.answer === 'na') return itemSum + item.score; // N/A scores as full points
        return itemSum;
      }, 0);
      return sum + sectionScore;
    }, 0);
    
    const scorePercentage = totalPossibleScore > 0 ? (actualScore / totalPossibleScore) * 100 : 0;
    
    onStatsUpdate({
      completed: completedItems,
      total: totalItems,
      score: scorePercentage
    });
  }, [sections, onStatsUpdate]);

  const handleStoreChange = (selectedStoreId: string) => {
    setStoreId(selectedStoreId);
    const store = STORES.find(s => s.id === selectedStoreId);
    setStoreName(store ? store.name : '');
  };

  const handleAnswerChange = (sectionId: string, itemId: string, answer: 'yes' | 'no' | 'na') => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, answer } : item
              )
            }
          : section
      )
    );
  };

  const handleNotesChange = (sectionId: string, itemId: string, notes: string) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, notes } : item
              )
            }
          : section
      )
    );
  };

  const handleSectionNotesChange = (sectionId: string, notes: string) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId ? { ...section, sectionNotes: notes } : section
      )
    );
  };

  const handleImageUpload = async (sectionId: string, itemId: string, files: FileList) => {
    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    const imageDataUrls = await Promise.all(imagePromises);

    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId 
                  ? { ...item, images: [...(item.images || []), ...imageDataUrls] }
                  : item
              )
            }
          : section
      )
    );
  };

  const removeImage = (sectionId: string, itemId: string, imageIndex: number) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId 
                  ? { 
                      ...item, 
                      images: item.images?.filter((_, index) => index !== imageIndex) || []
                    }
                  : item
              )
            }
          : section
      )
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getSectionScore = (section: ChecklistSection) => {
    const actualScore = section.items.reduce((sum, item) => {
      if (item.answer === 'yes') return sum + item.score;
      if (item.answer === 'na') return sum + item.score;
      return sum;
    }, 0);
    return section.maxScore > 0 ? (actualScore / section.maxScore) * 100 : 0;
  };

  const getScoreColor = (score: number) => {
    if (score < 70) return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    if (score < 90) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-50 dark:bg-green-900/20';
  };

  const exportPDF = () => {
    // Implementation for PDF export would go here
    // For now, just log the data
    console.log('Exporting PDF for:', { checklistType, sections, storeId, storeName, auditorName });
    alert('PDF export functionality would be implemented here');
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem(`checklist-${checklistType}`);
      setSections(initialSections);
      setStoreId('');
      setStoreName('');
      setAuditorName('');
      setAuditorId('');
      setOverallNotes('');
      setSignature('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          {title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="px-4 py-2 btn-primary-gradient text-white rounded-lg transition-transform duration-150 transform hover:scale-105"
          >
            Export PDF
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Store and Auditor Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Store
          </label>
          <select
            value={storeId}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          >
            <option value="">Select Store</option>
            {STORES.map(store => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Auditor Name
          </label>
          <input
            type="text"
            value={auditorName}
            onChange={(e) => setAuditorName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            placeholder="Enter auditor name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Auditor ID
          </label>
          <input
            type="text"
            value={auditorId}
            onChange={(e) => setAuditorId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            placeholder="Enter auditor ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Date
          </label>
          <input
            type="text"
            value={new Date().toLocaleDateString()}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-400"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const sectionScore = getSectionScore(section);
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <div key={section.id} className="border border-gray-200 dark:border-slate-600 rounded-lg">
              <div 
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {section.category}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {section.objective}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(sectionScore)}`}>
                    {sectionScore.toFixed(1)}%
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-slate-600 p-4 space-y-4">
                  {section.items.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-100 dark:border-slate-600 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-sm text-gray-800 dark:text-slate-200 flex-1 pr-4">
                          {item.text}
                        </p>
                        <div className="flex gap-2">
                          {['yes', 'no', 'na'].map((answer) => (
                            <button
                              key={answer}
                              onClick={() => handleAnswerChange(section.id, item.id, answer as 'yes' | 'no' | 'na')}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                item.answer === answer
                                  ? answer === 'yes'
                                    ? 'bg-green-500 text-white'
                                    : answer === 'no'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-500 text-white'
                                  : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-500'
                              }`}
                            >
                              {answer.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mb-3">
                        <textarea
                          value={item.notes || ''}
                          onChange={(e) => handleNotesChange(section.id, item.id, e.target.value)}
                          placeholder="Add notes or observations..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                          rows={2}
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => e.target.files && handleImageUpload(section.id, item.id, e.target.files)}
                          className="text-sm text-gray-600 dark:text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {item.images && item.images.length > 0 && (
                          <span className="text-sm text-gray-600 dark:text-slate-400">
                            {item.images.length} image(s) uploaded
                          </span>
                        )}
                      </div>

                      {/* Images Display */}
                      {item.images && item.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {item.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image}
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-20 object-cover rounded cursor-pointer"
                                onClick={() => setShowImages({...showImages, [`${item.id}_${index}`]: true})}
                              />
                              <button
                                onClick={() => removeImage(section.id, item.id, index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Section Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Section Notes
                    </label>
                    <textarea
                      value={section.sectionNotes || ''}
                      onChange={(e) => handleSectionNotesChange(section.id, e.target.value)}
                      placeholder="Add overall notes for this section..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Overall Notes
        </label>
        <textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          placeholder="Add overall notes for this checklist..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
          rows={4}
        />
      </div>

      {/* Signature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Auditor Signature
        </label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Digital signature or name"
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
        />
      </div>
    </div>
  );
};

export default BaseChecklist;