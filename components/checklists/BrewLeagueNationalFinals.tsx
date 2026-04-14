import React, { useState, useEffect } from 'react';
import { Download, RotateCcw, Clock, Camera, Trophy, Coffee, Star } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingOverlay from '../LoadingOverlay';
import { useEmployeeDirectory } from '../../hooks/useEmployeeDirectory';
import { useComprehensiveMapping } from '../../hooks/useComprehensiveMapping';

// Define section structure
interface ChecklistItem {
  id: string;
  q: string;
  w: number;
  hasComment?: boolean; // Some items require a comment instead of Yes/No
  commentLabel?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

// National Finals - Semi Automatic Sensory Sheet
const SENSORY_SECTIONS: ChecklistSection[] = [
  {
    id: 'BaristaIntroduction',
    title: 'Barista Introduction',
    items: [
      { id: 'IntroConfident', q: 'Barista Introduction – Did the barista introduce themselves clearly and confidently?', w: 3 },
      { id: 'IntroCoffee', q: 'Introduction to Coffee – Did the barista provide a clear and engaging introduction about the coffee being used?', w: 10 },
    ]
  },
  {
    id: 'Espresso',
    title: 'Espresso',
    items: [
      { id: 'ExplainRecipe', q: 'Did the barista clearly explain the espresso recipe (dose, yield, and extraction time)?', w: 5 },
      { id: 'Acidity', q: 'Acidity', w: 5 },
      { id: 'Body', q: 'Body', w: 5 },
      { id: 'Sweetness', q: 'Sweetness', w: 5 },
      { id: 'Flavours', q: 'Flavours', w: 5 },
      { id: 'OverallEspresso', q: 'Overall personal evaluation of the espresso experience.', w: 5, hasComment: true, commentLabel: 'Comment' },
    ]
  },
  {
    id: 'MilkBased',
    title: 'Milk Based',
    items: [
      { id: 'LatteArtStd', q: 'Was the Latte art created as per TWC std (Cappuccino- Heart, Latte- Tulip/Rosetta, Flat white - Single dot)', w: 5 },
      { id: 'ShinyGlossy', q: 'Was it shiny and glossy?', w: 5 },
      { id: 'NoBubbles', q: 'No visible bubbles on the surface', w: 5 },
      { id: 'ArtCentre', q: 'Is the latte art in the centre of the cup', w: 5 },
      { id: 'ContrastCrema', q: 'Is there a visible contrast between the crema and the latte art', w: 5 },
      { id: 'ArtFacing', q: 'Is the latte art facing the customer with the handle on the right side', w: 5 },
      { id: 'Cover70', q: 'Did the latte art cover 70% of the cup surface', w: 5 },
      { id: 'FrothLevel', q: 'Was the froth level present as per TWC standard (Three Swipes- cappuccino, Two Swipes- Latte & One swipe- Flatwhite)', w: 5 },
      { id: 'FrothRatio', q: 'Is the froth level was as per TWC standard (70/30 in cappuccino, 90/10 in latte and micro foam in flat white)', w: 5 },
    ]
  },
  {
    id: 'Signature',
    title: 'Signature',
    items: [
      { id: 'ExplainIngredients', q: 'Did the barista clearly explain the ingredients used in the beverage?', w: 5, hasComment: true, commentLabel: 'Comment of ingredients been used' },
      { id: 'PrepProcess', q: 'Was the preparation process explained clearly and executed properly?', w: 5 },
      { id: 'CreativeConcept', q: 'Is the concept of the beverage creative and well thought out?', w: 5 },
      { id: 'Synergy', q: 'Synergy (Coffee Forward) – Do the ingredients complement the coffee and maintain a coffee-forward profile?', w: 5 },
      { id: 'CafeFeasibility', q: 'Cafe Feasibility – Is the beverage practical and feasible to serve in a café environment?', w: 5 },
      { id: 'Balance', q: 'Balance – Are all flavours balanced without overpowering the coffee?', w: 5 },
      { id: 'OverallSignature', q: 'Overall Experience (Personal) – Overall personal impression of the signature beverage.', w: 5, hasComment: true, commentLabel: 'Comment' },
    ]
  },
  {
    id: 'Overall',
    title: 'Overall',
    items: [
      { id: 'AttentionDetail', q: 'Attention to detail', w: 5 },
      { id: 'Accessories', q: 'All Accessories available', w: 5 },
      { id: 'Presentation', q: 'Presentation', w: 10 },
      { id: 'CoffeeKnowledge', q: 'Coffee Knowledge', w: 10 },
      { id: 'EquipmentSpace', q: 'Use of Equipments / Space', w: 5 },
      { id: 'OverallPerformance', q: 'Overall Experience of performance', w: 10 },
    ]
  }
];

const LOG_ENDPOINTS = [
  import.meta.env.VITE_NATIONAL_FINALS_SCRIPT_URL || ''
].filter(Boolean);

const BrewLeagueNationalFinals: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const [judgeName, setJudgeName] = useState(() => localStorage.getItem('brewLeagueNFJudgeName') || urlParams.get('judgeName') || urlParams.get('name') || '');
  const judgeId = urlParams.get('judgeId') || urlParams.get('EMPID') || '';

