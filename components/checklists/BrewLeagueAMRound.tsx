import React, { useState, useEffect } from 'react';
import { Download, RotateCcw, Clock, Camera, Trophy, Coffee } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingOverlay from '../LoadingOverlay';
import { useEmployeeDirectory } from '../../hooks/useEmployeeDirectory';

// Define section structure
interface ChecklistItem {
  id: string;
  q: string;
  w: number;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

// Checklist Data & Scoring - Identical to Region Round
const SECTIONS: ChecklistSection[] = [
  // Grooming & Hygiene
  {
    id: 'GroomingHygiene',
    title: 'Grooming & Hygiene',
    items: [
      { id: 'SanitizedHands', q: 'Has the barista sanitized their hands (Using Soap)', w: 1 },
      { id: 'ApronClean', q: 'Is the barista apron free from stains and damage', w: 1 },
      { id: 'NameTag', q: 'Is the barista wearing a name tag', w: 1 },
      { id: 'FormalPants', q: 'Is the barista wearing black formal pants', w: 1 },
      { id: 'BlackShoes', q: 'Is the barista wearing black shoes', w: 1 },
      { id: 'GroomingStandards', q: 'Barista following the grooming standards (Beard/Hair/Make-up) Male and female', w: 2 },
      { id: 'NailsTrimmed', q: 'Is the baristas nails trimmed', w: 1 },
      { id: 'JewelryPermitted', q: 'Only permitted jewelry worn', w: 1 }
    ]
  },
  // Espresso (Dial-In)
  {
    id: 'EspressoDialIn',
    title: 'Espresso (Dial-In)',
    items: [
      { id: 'Shot0', q: 'Shot extracted to check the recipe', w: 0 },
      { id: 'DialInStartTime', q: 'Dial-In Start time:', w: 0 }
    ]
  },
  // Espresso (Dial-In) Shot 1
  {
    id: 'EspressoDialInShot1',
    title: 'Espresso (Dial-In) Shot 1',
    items: [
      { id: 'GrindChange', q: 'Is the barista able to change the grind size based on under/over extracted shot', w: 5 },
      { id: 'ExplainDialIn', q: 'Is the barista able to explain the dial-in process', w: 3 },
      { id: 'WasteDose', q: 'Did the barista waste a dose after changing the grind size every time', w: 3 },
      { id: 'CheckWeight', q: 'Did the barista check the weight of the ground coffee after changing the grind size', w: 2 },
      { id: 'GrindingTime', q: 'Is the barista able to set the grinding time to dispense the right amount for dose', w: 2 },
      { id: 'GrinderCleaned', q: 'Area around the grinder cleaned with brush to clear out grounds', w: 2 },
      { id: 'PortaFilterDry', q: 'Porta filter wiped with dry grey cloth', w: 2 },
      { id: 'BasketFreeGrounds', q: 'Porta filter basket free from brewed coffee gounds', w: 2 },
      { id: 'RightBasket', q: 'Right basket porta filter used for intended shot', w: 2 },
      { id: 'RightGrammage', q: 'Right grammage of ground coffee taken', w: 2 },
      { id: 'CoffeeLevelled', q: 'Coffee grounds levelled using tap/chop method before tamping', w: 3 },
      { id: 'TampingMachine', q: 'Tamping machine set as per standard', w: 2 },
      { id: 'PortaFilterRim', q: 'Porta filter rim wiped to clear loose coffee grounds before inserting into group head', w: 2 },
      { id: 'FlushGrouphead', q: 'Barista Flushes the grouphead befor insert', w: 3 },
      { id: 'DripTrayWiped', q: 'Drip tray wiped with the right green cloth after flushing', w: 2 },
      { id: 'PortaFilterSmooth', q: 'Porta filter inserted into group head smoothly without knocking', w: 3 },
      { id: 'ExtractionButton', q: 'Right extraction button pressed within 3 seconds of inserting the porta filter', w: 3 },
      { id: 'FlowEvenly', q: 'Did the espresso flow evenly from both the spouts', w: 3 },
      { id: 'ShotBrewTime', q: 'Was the shot extracted within the brew time', w: 5 },
      { id: 'ShotYield', q: 'Was the shot extracted within the yield (+/- 1 g )', w: 5 }
    ]
  },
  // Espresso (Dial-In) Shot 2
  {
    id: 'EspressoDialInShot2',
    title: 'Espresso (Dial-In) Shot 2',
    items: [
      { id: 'GrindChange', q: 'Is the barista able to change the grind size based on under/over extracted shot', w: 5 },
      { id: 'ExplainDialIn', q: 'Is the barista able to explain the dial-in process', w: 3 },
      { id: 'WasteDose', q: 'Did the barista waste a dose after changing the grind size every time', w: 3 },
      { id: 'CheckWeight', q: 'Did the barista check the weight of the ground coffee after changing the grind size', w: 2 },
      { id: 'GrindingTime', q: 'Is the barista able to set the grinding time to dispense the right amount for dose', w: 2 },
      { id: 'GrinderCleaned', q: 'Area around the grinder cleaned with brush to clear out grounds', w: 2 },
      { id: 'PortaFilterDry', q: 'Porta filter wiped with dry grey cloth', w: 2 },
      { id: 'BasketFreeGrounds', q: 'Porta filter basket free from brewed coffee gounds', w: 2 },
      { id: 'RightBasket', q: 'Right basket porta filter used for intended shot', w: 2 },
      { id: 'RightGrammage', q: 'Right grammage of ground coffee taken', w: 2 },
      { id: 'CoffeeLevelled', q: 'Coffee grounds levelled using tap/chop method before tamping', w: 3 },
      { id: 'TampingMachine', q: 'Tamping machine set as per standard', w: 2 },
      { id: 'PortaFilterRim', q: 'Porta filter rim wiped to clear loose coffee grounds before inserting into group head', w: 2 },
      { id: 'FlushGrouphead', q: 'Barista Flushes the grouphead befor insert', w: 3 },
      { id: 'DripTrayWiped', q: 'Drip tray wiped with the right green cloth after flushing', w: 2 },
      { id: 'PortaFilterSmooth', q: 'Porta filter inserted into group head smoothly without knocking', w: 3 },
      { id: 'ExtractionButton', q: 'Right extraction button pressed within 3 seconds of inserting the porta filter', w: 3 },
      { id: 'FlowEvenly', q: 'Did the espresso flow evenly from both the spouts', w: 3 },
      { id: 'ShotBrewTime', q: 'Was the shot extracted within the brew time', w: 5 },
      { id: 'ShotYield', q: 'Was the shot extracted within the yield (+/- 1 g )', w: 5 }
    ]
  },
  {
    id: 'DialInEndTime',
    title: 'Dial-In End Time',
    items: [
      { id: 'DialInEndTime', q: 'Dial-In End time:', w: 0 }
    ]
  },
  // Milk Based Beverages
  {
    id: 'MilkBasedBeverages',
    title: 'Milk Based Beverages',
    items: [
      { id: 'StartTime', q: 'Milk Based Beverages Start time:', w: 0 }
    ]
  },
  // Milk Cup-1
  {
    id: 'MilkCup1',
    title: 'Milk Cup-1',
    items: [
      { id: 'BeverageType', q: 'Select Beverage type for Cup-1:', w: 0 }
    ]
  },
  // Cup-1 Steaming
  {
    id: 'Cup1Steaming',
    title: 'Cup-1 Steaming',
    items: [
      { id: 'SteamingPurged', q: 'Steaming wand is purged before use', w: 3 },
      { id: 'CleanPitcher', q: 'Is the Barista uses a clean milk pitcher for every order', w: 2 },
      { id: 'RightPitcher', q: 'Is the barista using the right milk pitcher for the intended beverage size', w: 3 },
      { id: 'ColdMilk', q: 'In the barista using cold milk stored in the chiller', w: 3 },
      { id: 'MilkPouch', q: 'Is the milk pouch stored in the 900ml pitcher', w: 1 },
      { id: 'RightMilkAmount', q: 'Is the barista taking the right amount of milk for the intended beverage size', w: 3 },
      { id: 'FoamConsistency', q: 'Is the barista able to create the right consistency of foam for a latte/ Cappuccino/Flat white', w: 3 },
      { id: 'SteamingWiped', q: 'Steaming wand is wiped & purged after use', w: 3 },
      { id: 'GreenClothSteam', q: 'Did the barista use the right green cloth to wipe the steam wand', w: 3 },
      { id: 'GreenClothStored', q: 'Did the barista store the green cloth in the GN pan after use', w: 2 }
    ]
  },
  // Cup-1 Pouring
  {
    id: 'Cup1Pouring',
    title: 'Cup-1 Pouring',
    items: [
      { id: 'EspressoPulled', q: 'Did the barista pulled the espresso shot within 30 seconds of steaming the milk', w: 3 },
      { id: 'MillPoured', q: 'Did the barista pour the milk within 30 seconds of pulling the shot', w: 3 },
      { id: 'PouringHeight', q: 'Milk poured from the correct height', w: 2 },
      { id: 'LatteArtPattern', q: 'Did the barista able to create a  latte art pattern', w: 5 },
      { id: 'CupWiped', q: 'Did the barista wipe the cup before serving', w: 2 }
    ]
  },
  // Milk Cup-2
  {
    id: 'MilkCup2',
    title: 'Milk Cup-2',
    items: [
      { id: 'BeverageType', q: 'Select Beverage type for Cup-2:', w: 0 }
    ]
  },
  // Cup-2 Steaming
  {
    id: 'Cup2Steaming',
    title: 'Cup-2 Steaming',
    items: [
      { id: 'SteamingPurged', q: 'Steaming wand is purged before use', w: 3 },
      { id: 'CleanPitcher', q: 'Is the Barista uses a clean milk pitcher for every order', w: 2 },
      { id: 'RightPitcher', q: 'Is the barista using the right milk pitcher for the intended beverage size', w: 3 },
      { id: 'ColdMilk', q: 'In the barista using cold milk stored in the chiller', w: 3 },
      { id: 'MilkPouch', q: 'Is the milk pouch stored in the 900ml pitcher', w: 1 },
      { id: 'RightMilkAmount', q: 'Is the barista taking the right amount of milk for the intended beverage size', w: 3 },
      { id: 'FoamConsistency', q: 'Is the barista able to create the right consistency of foam for a latte/ Cappuccino/Flat white', w: 3 },
      { id: 'SteamingWiped', q: 'Steaming wand is wiped & purged after use', w: 3 },
      { id: 'GreenClothSteam', q: 'Did the barista use the right green cloth to wipe the steam wand', w: 3 },
      { id: 'GreenClothStored', q: 'Did the barista store the green cloth in the GN pan after use', w: 2 }
    ]
  },
  // Cup-2 Pouring
  {
    id: 'Cup2Pouring',
    title: 'Cup-2 Pouring',
    items: [
      { id: 'EspressoPulled', q: 'Did the barista pulled the espresso shot within 30 seconds of steaming the milk', w: 3 },
      { id: 'MillPoured', q: 'Did the barista pour the milk within 30 seconds of pulling the shot', w: 3 },
      { id: 'PouringHeight', q: 'Milk poured from the correct height', w: 2 },
      { id: 'LatteArtPattern', q: 'Did the barista able to create a  latte art pattern', w: 5 },
      { id: 'CupWiped', q: 'Did the barista wipe the cup before serving', w: 2 }
    ]
  },
  {
    id: 'EndTime',
    title: 'Milk End Time',
    items: [
      { id: 'EndTime', q: 'Milk Based Beverages End time:', w: 0 }
    ]
  },
  // Sensory Score (for sensory scoresheet type)
  {
    id: 'SensoryScore',
    title: 'Sensory Score',
    items: [
      { id: 'LatteArtStandard', q: 'Was the Latte art created as per TWC std (Cappuccino- Heart , Latte- Tulip/ Rosetta , Flat white - Single dot )', w: 5 },
      { id: 'ShinyGlossy', q: 'Was it shiny and glossy?', w: 3 },
      { id: 'NoBubbles', q: 'No visible bubbles on the surface', w: 3 },
      { id: 'ArtInCenter', q: 'Is the latte art in the centre of the cup', w: 3 },
      { id: 'VisibleContrast', q: 'Is there a visible contrast between the crema and the latte art', w: 3 },
      { id: 'ArtFacingCustomer', q: 'Is the latte art facing the customer with the handle on the right side', w: 5 },
      { id: 'ArtCoverage', q: 'Did the latte art cover 70% of the cup surface', w: 3 },
      { id: 'FrothLevel', q: 'Was the froth level present as per TWC standard (Three Swipes- cappuccino, Two Swipes- Latte & One swipe- Flatwhite)', w: 4 },
      { id: 'FrothRatio', q: 'Is the froth level was as per Twc standard (70/30 in cappucctino, 90/10 in latte and micro form in flat white)', w: 5 },
      { id: 'CupImages', q: 'Cup 1& 2 - Images (Together)', w: 5 },
      { id: 'BaristaSmile', q: 'Did the barista smile and have an engaging interaction with the judge', w: 3 },
      { id: 'CleanCounter', q: 'Did the barista leave the counter clean after finishing his/her performance', w: 3 }
    ]
  }
];

// AM Round API endpoint
const LOG_ENDPOINTS = [
  'https://script.google.com/macros/s/AKfycbwVN9hWkzScxgOGCJfNqXEh6EOIpBHHckWi9nYULWuRc7wAuxs7po9BmSF2vYkpmvFQ6g/exec'
];

const BrewLeagueAMRound: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const judgeId = urlParams.get('judgeId') || urlParams.get('EMPID') || '';
  
