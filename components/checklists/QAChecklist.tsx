import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, canAccessStore, canAccessAM } from '../../roleMapping';
import { AREA_MANAGERS } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';
import LoadingOverlay from '../LoadingOverlay';
import hrMappingData from '../../src/hr_mapping.json';

// Google Sheets endpoint for logging data
const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbytHCowSWXzHY-Ej7NdkCnaObAFpTiSeT2cV1_63_yUUeHJTwMW9-ta_70XcLu--wUxog/exec';

interface SurveyResponse {
  [key: string]: string;
}

interface SurveyMeta {
  qaName: string;
  qaId: string;
  amName: string;
  amId: string;
  storeName: string;
  storeId: string;
}

interface Store {
  name: string;
  id: string;
  region?: string;
}

interface QAChecklistProps {
  userRole: UserRole;
  onStatsUpdate: (stats: { completed: number; total: number; score: number }) => void;
}

const QA_SECTIONS = [
  { 
    id: 'ZeroTolerance', 
    title: 'Zero Tolerance', 
    items: [
      {id: 'ZT_1', q: 'No expired food products in the café, and all food products are marked with clear date tags (MRD).', w: 4},
      {id: 'ZT_2', q: 'The product shall comply with the secondary shelf life for critical products like chicken, paneer, sauces, chilled, frozen, and composite products.', w: 4},
      {id: 'ZT_3', q: 'All food products should be stored according to the appropriate storage conditions (Frozen, Chilled, and Ambient).', w: 4},
      {id: 'ZT_4', q: 'RO/Mineral water TDS must be between 50 to 150 ± 10 ppm that is being used for processing inside the cafe.', w: 4},
      {id: 'ZT_5', q: 'Temperature sensitive food items shall not be transferred to other store in uncontrolled medium', w: 4},
      {id: 'ZT_6', q: 'No live pest activity, including but not limited to rodents, rats, cockroaches, and spiders was seen inside the café.', w: 4}
    ]
  },
  { 
    id: 'Maintenance', 
    title: 'Maintenance', 
    items: [
      {id: 'M_1', q: 'All windows opening to external environment fitted with insect-protective mesh.', w: 2},
      {id: 'M_2', q: 'No wall damage, floor damage, door damage, and false ceiling damage.', w: 2},
      {id: 'M_3', q: 'No unsecured wires from electrical lines or equipment.', w: 2},
      {id: 'M_4', q: 'All lighting above food areas has shatterproof protective covers and is clean.', w: 2},
      {id: 'M_5', q: 'Fire extinguishers are in working condition and not expired.', w: 2},
      {id: 'M_6', q: 'Absence of pest entry points - no damages in walls, tap holes, exhaust holes.', w: 2},
      {id: 'M_7', q: 'Pest control devices working and placed at max height of 6 feet away from food areas.', w: 2},
      {id: 'M_8', q: 'Equipment maintenance file checked and service records available.', w: 2},
      {id: 'M_9', q: 'Plumbing and fixtures maintained in good repair.', w: 2},
      {id: 'M_10', q: 'Freezer, FDU and Chillers are in good working condition.', w: 2},
      {id: 'M_11', q: 'RO water service records available and up to date.', w: 2}
    ]
  },
  { 
    id: 'StoreOperations', 
    title: 'Store Operations', 
    items: [
      {id: 'SO_1', q: 'Action plans for previous audit non-conformities shared and closed in CAPA format', w: 2},
      {id: 'SO_2', q: 'No junk material, wastage, unused items found in store surroundings', w: 2},
      {id: 'SO_3', q: 'Dishwasher and sink area checked for cleanliness, odor, covers, leakage', w: 2},
      {id: 'SO_4', q: 'Glass doors, cupboards, shelves clean and in good condition without damage', w: 2},
      {id: 'SO_5', q: 'Area below shelves and machinery clean and free of food particles/dust', w: 2},
      {id: 'SO_6', q: 'Tables and chairs for customers in good condition and free of dust/stains', w: 2},
      {id: 'SO_7', q: 'Food & packaging material not stored on the floor', w: 2},
      {id: 'SO_8', q: 'Food-contact materials and containers clean and made of non-toxic materials', w: 2},
      {id: 'SO_9', q: 'Segregated materials (knives, cutting boards) colour coded as Veg/Non-veg', w: 2},
      {id: 'SO_10', q: 'Glasses clean and arranged upside down in clean rack', w: 1},
      {id: 'SO_11', q: 'All equipment cleaned per SOP to prevent mould/fungi growth', w: 2},
      {id: 'SO_12', q: 'Chiller/Deep Freezer temperatures maintained as per standard', w: 2},
      {id: 'SO_13', q: 'Merry chef inner body checked for food particles/rust, filters clean', w: 2},
      {id: 'SO_14', q: 'Microwaves, grillers, coffee makers, food warmers operational and clean', w: 2},
      {id: 'SO_15', q: 'Coffee machine and grinder operational, in good condition and clean', w: 2},
      {id: 'SO_16', q: 'All small wares (scoops, knives, spatulas) in good condition and clean', w: 2}
    ]
  },
  { 
    id: 'HygieneCompliance', 
    title: 'Hygiene & Compliance', 
    items: [
      {id: 'HC_1', q: 'Medical records for all staff including housekeeper available in store', w: 2},
      {id: 'HC_2', q: 'Annual medical examination & inoculation of food handlers completed with records', w: 2},
      {id: 'HC_3', q: 'Partner well groomed (cap, t-shirt, apron, name badge, black trouser)', w: 2},
      {id: 'HC_4', q: 'Personal hygiene maintained - haircut, nails, shave, no skin infections', w: 2},
      {id: 'HC_5', q: 'Hand washing procedures followed, sanitizer usage checked', w: 2},
      {id: 'HC_6', q: 'Gloves used during food handling and changed after every use', w: 2}
    ]
  }
];