  // Employee directory for searchable dropdown
  const { directory: employeeDirectory, loading: employeeLoading } = useEmployeeDirectory();
  const { mapping: comprehensiveMapping, loading: mappingLoading } = useComprehensiveMapping();
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [resp, setResp] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('brewLeagueNFResp');
    return saved ? JSON.parse(saved) : {};
  });

  const [participantName, setParticipantName] = useState(() => localStorage.getItem('brewLeagueNFParticipantName') || '');
  const [participantEmpID, setParticipantEmpID] = useState(() => localStorage.getItem('brewLeagueNFParticipantEmpID') || '');
  const [storeName, setStoreName] = useState(() => localStorage.getItem('brewLeagueNFStoreName') || '');
  const [storeID, setStoreID] = useState(() => localStorage.getItem('brewLeagueNFStoreID') || '');
  const [region, setRegion] = useState(() => localStorage.getItem('brewLeagueNFRegion') || '');
  const [imgs, setImgs] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('brewLeagueNFImgs');
    return saved ? JSON.parse(saved) : {};
  });
  const [remarks, setRemarks] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('brewLeagueNFRemarks');
    return saved ? JSON.parse(saved) : {};
  });
  const [comments, setComments] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('brewLeagueNFComments');
    return saved ? JSON.parse(saved) : {};
  });
  const [downloading, setDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('brewLeagueNFResp', JSON.stringify(resp));
    localStorage.setItem('brewLeagueNFParticipantName', participantName);
    localStorage.setItem('brewLeagueNFParticipantEmpID', participantEmpID);
    localStorage.setItem('brewLeagueNFStoreName', storeName);
    localStorage.setItem('brewLeagueNFStoreID', storeID);
    localStorage.setItem('brewLeagueNFRegion', region);
    localStorage.setItem('brewLeagueNFImgs', JSON.stringify(imgs));
    localStorage.setItem('brewLeagueNFRemarks', JSON.stringify(remarks));
    localStorage.setItem('brewLeagueNFComments', JSON.stringify(comments));
    localStorage.setItem('brewLeagueNFJudgeName', judgeName);
  }, [resp, participantName, participantEmpID, storeName, storeID, imgs, remarks, comments, judgeName]);

  // Autofill store details when participant is selected
  useEffect(() => {
    if (!participantEmpID || employeeLoading || mappingLoading) return;

    const normalizedEmpId = participantEmpID.toString().trim().toUpperCase();
    const employee = employeeDirectory.byId[normalizedEmpId];

    if (employee) {
      if (!participantName || participantName === '') {
        setParticipantName(employee.empname || '');
      }

      const employeeStoreCode = employee.store_code || employee.location;

      if (employeeStoreCode && comprehensiveMapping.length > 0) {
        const normalizedStoreCode = employeeStoreCode.toString().trim().toUpperCase();
        const storeData = comprehensiveMapping.find((s: any) =>
          s['Store ID']?.toString().trim().toUpperCase() === normalizedStoreCode ||
          s['Store Name']?.toLowerCase().includes(employeeStoreCode.toLowerCase())
        );

        if (storeData) {
          if (!storeName || storeName === '') {
            setStoreName(storeData['Store Name'] || '');
          }
          if (!storeID || storeID === '') {
            setStoreID(storeData['Store ID'] || '');
          }
          if (!region || region === '') {
            setRegion(storeData['Region'] || '');
          }
        }
      }
    }
  }, [participantEmpID, employeeDirectory, comprehensiveMapping, employeeLoading, mappingLoading]);

  const handleOption = (sec: ChecklistSection, it: ChecklistItem, val: string) => {
    const key = `${sec.id}_${it.id}`;
    setResp(p => ({ ...p, [key]: val }));
  };

  const handleScore = (sec: ChecklistSection, it: ChecklistItem, val: string) => {
    const key = `${sec.id}_${it.id}`;
    const numVal = parseInt(val);
    if (!isNaN(numVal) && numVal >= 0 && numVal <= it.w) {
      setResp(p => ({ ...p, [key]: val }));
    } else if (val === '') {
      setResp(p => ({ ...p, [key]: '' }));
    }
  };

  const handleComment = (key: string, val: string) => {
    setComments(p => ({ ...p, [key]: val }));
  };

  const addImages = (sec: ChecklistSection, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImgs(p => ({ ...p, [sec.id]: [...(p[sec.id] || []), ev.target!.result as string] }));
        }
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const handleCaptureTime = (key: string) => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setResp(prev => ({ ...prev, [key]: currentTime }));
  };

  const getTimeDiff = (start: string, end: string) => {
    if (!start || !end) return '-';
    const [sh, sm, ss] = start.split(':').map(Number);
    const [eh, em, es] = end.split(':').map(Number);
    if ([sh, sm, ss, eh, em, es].some(isNaN)) return '-';
    let startSec = sh * 3600 + sm * 60 + ss;
    let endSec = eh * 3600 + em * 60 + es;
    let diff = endSec - startSec;
    if (diff < 0) diff += 24 * 3600;
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${min}m ${sec}s`;
  };

  const computeScores = () => {
    let total = 0, max = 0;
    const sectionScores: Record<string, number> = {};
    const sectionMax: Record<string, number> = {};

    SENSORY_SECTIONS.forEach(sec => {
      let secTotal = 0, secMax = 0;
      sec.items.forEach(it => {
        const key = `${sec.id}_${it.id}`;
        const r = resp[key];
        if (r === 'yes') {
          secTotal += it.w;
          secMax += it.w;
        } else if (r === 'na') {
          // NA - don't count toward max
        } else if (r !== undefined && r !== '' && !isNaN(Number(r))) {
          // Numeric score
          secTotal += Number(r);
          secMax += it.w;
        } else {
          // No or unanswered
          secMax += it.w;
        }
      });
      sectionScores[sec.id] = secTotal;
      sectionMax[sec.id] = secMax;
      total += secTotal;
      max += secMax;
    });

    return { total, max, sectionScores, sectionMax, pct: max ? Math.round((total / max) * 100) : 0 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setIsLoading(true);

    const { total, max, sectionScores, sectionMax, pct } = computeScores();
    const completion = new Date().toLocaleString('en-GB', { hour12: false });
    const startTime = resp['startTime'] || '';
    const endTime = resp['endTime'] || '';
    const timeTaken = getTimeDiff(startTime, endTime);

    // Log to Google Sheets
    if (LOG_ENDPOINTS.length > 0) {
      const data = new URLSearchParams({
        participantName,
        participantEmpID,
        judgeName,
        judgeId,
        storeName,
        storeID,
        region,
        totalScore: total.toString(),
        maxScore: max.toString(),
        percent: pct.toString(),
        // Section scores
        BaristaIntroductionScore: (sectionScores.BaristaIntroduction || 0).toString(),
        BaristaIntroductionMax: (sectionMax.BaristaIntroduction || 0).toString(),
        EspressoScore: (sectionScores.Espresso || 0).toString(),
        EspressoMax: (sectionMax.Espresso || 0).toString(),
        MilkBasedScore: (sectionScores.MilkBased || 0).toString(),
        MilkBasedMax: (sectionMax.MilkBased || 0).toString(),
        SignatureScore: (sectionScores.Signature || 0).toString(),
        SignatureMax: (sectionMax.Signature || 0).toString(),
        OverallScore: (sectionScores.Overall || 0).toString(),
        OverallMax: (sectionMax.Overall || 0).toString(),
        startTime,
        endTime,
        timeTaken,
        submissionTime: completion,
        allResponses: JSON.stringify(resp),
        sectionRemarks: JSON.stringify(remarks),
        comments: JSON.stringify(comments),
        images: JSON.stringify(Object.keys(imgs).reduce((acc, key) => {
          acc[key] = imgs[key].length;
          return acc;
        }, {} as Record<string, number>))
      });

      try {
        await Promise.all(LOG_ENDPOINTS.map(url => fetch(url, { method: 'POST', body: data })));
      } catch (error) {
        console.error('Error logging to sheets:', error);
      }
    }

    // Generate PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('National Finals - Sensory Sheet', 105, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Semi Automatic', 105, 22, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Participant Name: ${participantName}`, 10, 32);
    doc.text(`Participant Emp. ID: ${participantEmpID}`, 10, 37);
    doc.text(`Judge Name: ${judgeName}`, 10, 42);
    doc.text(`Judge ID: ${judgeId}`, 10, 47);
    doc.text(`Store Name: ${storeName}`, 10, 52);
    doc.text(`Store ID: ${storeID}`, 10, 57);
    doc.text(`Region: ${region}`, 10, 62);
    doc.text(`Date/Time: ${completion}`, 10, 67);

    let y = 75;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Time taken: ${timeTaken}`, 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(15);
    doc.text(`Score: ${total} / ${max} (${pct}%)`, 105, y, { align: 'center' });
    y += 10;

    // Sections
    for (const sec of SENSORY_SECTIONS) {
      doc.setDrawColor('#bdbdbd');
      doc.setLineWidth(0.7);
      doc.line(15, y, 195, y);
      y += 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${sec.title} (Score: ${sectionScores[sec.id]} / ${sectionMax[sec.id]})`, 105, y + 8, { align: 'center' });

      autoTable(doc, {
        startY: y + 12,
        head: [['Question', 'Points', 'Response', 'Score']],
        body: sec.items.map(it => {
          const key = `${sec.id}_${it.id}`;
          const r = resp[key];
          let respText = '';
          let score: number | string = 0;
          if (r === 'yes') {
            respText = 'Yes';
            score = it.w;
          } else if (r === 'no') {
            respText = 'No';
            score = 0;
          } else if (r === 'na') {
            respText = 'NA';
            score = 'NA';
          } else if (r !== undefined && r !== '' && !isNaN(Number(r))) {
            respText = r;
            score = Number(r);
          }
          const commentKey = `${sec.id}_${it.id}`;
          const comment = comments[commentKey];
          if (comment) respText += ` (${comment})`;
          return [it.q, it.w.toString(), respText, score === 'NA' ? `NA/${it.w}` : `${score}/${it.w}`];
        }),
        margin: { left: 18, right: 18 },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [219, 234, 254], textColor: [35, 39, 47], fontStyle: 'bold' },
        theme: 'grid'
      });

      y = (doc as any).lastAutoTable.finalY + 4;

      if (remarks[sec.id] && remarks[sec.id].trim()) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        const splitRemarks = doc.splitTextToSize('Remarks: ' + remarks[sec.id], 170);
        doc.text(splitRemarks, 18, y);
        y += splitRemarks.length * 6 + 2;
      }

      y += 8;
      if (y > 200) {
        doc.addPage();
        y = 20;
      }
    }

    // Images
    const allImgKeys = Object.keys(imgs).filter(k => imgs[k] && imgs[k].length > 0);
    if (allImgKeys.length > 0) {
      doc.addPage();
      let imgY = 20;
      for (const secId of allImgKeys) {
        const sectionImgs = imgs[secId];
        const secTitle = SENSORY_SECTIONS.find(s => s.id === secId)?.title || secId;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`${secTitle} Images`, 15, imgY);
        let x = 15;
        let rowY = imgY + 5;
        const imgW = 35, imgH = 35;
        sectionImgs.forEach((src, i) => {
          if (i && i % 4 === 0) { rowY += imgH + 8; x = 15; }
          doc.addImage(src, 'JPEG', x, rowY, imgW, imgH);
          x += imgW + 5;
        });
        imgY = rowY + imgH + 15;
        if (imgY > 250) {
          doc.addPage();
          imgY = 20;
        }
      }
    }

    doc.save(`national_finals_sensory_${participantName}_${Date.now()}.pdf`);
    setDownloading(false);
    setIsLoading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to reset the scoresheet? All responses will be lost.')) {
      localStorage.removeItem('brewLeagueNFResp');
      localStorage.removeItem('brewLeagueNFParticipantName');
      localStorage.removeItem('brewLeagueNFParticipantEmpID');
      localStorage.removeItem('brewLeagueNFStoreName');
      localStorage.removeItem('brewLeagueNFStoreID');
      localStorage.removeItem('brewLeagueNFRegion');
      localStorage.removeItem('brewLeagueNFImgs');
      localStorage.removeItem('brewLeagueNFRemarks');
      localStorage.removeItem('brewLeagueNFComments');
      setResp({});
      setParticipantName('');
      setParticipantEmpID('');
      setStoreName('');
      setStoreID('');
      setRegion('');
      setImgs({});
      setRemarks({});
      setComments({});
    }
  };

  const { total, max, pct, sectionScores, sectionMax } = computeScores();

  return (
    <div className="p-6">
      {isLoading && <LoadingOverlay />}

      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Trophy size={20} />
            Report downloaded successfully!
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Star size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">National Finals - Sensory Sheet</h1>
              <p className="text-amber-100">Semi Automatic · National Competition Scoresheet</p>
            </div>
          </div>
        </div>

        {/* Participant Details */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Coffee size={24} className="text-amber-600" />
            Participant & Judge Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Judge Name *</label>
              <input
                value={judgeName}
                onChange={e => setJudgeName(e.target.value)}
                required
                placeholder="Enter judge name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Judge ID</label>
              <input
                readOnly
                value={judgeId}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 cursor-not-allowed"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Participant Name *</label>
              <input
                type="text"
                value={employeeSearchTerm || participantName}
                onChange={(e) => {
                  setEmployeeSearchTerm(e.target.value);
                  setShowEmployeeDropdown(true);
                }}
                onFocus={() => setShowEmployeeDropdown(true)}
                onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                placeholder="Search employee..."
              />
              {showEmployeeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {employeeLoading ? (
                    <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">Loading employees...</div>
                  ) : (() => {
                    const allEmployees = Object.values(employeeDirectory.byId);
                    const filtered = allEmployees.filter(emp =>
                      employeeSearchTerm === '' ||
                      emp.empname.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                      emp.employee_code.toLowerCase().includes(employeeSearchTerm.toLowerCase())
                    );

                    return filtered.length > 0 ? (
                      filtered.slice(0, 50).map((emp) => (
                        <button
                          key={emp.employee_code}
                          type="button"
                          onClick={() => {
                            setParticipantName(emp.empname);
                            setParticipantEmpID(emp.employee_code);
                            setEmployeeSearchTerm('');
                            setShowEmployeeDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm"
                        >
                          <div className="font-medium">{emp.empname}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{emp.employee_code}{emp.designation ? ` • ${emp.designation}` : ''}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 dark:text-slate-400 text-sm">
                        {employeeSearchTerm ? 'No matching employees found' : 'Start typing to search...'}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Participant Emp. ID *</label>
              <input
                value={participantEmpID}
                onChange={e => setParticipantEmpID(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                placeholder="Auto-filled from employee selection"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Code *</label>
              <input
                value={storeID}
                onChange={e => setStoreID(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Name *</label>
              <input
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Region</label>
              <input
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="e.g., North, South, East, West"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Start Time */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Start Time</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCaptureTime('startTime')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors"
              >
                <Clock size={16} />
                Capture Start Time
              </button>
              {resp['startTime'] && (
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                  {resp['startTime']}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Score Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Live Score</h3>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {total} / {max} ({pct}%)
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : pct >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
            {SENSORY_SECTIONS.map(sec => (
              <div key={sec.id} className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{sec.title}</div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {sectionScores[sec.id] || 0}/{sectionMax[sec.id] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        {SENSORY_SECTIONS.map((sec) => (
          <div key={sec.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                {sec.title}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {sec.items.length} item{sec.items.length !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {sectionScores[sec.id] || 0}/{sectionMax[sec.id] || 0}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {sec.items.map((it) => {
                const key = `${sec.id}_${it.id}`;

                return (
                  <div key={key} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-slate-100">{it.q}</span>
                        <span className="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                          {it.w} pts
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {['yes', 'no', 'na'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleOption(sec, it, opt)}
                            className={`px-4 py-2 rounded-md font-semibold transition-all ${
                              resp[key] === opt
                                ? opt === 'yes'
                                  ? 'bg-green-600 text-white ring-2 ring-green-400'
                                  : opt === 'no'
                                  ? 'bg-red-600 text-white ring-2 ring-red-400'
                                  : 'bg-yellow-600 text-white ring-2 ring-yellow-400'
                                : opt === 'yes'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                  : opt === 'no'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'
                            }`}
                          >
                            {opt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Comment field for items that require it */}
                    {it.hasComment && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={comments[key] || ''}
                          onChange={e => handleComment(key, e.target.value)}
                          placeholder={it.commentLabel || 'Add comment...'}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Section Remarks */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Section Remarks</label>
              <textarea
                value={remarks[sec.id] || ''}
                onChange={e => setRemarks(r => ({ ...r, [sec.id]: e.target.value }))}
                placeholder="Add any remarks for this section (optional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
              />
            </div>

            {/* Image Upload */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Camera size={16} />
                Upload Images
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={e => addImages(sec, e)}
                className="block w-full text-sm text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-600 rounded-md cursor-pointer bg-white dark:bg-slate-800"
              />
              {imgs[sec.id] && imgs[sec.id].length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {imgs[sec.id].map((imgSrc, i) => (
                    <img
                      key={i}
                      src={imgSrc}
                      className="w-20 h-20 object-cover rounded-md border border-gray-300 dark:border-slate-600"
                      alt={`${sec.title} ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* End Time */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">End Time</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleCaptureTime('endTime')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors"
              >
                <Clock size={16} />
                Capture End Time
              </button>
              {resp['endTime'] && (
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                  {resp['endTime']}
                </span>
              )}
            </div>
          </div>
          {resp['startTime'] && resp['endTime'] && (
            <div className="mt-3 text-sm text-gray-600 dark:text-slate-400">
              Total time: <span className="font-semibold">{getTimeDiff(resp['startTime'], resp['endTime'])}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            type="button"
            onClick={resetAll}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Reset Scoresheet
          </button>
          <button
            onClick={handleSubmit}
            disabled={downloading}
            className="px-6 py-3 btn-primary-gradient disabled:opacity-60 text-white rounded-lg font-medium transition-transform duration-150 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Download size={20} />
            {downloading ? 'Generating PDF...' : 'Submit & Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrewLeagueNationalFinals;