  // Employee directory for searchable dropdown
  const { directory: employeeDirectory, loading: employeeLoading } = useEmployeeDirectory();
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [resp, setResp] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('brewLeagueAMResp');
    return saved ? JSON.parse(saved) : {};
  });
  const [imgs, setImgs] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('brewLeagueAMImgs');
    return saved ? JSON.parse(saved) : {};
  });
  const [remarks, setRemarks] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('brewLeagueAMRemarks');
    return saved ? JSON.parse(saved) : {};
  });

  // Form fields
  const [judgeName, setJudgeName] = useState(() => localStorage.getItem('brewLeagueAMJudgeName') || '');
  const [participantName, setParticipantName] = useState(() => localStorage.getItem('brewLeagueAMParticipantName') || '');
  const [participantEmpID, setParticipantEmpID] = useState(() => localStorage.getItem('brewLeagueAMParticipantEmpID') || '');
  const [areaManager, setAreaManager] = useState(() => localStorage.getItem('brewLeagueAMAreaManager') || '');
  const [scoresheetType, setScoresheetType] = useState<'technical' | 'sensory'>(() => (localStorage.getItem('brewLeagueAMScoresheetType') || 'technical') as 'technical' | 'sensory');
  const [machineType, setMachineType] = useState<'manual' | 'automatic'>(() => (localStorage.getItem('brewLeagueAMMachineType') || 'manual') as 'manual' | 'automatic');
  const [storeName, setStoreName] = useState(() => localStorage.getItem('brewLeagueAMStoreName') || '');
  const [storeID, setStoreID] = useState(() => localStorage.getItem('brewLeagueAMStoreID') || '');
  const [region, setRegion] = useState(() => localStorage.getItem('brewLeagueAMRegion') || '');

  const [downloading, setDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Persist form fields
  useEffect(() => {
    localStorage.setItem('brewLeagueAMJudgeName', judgeName);
  }, [judgeName]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMParticipantName', participantName);
  }, [participantName]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMParticipantEmpID', participantEmpID);
  }, [participantEmpID]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMAreaManager', areaManager);
  }, [areaManager]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMScoresheetType', scoresheetType);
  }, [scoresheetType]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMMachineType', machineType);
  }, [machineType]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMStoreName', storeName);
  }, [storeName]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMStoreID', storeID);
  }, [storeID]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMRegion', region);
  }, [region]);

  // Persist responses
  useEffect(() => {
    localStorage.setItem('brewLeagueAMResp', JSON.stringify(resp));
  }, [resp]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMImgs', JSON.stringify(imgs));
  }, [imgs]);
  useEffect(() => {
    localStorage.setItem('brewLeagueAMRemarks', JSON.stringify(remarks));
  }, [remarks]);

  const getActiveSections = () => {
    if (scoresheetType === 'sensory') {
      return SECTIONS.filter(s => s.id === 'SensoryScore');
    }
    // For technical scoresheet, exclude SensoryScore section
    return SECTIONS.filter(s => s.id !== 'SensoryScore');
  };

  const handleOption = (sec: ChecklistSection, it: ChecklistItem, opt: string) => {
    const key = `${sec.id}_${it.id}`;
    setResp(r => ({ ...r, [key]: opt }));
  };

  const handleCaptureTime = (sec: ChecklistSection, it: ChecklistItem) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', { hour12: false });
    const key = `${sec.id}_${it.id}`;
    setResp(r => ({ ...r, [key]: time }));
  };

  const handleTSA = (sec: ChecklistSection, it: ChecklistItem, val: string) => {
    const key = `${sec.id}_${it.id}`;
    setResp(r => ({ ...r, [key]: val }));
  };

  const addImages = (sec: ChecklistSection, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImgs(prevImgs => ({
            ...prevImgs,
            [sec.id]: [...(prevImgs[sec.id] || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const resetAll = () => {
    if (window.confirm('Reset all fields? This cannot be undone.')) {
      setResp({});
      setImgs({});
      setRemarks({});
      setJudgeName('');
      setParticipantName('');
      setParticipantEmpID('');
      setAreaManager('');
      setScoresheetType('technical');
      setMachineType('manual');
      setStoreName('');
      setStoreID('');
      setRegion('');
      localStorage.removeItem('brewLeagueAMResp');
      localStorage.removeItem('brewLeagueAMImgs');
      localStorage.removeItem('brewLeagueAMRemarks');
      localStorage.removeItem('brewLeagueAMJudgeName');
      localStorage.removeItem('brewLeagueAMParticipantName');
      localStorage.removeItem('brewLeagueAMParticipantEmpID');
      localStorage.removeItem('brewLeagueAMAreaManager');
      localStorage.removeItem('brewLeagueAMScoresheetType');
      localStorage.removeItem('brewLeagueAMMachineType');
      localStorage.removeItem('brewLeagueAMStoreName');
      localStorage.removeItem('brewLeagueAMStoreID');
      localStorage.removeItem('brewLeagueAMRegion');
    }
  };

  const getTime = (sectionId: string, itemId: string): string => {
    const key = `${sectionId}_${itemId}`;
    return resp[key] || '';
  };

  const getTimeDiff = (start: string, end: string): string => {
    if (!start || !end) return 'N/A';
    const [sh, sm, ss] = start.split(':').map(Number);
    const [eh, em, es] = end.split(':').map(Number);
    const startSec = sh * 3600 + sm * 60 + ss;
    const endSec = eh * 3600 + em * 60 + es;
    const diff = endSec - startSec;
    if (diff < 0) return 'Invalid';
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${min}m ${sec}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setIsLoading(true);

    // Calculate scores
    let total = 0, max = 0;
    const sectionScores: Record<string, number> = {};
    const sectionMax: Record<string, number> = {};

    const scoringSections = getActiveSections();
    scoringSections.forEach(sec => {
      let secTotal = 0, secMax = 0;
      sec.items.forEach(it => {
        const key = `${sec.id}_${it.id}`;
        const r = resp[key];
        if (sec.id === 'SensoryScore' && it.id === 'CupImage') {
          const hasImgs = imgs['SensoryScore'] && imgs['SensoryScore'].length > 0;
          if (hasImgs) secTotal += it.w;
          secMax += Math.abs(it.w);
        } else {
          if (r === 'yes') secTotal += it.w;
          if (r !== 'na') secMax += Math.abs(it.w);
        }
      });
      sectionScores[sec.id] = secTotal;
      sectionMax[sec.id] = secMax;
      total += secTotal;
      max += secMax;
    });

    const pct = max ? Math.round((total / max) * 100) : 0;
    const completion = new Date().toLocaleString('en-GB', { hour12: false });

    const dialInStart = getTime('EspressoDialIn', 'DialInStartTime');
    const dialInEnd = getTime('DialInEndTime', 'DialInEndTime');
    const milkStart = getTime('MilkBasedBeverages', 'StartTime');
    const milkEnd = getTime('EndTime', 'EndTime');

    const dialInTimeTaken = getTimeDiff(dialInStart, dialInEnd);
    const milkTimeTaken = getTimeDiff(milkStart, milkEnd);

    // Log to Google Sheets - NOW WITH AREA MANAGER FIELD
    const data = new URLSearchParams({
      participantName,
      participantEmpID,
      judgeName,
      judgeId,
      scoresheetType,
      machineType,
      storeName,
      storeID,
      areaManager, // NEW: AM field
      region,
      totalScore: total.toString(),
      maxScore: max.toString(),
      percent: pct.toString(),
      GroomingHygieneScore: (sectionScores.GroomingHygiene || 0).toString(),
      EspressoDialInScore: (sectionScores.EspressoDialIn || 0).toString(),
      EspressoDialInShot1Score: (sectionScores.EspressoDialInShot1 || 0).toString(),
      EspressoDialInShot2Score: (sectionScores.EspressoDialInShot2 || 0).toString(),
      DialInEndTimeScore: (sectionScores.DialInEndTime || 0).toString(),
      MilkBasedBeveragesScore: (sectionScores.MilkBasedBeverages || 0).toString(),
      MilkCup1Score: (sectionScores.MilkCup1 || 0).toString(),
      Cup1SteamingScore: (sectionScores.Cup1Steaming || 0).toString(),
      Cup1PouringScore: (sectionScores.Cup1Pouring || 0).toString(),
      MilkCup2Score: (sectionScores.MilkCup2 || 0).toString(),
      Cup2SteamingScore: (sectionScores.Cup2Steaming || 0).toString(),
      Cup2PouringScore: (sectionScores.Cup2Pouring || 0).toString(),
      EndTimeScore: (sectionScores.EndTime || 0).toString(),
      dialInTimeTaken,
      milkTimeTaken,
      submissionTime: completion,
      allResponses: JSON.stringify(resp),
      sectionRemarks: JSON.stringify(remarks),
      images: JSON.stringify(Object.keys(imgs).reduce((acc, key) => {
        acc[key] = imgs[key].length;
        return acc;
      }, {} as Record<string, number>))
    });

    try {
      await Promise.all(LOG_ENDPOINTS.map(url => fetch(url, { method: 'POST', body: data })));
      console.log('✅ AM Round data submitted successfully');
    } catch (error) {
      console.error('Error logging to sheets:', error);
    }

    // Generate PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Brew League Score Sheet - AM Round', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Participant Name: ${participantName}`, 10, 25);
    doc.text(`Participant Emp. ID: ${participantEmpID}`, 10, 30);
    doc.text(`Judge Name: ${judgeName}`, 10, 35);
    doc.text(`Judge ID: ${judgeId}`, 10, 40);
    doc.text(`Area Manager: ${areaManager}`, 10, 45); // NEW: AM field
    doc.text(`Scoresheet Type: ${scoresheetType}`, 10, 50);
    doc.text(`Machine Type: ${machineType}`, 10, 55);
    doc.text(`Date/Time: ${completion}`, 10, 60);
    doc.text(`Store Name: ${storeName}`, 10, 65);
    doc.text(`Store ID: ${storeID}`, 10, 70);
    doc.text(`Region: ${region}`, 10, 75);

    let y = 80;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Time taken for espresso: ${dialInTimeTaken}`, 105, y, { align: 'center' });
    y += 6;
    doc.text(`Time taken for milk based: ${milkTimeTaken}`, 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(15);
    doc.text(`Score: ${total} / ${max} (${pct}%)`, 105, y, { align: 'center' });
    y += 10;

    // Section breakdown
    scoringSections.forEach(sec => {
      const sScore = sectionScores[sec.id] || 0;
      const sMax = sectionMax[sec.id] || 0;
      const secPct = sMax ? Math.round((sScore / sMax) * 100) : 0;
      
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(sec.title, 10, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${sScore}/${sMax} (${secPct}%)`, 200, y, { align: 'right' });
      y += 7;

      sec.items.forEach(it => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const key = `${sec.id}_${it.id}`;
        const answer = resp[key] || 'N/A';
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(it.q, 140);
        doc.text(lines, 15, y);
        
        if (answer === 'yes') doc.setTextColor(34, 197, 94);
        else if (answer === 'no') doc.setTextColor(239, 68, 68);
        else if (answer === 'na') doc.setTextColor(234, 179, 8);
        else doc.setTextColor(0, 0, 0);
        
        doc.text(answer.toUpperCase(), 190, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        y += 5 * lines.length;
      });

      if (remarks[sec.id]) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(`Remarks: ${remarks[sec.id]}`, 15, y);
        y += 5;
      }
      y += 3;
    });

    const fileName = `BrewLeague_AMRound_${participantName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);

    setDownloading(false);
    setIsLoading(false);

    if (window.confirm('Scoresheet submitted! Reset form for next participant?')) {
      resetAll();
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-lg">
      <LoadingOverlay isVisible={isLoading} />

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-10 h-10" />
          <h2 className="text-3xl font-bold">Brew League - AM Round</h2>
        </div>
        <p className="text-center text-amber-100">Area Manager Level Competition Scoresheet</p>
      </div>

      <div className="p-6">
        {/* Judge Information */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            Judge Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Judge Name *</label>
              <input
                type="text"
                value={judgeName}
                onChange={e => setJudgeName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                placeholder="Enter judge name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Judge Emp ID</label>
              <input
                type="text"
                value={judgeId}
                readOnly
                className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-slate-100 cursor-not-allowed"
                placeholder="From URL parameter"
              />
            </div>
          </div>
        </div>

        {/* Participant Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              type="text"
              value={participantEmpID}
              onChange={e => setParticipantEmpID(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              placeholder="Auto-filled from employee selection"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Area Manager *</label>
            <input
              type="text"
              value={areaManager}
              onChange={e => setAreaManager(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              placeholder="Enter area manager name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Region *</label>
            <input
              type="text"
              value={region}
              onChange={e => setRegion(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              placeholder="North/South/East/West"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Name *</label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              placeholder="Enter store name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store ID *</label>
            <input
              type="text"
              value={storeID}
              onChange={e => setStoreID(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              placeholder="Enter store ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Scoresheet Type *</label>
            <select
              value={scoresheetType}
              onChange={e => setScoresheetType(e.target.value as 'technical' | 'sensory')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="technical">Technical</option>
              <option value="sensory">Sensory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Machine Type *</label>
            <select
              value={machineType}
              onChange={e => setMachineType(e.target.value as 'manual' | 'automatic')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>
        </div>

        {/* Sections */}
        {getActiveSections().map(sec => (
          <div key={sec.id} className="mb-6 p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-amber-600">
              {sec.title}
            </h3>

            <div className="space-y-3">
              {sec.items.map(it => {
                const key = `${sec.id}_${it.id}`;
                const isTimeField = it.q.includes('time:') || it.q.includes('time');
                const isBeverageSelect = it.id === 'BeverageType';
                // Specific time fields that need Capture Time button
                const isSpecificTimeField = (
                  (sec.id === 'EspressoDialIn' && it.id === 'DialInStartTime') ||
                  (sec.id === 'DialInEndTime' && it.id === 'DialInEndTime') ||
                  (sec.id === 'MilkBasedBeverages' && it.id === 'StartTime') ||
                  (sec.id === 'EndTime' && it.id === 'EndTime')
                );

                if (isBeverageSelect) {
                  return (
                    <div key={key} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                      <div className="flex flex-col gap-3">
                        <span className="font-medium text-gray-900 dark:text-slate-100">{it.q}</span>
                        <select 
                          value={resp[key] || ''} 
                          onChange={e => handleTSA(sec, it, e.target.value)} 
                          className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                        >
                          <option value="">Select beverage</option>
                          <option value="Cappuccino">Cappuccino</option>
                          <option value="Latte">Latte</option>
                          <option value="Flat white">Flat white</option>
                        </select>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="font-medium text-gray-900 dark:text-slate-100 flex-1">{it.q}</span>
                      {isSpecificTimeField ? (
                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => handleCaptureTime(sec, it)} 
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors"
                          >
                            <Clock size={16} />
                            Capture Time
                          </button>
                          {resp[key] && (
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600">
                              {resp[key]}
                            </span>
                          )}
                        </div>
                      ) : (sec.id === 'SensoryScore' && it.id === 'CupImage') ? (
                        <div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            multiple 
                            onChange={e => addImages(sec, e)} 
                            className="text-sm"
                          />
                        </div>
                      ) : (
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
                      )}
                    </div>
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

            {/* Image Upload for Grooming & Hygiene */}
            {sec.id === 'GroomingHygiene' && (
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
                  className="text-sm text-gray-700 dark:text-slate-300"
                />
                {imgs[sec.id] && imgs[sec.id].length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {imgs[sec.id].map((imgSrc, i) => (
                      <img 
                        key={i} 
                        src={imgSrc} 
                        className="w-20 h-20 object-cover rounded-md border border-gray-300 dark:border-slate-600" 
                        alt={`Grooming ${i + 1}`} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Image Upload for Sensory Cup Images */}
            {sec.id === 'SensoryScore' && (
              <div className="mt-4">
                {imgs[sec.id] && imgs[sec.id].length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {imgs[sec.id].map((imgSrc, i) => (
                      <img 
                        key={i} 
                        src={imgSrc} 
                        className="w-20 h-20 object-cover rounded-md border border-gray-300 dark:border-slate-600" 
                        alt={`Sensory Cup ${i + 1}`} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

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

export default BrewLeagueAMRound;