const QAChecklist: React.FC<QAChecklistProps> = ({ userRole, onStatsUpdate }) => {
  const [responses, setResponses] = useState<SurveyResponse>(() => {
    try { 
      return JSON.parse(localStorage.getItem('qa_resp') || '{}'); 
    } catch (e) { 
      return {}; 
    }
  });

  const [meta, setMeta] = useState<SurveyMeta>(() => {
    let stored = {};
    try { 
      stored = JSON.parse(localStorage.getItem('qa_meta') || '{}'); 
    } catch(e) {}
    
    const urlParams = new URLSearchParams(window.location.search);
    const qaId = urlParams.get('qaId') || urlParams.get('qa_id') || (stored as any).qaId || '';
    const qaName = urlParams.get('qaName') || urlParams.get('qa_name') || (stored as any).qaName || '';
    
    return {
      qaName: qaName,
      qaId: qaId,
      amName: (stored as any).amName || '',
      amId: (stored as any).amId || '',
      storeName: (stored as any).storeName || '',
      storeId: (stored as any).storeId || ''
    };
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allStores, setAllStores] = useState<Store[]>([]);
  
  const [amSearchTerm, setAmSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [showAmDropdown, setShowAmDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedAmIndex, setSelectedAmIndex] = useState(-1);
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(-1);

  // Load stores from hr_mapping.json
  useEffect(() => {
    const loadStores = () => {
      try {
        const storeMap = new Map();
        
        hrMappingData.forEach((item: any) => {
          if (!storeMap.has(item.storeId)) {
            storeMap.set(item.storeId, {
              name: item.locationName,
              id: item.storeId,
              region: item.region
            });
          }
        });
        
        const stores = Array.from(storeMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
        setAllStores(stores);
      } catch (error) {
        console.warn('Could not load stores from mapping data:', error);
        setAllStores([
          { name: 'Defence Colony', id: 'S027' },
          { name: 'Khan Market', id: 'S037' },
          { name: 'UB City', id: 'S007' },
          { name: 'Koramangala 1', id: 'S001' }
        ]);
      }
    };
    
    loadStores();
  }, []);

  // Save responses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('qa_resp', JSON.stringify(responses));
  }, [responses]);

  // Save meta to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('qa_meta', JSON.stringify(meta));
  }, [meta]);

  // Update stats whenever responses change
  useEffect(() => {
    const totalQuestions = QA_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => 
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;
    
    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    
    QA_SECTIONS.forEach(section => {
      section.items.forEach(item => {
        maxScore += item.w;
        const response = responses[`${section.id}_${item.id}`];
        if (response === 'yes') {
          totalScore += item.w;
        }
      });
    });
    
    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    onStatsUpdate({
      completed: answeredQuestions,
      total: totalQuestions,
      score: scorePercentage
    });
  }, [responses, onStatsUpdate]);

  const filteredAreaManagers = useMemo(() => {
    if (!amSearchTerm) return AREA_MANAGERS;
    return AREA_MANAGERS.filter(am => 
      am.name.toLowerCase().includes(amSearchTerm.toLowerCase()) ||
      am.id.toLowerCase().includes(amSearchTerm.toLowerCase())
    );
  }, [amSearchTerm]);

  const filteredStores = useMemo(() => {
    if (!storeSearchTerm) return allStores;
    return allStores.filter(store => 
      store.name.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
      store.id.toLowerCase().includes(storeSearchTerm.toLowerCase())
    );
  }, [storeSearchTerm, allStores]);

  const handleMetaChange = (field: keyof SurveyMeta, value: string) => {
    setMeta(prev => ({ ...prev, [field]: value }));
  };

  const handleResponse = (questionId: string, answer: string) => {
    setResponses(prev => ({ ...prev, [questionId]: answer }));
    hapticFeedback.select();
  };

  const handleTextResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    const totalQuestions = QA_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
    const answeredQuestions = Object.keys(responses).filter(key => 
      responses[key] && responses[key] !== '' && !key.includes('_remarks')
    ).length;
    
    if (answeredQuestions < totalQuestions) {
      alert(`Please answer all questions. You have answered ${answeredQuestions} out of ${totalQuestions} questions.`);
      return;
    }

    const requiredFields = ['qaName', 'qaId', 'amName', 'amId', 'storeName', 'storeId'];
    const missingFields = requiredFields.filter(field => !meta[field as keyof SurveyMeta]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      // Calculate scores
      let totalScore = 0;
      let maxScore = 0;
      
      QA_SECTIONS.forEach(section => {
        section.items.forEach(item => {
          maxScore += item.w;
          const response = responses[`${section.id}_${item.id}`];
          if (response === 'yes') {
            totalScore += item.w;
          }
        });
      });
      
      const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // Detect region and correct store ID
      let detectedRegion = '';
      let correctedStoreId = meta.storeId;
      try {
        if (meta.storeId) {
          let storeMapping = hrMappingData.find((item: any) => item.storeId === meta.storeId);
          
          if (!storeMapping && !isNaN(meta.storeId) && !meta.storeId.startsWith('S')) {
            const sFormattedId = `S${meta.storeId.padStart(3, '0')}`;
            storeMapping = hrMappingData.find((item: any) => item.storeId === sFormattedId);
          }
          
          if (!storeMapping && meta.storeName) {
            storeMapping = hrMappingData.find((item: any) => 
              item.locationName.toLowerCase().includes(meta.storeName.toLowerCase()) ||
              meta.storeName.toLowerCase().includes(item.locationName.toLowerCase())
            );
          }
          
          if (storeMapping) {
            detectedRegion = storeMapping.region || '';
            correctedStoreId = storeMapping.storeId;
          }
        }
      } catch (error) {
        console.warn('Could not load mapping data for region detection:', error);
      }

      // Prepare data for Google Sheets
      const params = {
        submissionTime: new Date().toLocaleString('en-GB', {hour12: false}),
        qaName: meta.qaName || '',
        qaId: meta.qaId || '',
        amName: meta.amName || '',
        amId: meta.amId || '',
        storeName: meta.storeName || '',
        storeID: correctedStoreId,
        region: detectedRegion || 'Unknown',
        totalScore: totalScore,
        maxScore: maxScore,
        scorePercentage: scorePercentage,
        ...responses
      };

      console.log('QA Survey data being sent:', params);

      const response = await fetch(LOG_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString()
      });

      console.log('QA Survey submitted successfully');
      setSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting QA survey:', error);
      alert('Error submitting survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSurvey = () => {
    if (confirm('Are you sure you want to reset the survey? All responses will be lost.')) {
      setResponses({});
      setMeta({
        qaName: '',
        qaId: '',
        amName: '',
        amId: '',
        storeName: '',
        storeId: ''
      });
      setSubmitted(false);
      localStorage.removeItem('qa_resp');
      localStorage.removeItem('qa_meta');
    }
  };

  const autofillForTesting = () => {
    if (confirm('This will fill the form with test data. Continue?')) {
      // Fill metadata
      setMeta({
        qaName: 'Test QA Auditor',
        qaId: 'QA001',
        amName: 'Rajesh Kumar',
        amId: 'AM005',
        storeName: 'Defence Colony',
        storeId: 'S027'
      });

      // Generate realistic test responses
      const testResponses: SurveyResponse = {};
      
      QA_SECTIONS.forEach(section => {
        section.items.forEach((item, index) => {
          // Create realistic distribution: mostly yes, some no, few na
          const rand = Math.random();
          let answer;
          if (rand < 0.75) answer = 'yes';  // 75% yes
          else if (rand < 0.90) answer = 'no';  // 15% no
          else answer = 'na';  // 10% na
          
          testResponses[`${section.id}_${item.id}`] = answer;
        });
        
        // Add some sample remarks
        if (section.id === 'ZeroTolerance') {
          testResponses[`${section.id}_remarks`] = 'All critical food safety standards met. Minor training needed on date tag placement.';
        } else if (section.id === 'Maintenance') {
          testResponses[`${section.id}_remarks`] = 'Equipment in good condition. Pest control devices checked and functioning properly.';
        } else if (section.id === 'StoreOperations') {
          testResponses[`${section.id}_remarks`] = 'Store operations running smoothly. Excellent cleanliness standards maintained.';
        } else if (section.id === 'HygieneCompliance') {
          testResponses[`${section.id}_remarks`] = 'Staff hygiene protocols followed correctly. All medical records up to date.';
        }
      });

      setResponses(testResponses);
      
      // Show success message
      alert('Form autofilled with test data! You can now review and submit.');
    }
  };

  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8">
            <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
              QA Assessment Submitted Successfully!
            </h2>
            <p className="text-green-700 dark:text-green-400 mb-6">
              Thank you for completing the Quality Assurance assessment. Your responses have been recorded.
            </p>
            <button
              onClick={resetSurvey}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Take Another Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {isLoading && <LoadingOverlay />}
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          🔍 Quality Assurance Assessment
        </h1>
        <p className="text-gray-600 dark:text-slate-400">
          Comprehensive quality and safety assessment covering zero tolerance, maintenance, operations, and hygiene standards.
        </p>
      </div>

      {/* Audit Information */}
      <div id="audit-information" className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Assessment Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              QA Auditor Name
            </label>
            <input
              type="text"
              value={meta.qaName}
              onChange={(e) => handleMetaChange('qaName', e.target.value)}
              placeholder="Enter QA Auditor name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              QA Auditor ID
            </label>
            <input
              type="text"
              value={meta.qaId}
              onChange={(e) => handleMetaChange('qaId', e.target.value)}
              placeholder="Enter QA Auditor ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Area Manager
            </label>
            <input
              type="text"
              value={amSearchTerm || (meta.amId ? `${meta.amName} (${meta.amId})` : '')}
              onChange={(e) => {
                setAmSearchTerm(e.target.value);
                setShowAmDropdown(true);
                setSelectedAmIndex(-1);
              }}
              onFocus={() => setShowAmDropdown(true)}
              onBlur={() => setTimeout(() => setShowAmDropdown(false), 200)}
              placeholder="Search Area Manager..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
            
            {showAmDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredAreaManagers.length > 0 ? (
                  filteredAreaManagers.map((am, index) => (
                    <button
                      key={am.id}
                      onClick={() => {
                        handleMetaChange('amId', am.id as string);
                        handleMetaChange('amName', am.name as string);
                        setAmSearchTerm('');
                        setShowAmDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        index === selectedAmIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      {am.name} ({am.id})
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No area managers found</div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Store
            </label>
            <input
              type="text"
              value={storeSearchTerm || (meta.storeId ? `${meta.storeName} (${meta.storeId})` : '')}
              onChange={(e) => {
                setStoreSearchTerm(e.target.value);
                setShowStoreDropdown(true);
                setSelectedStoreIndex(-1);
              }}
              onFocus={() => setShowStoreDropdown(true)}
              onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
              placeholder="Search Store..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            />
            
            {showStoreDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredStores.length > 0 ? (
                  filteredStores.map((store, index) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        handleMetaChange('storeId', store.id);
                        handleMetaChange('storeName', store.name);
                        setStoreSearchTerm('');
                        setShowStoreDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        index === selectedStoreIndex ? 'bg-gray-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      {store.name} ({store.id})
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-slate-400">No stores found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QA Sections */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Quality Assessment
        </h2>
        
        <div className="space-y-8">
          {QA_SECTIONS.map((section, sectionIndex) => (
            <div key={section.id} className="border-l-4 border-orange-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 text-orange-700 dark:text-orange-300">
                {section.title}
              </h3>
              
              <div className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={item.id} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-xs font-medium flex-shrink-0 mt-0.5">
                        {itemIndex + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 leading-relaxed mb-3">
                          {item.q}
                        </p>
                        <div className="flex gap-4">
                          {['yes', 'no', 'na'].map(option => (
                            <label key={option} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`${section.id}_${item.id}`}
                                value={option}
                                checked={responses[`${section.id}_${item.id}`] === option}
                                onChange={(e) => handleResponse(`${section.id}_${item.id}`, e.target.value)}
                                className="w-4 h-4 text-orange-600 border-gray-300 dark:border-slate-600 focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-slate-300 capitalize font-medium">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section Remarks */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Section Remarks
                </label>
                <textarea
                  value={responses[`${section.id}_remarks`] || ''}
                  onChange={(e) => handleTextResponse(`${section.id}_remarks`, e.target.value)}
                  placeholder="Add any remarks for this section (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={resetSurvey}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Reset Assessment
          </button>
          <button
            onClick={autofillForTesting}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            🧪 Autofill Test Data
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
};

export default QAChecklist;