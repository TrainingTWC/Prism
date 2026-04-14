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
  hasComment?: boolean;
  commentLabel?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

// ─── SENSORY SECTIONS ───────────────────────────────────────────────────────
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

// ─── TECHNICAL SECTIONS ─────────────────────────────────────────────────────
// Helper to generate standard espresso-shot items (used in Espresso section shots)
const espressoShotItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}GrinderCleaned`, q: 'Area around the grinder cleaned with brush to clear out grounds', w: 2 },
  { id: `${prefix}PortaFilterDry`, q: 'Porta filter wiped with dry grey cloth', w: 2 },
  { id: `${prefix}BasketFree`, q: 'Porta filter basket free from brewed coffee gounds', w: 2 },
  { id: `${prefix}RightGrammage`, q: 'Right grammage of ground coffee taken', w: 2 },
  { id: `${prefix}CoffeeLevelled`, q: 'Coffee grounds levelled using tap/chop method before tamping', w: 3 },
  { id: `${prefix}PortaFilterRim`, q: 'Porta filter rim wiped to clear loose coffee grounds before inserting into group head', w: 2 },
  { id: `${prefix}FlushGrouphead`, q: 'Barista Flushes the grouphead befor insert', w: 3 },
  { id: `${prefix}DripTray`, q: 'Drip tray wiped with the right green cloth after flushing', w: 2 },
  { id: `${prefix}PortaFilterSmooth`, q: 'Porta filter inserted into group head smoothly without knocking', w: 3 },
  { id: `${prefix}ExtractionButton`, q: 'Right extraction button pressed within 3 seconds of inserting the porta filter', w: 3 },
  { id: `${prefix}FlowEvenly`, q: 'Did the espresso flow evenly from both the spouts', w: 3 },
  { id: `${prefix}BrewTime`, q: 'Was the shot extracted within the brew time', w: 5 },
];

// Helper for milk-based cup extraction items
const milkCupExtractionItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}PreWarmed`, q: 'Is the cup pre-warmed before extraction', w: 2 },
  { id: `${prefix}PortaFilterDry`, q: 'Porta filter wiped with dry grey cloth', w: 2 },
  { id: `${prefix}BasketFree`, q: 'Porta filter basket free from brewed coffee gounds', w: 2 },
  { id: `${prefix}CoffeeLevelled`, q: 'Coffee grounds levelled using tap/chop method before tamping', w: 3 },
  { id: `${prefix}PortaFilterRim`, q: 'Porta filter rim wiped to clear loose coffee grounds before inserting into group head', w: 2 },
  { id: `${prefix}FlushGrouphead`, q: 'Barista Flushes the grouphead befor insert', w: 3 },
  { id: `${prefix}DripTray`, q: 'Drip tray wiped with the right green cloth after flushing', w: 2 },
  { id: `${prefix}PortaFilterSmooth`, q: 'Porta filter inserted into group head smoothly without knocking', w: 3 },
  { id: `${prefix}ExtractionButton`, q: 'Right extraction button pressed within 3 seconds of inserting the porta filter', w: 3 },
  { id: `${prefix}FlowEvenly`, q: 'Did the espresso flow evenly from both the spouts', w: 3 },
  { id: `${prefix}BrewTime`, q: 'Was the shot extracted within the brew time', w: 5 },
  { id: `${prefix}Yield`, q: 'Was the shot extracted within the yield (+/- 1 g)', w: 5 },
];

// Helper for steaming items
const steamingItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}SteamPurge`, q: 'Steaming wand is purged before use', w: 3 },
  { id: `${prefix}CleanPitcher`, q: 'Is the Barista uses a clean milk pitcher for every order', w: 2 },
  { id: `${prefix}RightPitcher`, q: 'Is the barista using the right milk pitcher for the intended beverage size', w: 3 },
  { id: `${prefix}ColdMilk`, q: 'In the barista using cold milk stored in the chiller', w: 3 },
  { id: `${prefix}MilkPouch`, q: 'Is the milk pouch stored in the 900ml pitcher', w: 1 },
  { id: `${prefix}RightMilkAmt`, q: 'Is the barista taking the right amount of milk for the intended beverage size', w: 3 },
  { id: `${prefix}FoamConsistency`, q: 'Is the barista able to create the right consistency of foam for a latte/ Cappuccino/Flat white', w: 3 },
  { id: `${prefix}SteamWiped`, q: 'Steaming wand is wiped & purged after use', w: 3 },
  { id: `${prefix}GreenClothSteam`, q: 'Did the barista use the right green cloth to wipe the steam wand', w: 3 },
  { id: `${prefix}GreenClothStore`, q: 'Did the barista store the green cloth in the GN pan after use', w: 2 },
];

// Helper for pouring items
const pouringItems = (prefix: string): ChecklistItem[] => [
  { id: `${prefix}TapPitcher`, q: 'Does the barista tap the pitcher to remove excess bubbles (if any)', w: 1 },
  { id: `${prefix}SwirlPitcher`, q: 'Did the barista swirl the pitcher to ensure the milk and foam is well mixed', w: 1 },
  { id: `${prefix}LatteArt`, q: 'Barista able to create latte art in the cup (Cappuccino- Heart, Latte- Tulip/Rosetta, Flat white - Single dot in the centre)', w: 5 },
  { id: `${prefix}NoSpillage`, q: 'No spillage of espresso or milk on the outer part of the cup', w: 2 },
  { id: `${prefix}MilkWastage`, q: 'Milk wastage less than 50ml', w: 3 },
];

const TECHNICAL_SECTIONS: ChecklistSection[] = [
  // ── Beverage Selection ──
  {
    id: 'TechBeverage',
    title: 'Details',
    items: [
      { id: 'BeverageName', q: 'Mention the name of the beverage that is asked to be prepared.', w: 0 },
    ]
  },
  // ── Espresso Dial-In ──
  {
    id: 'EspressoDialIn',
    title: 'Espresso (Dial-In)',
    items: [
      { id: 'Shot0', q: 'Shot extracted to check the recipe', w: 0 },
      { id: 'DialInStartTime', q: 'Dial-In Start time:', w: 0 },
    ]
  },
  // Dial-In Shot 1 (18 items)
  {
    id: 'DialInShot1',
    title: 'Dial-In Shot 1',
    items: [
      { id: 'GrindChange', q: 'Is the barista able to change the grind size based on under/over extracted shot', w: 5 },
      { id: 'WasteDose', q: 'Did the barista waste a dose after changing the grind size every time', w: 3 },
      { id: 'CheckWeight', q: 'Did the barista check the weight of the ground coffee after changing the grind size', w: 2 },
      { id: 'GrindingTime', q: 'Is the barista able to set the grinding time to dispense the right amount for dose', w: 2 },
      { id: 'GrinderCleaned', q: 'Area around the grinder cleaned with brush to clear out grounds', w: 2 },
      { id: 'PortaFilterDry', q: 'Porta filter wiped with dry grey cloth', w: 2 },
      { id: 'BasketFree', q: 'Porta filter basket free from brewed coffee gounds', w: 2 },
      { id: 'RightGrammage', q: 'Right grammage of ground coffee taken', w: 2 },
      { id: 'CoffeeLevelled', q: 'Coffee grounds levelled using tap/chop method before tamping', w: 3 },
      { id: 'TampingMachine', q: 'Tamping machine set as per standard', w: 2 },
      { id: 'PortaFilterRim', q: 'Porta filter rim wiped to clear loose coffee grounds before inserting into group head', w: 2 },
      { id: 'FlushGrouphead', q: 'Barista Flushes the grouphead befor insert', w: 3 },
      { id: 'DripTray', q: 'Drip tray wiped with the right green cloth after flushing', w: 2 },
      { id: 'PortaFilterSmooth', q: 'Porta filter inserted into group head smoothly without knocking', w: 3 },
      { id: 'ExtractionButton', q: 'Right extraction button pressed within 3 seconds of inserting the porta filter', w: 3 },
      { id: 'FlowEvenly', q: 'Did the espresso flow evenly from both the spouts', w: 3 },
      { id: 'BrewTime', q: 'Was the shot extracted within the brew time', w: 5 },
      { id: 'Yield', q: 'Was the shot extracted within the yield (+/- 1 g)', w: 5 },
    ]
  },
  // Dial-In Shot 2 (16 items - no TampingMachine, no Yield)
  {
    id: 'DialInShot2',
    title: 'Dial-In Shot 2',
    items: [
      { id: 'GrindChange', q: 'Is the barista able to change the grind size based on under/over extracted shot', w: 5 },
      { id: 'WasteDose', q: 'Did the barista waste a dose after changing the grind size every time', w: 3 },
      { id: 'CheckWeight', q: 'Did the barista check the weight of the ground coffee after changing the grind size', w: 2 },
      { id: 'GrindingTime', q: 'Is the barista able to set the grinding time to dispense the right amount for dose', w: 2 },
      { id: 'GrinderCleaned', q: 'Area around the grinder cleaned with brush to clear out grounds', w: 2 },
      { id: 'PortaFilterDry', q: 'Porta filter wiped with dry grey cloth', w: 2 },
      { id: 'BasketFree', q: 'Porta filter basket free from brewed coffee gounds', w: 2 },
      { id: 'RightGrammage', q: 'Right grammage of ground coffee taken', w: 2 },
      { id: 'CoffeeLevelled', q: 'Coffee grounds levelled using tap/chop method before tamping', w: 3 },
      { id: 'PortaFilterRim', q: 'Porta filter rim wiped to clear loose coffee grounds before inserting into group head', w: 2 },
      { id: 'FlushGrouphead', q: 'Barista Flushes the grouphead befor insert', w: 3 },
      { id: 'DripTray', q: 'Drip tray wiped with the right green cloth after flushing', w: 2 },
      { id: 'PortaFilterSmooth', q: 'Porta filter inserted into group head smoothly without knocking', w: 3 },
      { id: 'ExtractionButton', q: 'Right extraction button pressed within 3 seconds of inserting the porta filter', w: 3 },
      { id: 'FlowEvenly', q: 'Did the espresso flow evenly from both the spouts', w: 3 },
      { id: 'BrewTime', q: 'Was the shot extracted within the brew time', w: 5 },
    ]
  },
  // Dial-In Shot 3 (same as Shot 2)
  {
    id: 'DialInShot3',
    title: 'Dial-In Shot 3',
    items: [
      { id: 'GrindChange', q: 'Is the barista able to change the grind size based on under/over extracted shot', w: 5 },
      { id: 'WasteDose', q: 'Did the barista waste a dose after changing the grind size every time', w: 3 },
      { id: 'CheckWeight', q: 'Did the barista check the weight of the ground coffee after changing the grind size', w: 2 },
      { id: 'GrindingTime', q: 'Is the barista able to set the grinding time to dispense the right amount for dose', w: 2 },
      { id: 'GrinderCleaned', q: 'Area around the grinder cleaned with brush to clear out grounds', w: 2 },
      { id: 'PortaFilterDry', q: 'Porta filter wiped with dry grey cloth', w: 2 },
      { id: 'BasketFree', q: 'Porta filter basket free from brewed coffee gounds', w: 2 },
      { id: 'RightGrammage', q: 'Right grammage of ground coffee taken', w: 2 },
      { id: 'CoffeeLevelled', q: 'Coffee grounds levelled using tap/chop method before tamping', w: 3 },
      { id: 'PortaFilterRim', q: 'Porta filter rim wiped to clear loose coffee grounds before inserting into group head', w: 2 },
      { id: 'FlushGrouphead', q: 'Barista Flushes the grouphead befor insert', w: 3 },
      { id: 'DripTray', q: 'Drip tray wiped with the right green cloth after flushing', w: 2 },
      { id: 'PortaFilterSmooth', q: 'Porta filter inserted into group head smoothly without knocking', w: 3 },
      { id: 'ExtractionButton', q: 'Right extraction button pressed within 3 seconds of inserting the porta filter', w: 3 },
      { id: 'FlowEvenly', q: 'Did the espresso flow evenly from both the spouts', w: 3 },
      { id: 'BrewTime', q: 'Was the shot extracted within the brew time', w: 5 },
    ]
  },
  // Dial-In End
  {
    id: 'DialInEnd',
    title: '',
    items: [
      { id: 'DialInEndTime', q: 'Dial-In End time:', w: 0 },
    ]
  },
  // ── Espresso Section ──
  {
    id: 'EspressoStart',
    title: 'Espresso',
    items: [
      { id: 'EspressoStartTime', q: 'Espresso Start Time:', w: 0 },
    ]
  },
  {
    id: 'EspressoShot1',
    title: 'Espresso Shot 1',
    items: espressoShotItems('S1'),
  },
  {
    id: 'EspressoShot2',
    title: 'Espresso Shot 2',
    items: espressoShotItems('S2'),
  },
  {
    id: 'EspressoShot3',
    title: 'Espresso Shot 3',
    items: espressoShotItems('S3'),
  },
  {
    id: 'EspressoShot4',
    title: 'Espresso Shot 4',
    items: espressoShotItems('S4'),
  },
  {
    id: 'EspressoEnd',
    title: '',
    items: [
      { id: 'EspressoEndTime', q: 'Espresso End time:', w: 0 },
    ]
  },
  // ── Milk Based Beverages ──
  {
    id: 'MilkBasedHeader',
    title: 'Milk Based Beverages',
    items: [
      { id: 'MilkStartTime', q: 'Start time:', w: 0 },
    ]
  },
  // Cup 1
  { id: 'MilkCup1', title: 'Cup-1', items: milkCupExtractionItems('C1') },
  { id: 'Cup1Steaming', title: 'Cup-1 Steaming', items: steamingItems('C1') },
  { id: 'Cup1Pouring', title: 'Cup-1 Pouring', items: pouringItems('C1') },
  // Cup 2
  { id: 'MilkCup2', title: 'Cup-2', items: milkCupExtractionItems('C2') },
  { id: 'Cup2Steaming', title: 'Cup-2 Steaming', items: steamingItems('C2') },
  { id: 'Cup2Pouring', title: 'Cup-2 Pouring', items: pouringItems('C2') },
  // Cup 3
  { id: 'MilkCup3', title: 'Cup-3', items: milkCupExtractionItems('C3') },
  { id: 'Cup3Steaming', title: 'Cup-3 Steaming', items: steamingItems('C3') },
  { id: 'Cup3Pouring', title: 'Cup-3 Pouring', items: pouringItems('C3') },
  // Cup 4
  { id: 'MilkCup4', title: 'Cup-4', items: milkCupExtractionItems('C4') },
  { id: 'Cup4Steaming', title: 'Cup-4 Steaming', items: steamingItems('C4') },
  { id: 'Cup4Pouring', title: 'Cup-4 Pouring', items: pouringItems('C4') },
  // Milk End
  {
    id: 'MilkEnd',
    title: '',
    items: [
      { id: 'MilkEndTime', q: 'End time:', w: 0 },
    ]
  },
  // ── Final Espresso Shots ──
  { id: 'FinalShot1', title: 'Shot 1', items: milkCupExtractionItems('F1') },
  { id: 'FinalShot2', title: 'Shot 2', items: milkCupExtractionItems('F2') },
  { id: 'FinalShot3', title: 'Shot 3', items: milkCupExtractionItems('F3') },
  { id: 'FinalShot4', title: 'Shot 4', items: milkCupExtractionItems('F4') },
  // ── Station Management ──
  {
    id: 'StationManagement',
    title: 'Station Management',
    items: [
      { id: 'CleanWorkArea', q: 'Station management / Clean Working area at end', w: 5 },
      { id: 'CleanPortafilter', q: 'Clean portafilter Spouts', w: 2 },
      { id: 'GeneralHygiene', q: 'General Hygiene throughout presentation', w: 2 },
      { id: 'ProperCloth', q: 'Proper Usage of cloth', w: 2 },
    ]
  },
];

const LOG_ENDPOINTS = [
  import.meta.env.VITE_NATIONAL_FINALS_SCRIPT_URL || ''
].filter(Boolean);

const TIME_ITEM_IDS = ['DialInStartTime', 'DialInEndTime', 'EspressoStartTime', 'EspressoEndTime', 'MilkStartTime', 'MilkEndTime'];

const BrewLeagueNationalFinals: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const [judgeName, setJudgeName] = useState(() => localStorage.getItem('brewLeagueNFJudgeName') || urlParams.get('judgeName') || urlParams.get('name') || '');
  const judgeId = urlParams.get('judgeId') || urlParams.get('EMPID') || '';

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

  // Scoresheet toggle – matches regional round pattern
  const [scoresheetType, setScoresheetType] = useState<'technical' | 'sensory'>(() => {
    return (localStorage.getItem('brewLeagueNFScoresheetType') as 'technical' | 'sensory') || 'technical';
  });

  // Persist scoresheet type
  useEffect(() => {
    localStorage.setItem('brewLeagueNFScoresheetType', scoresheetType);
  }, [scoresheetType]);

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
      if (!participantName) setParticipantName(employee.empname || '');
      const employeeStoreCode = employee.store_code || employee.location;
      if (employeeStoreCode && comprehensiveMapping.length > 0) {
        const normalizedStoreCode = employeeStoreCode.toString().trim().toUpperCase();
        const storeData = comprehensiveMapping.find((s: any) =>
          s['Store ID']?.toString().trim().toUpperCase() === normalizedStoreCode ||
          s['Store Name']?.toLowerCase().includes(employeeStoreCode.toLowerCase())
        );
        if (storeData) {
          if (!storeName) setStoreName(storeData['Store Name'] || '');
          if (!storeID) setStoreID(storeData['Store ID'] || '');
          if (!region) setRegion(storeData['Region'] || '');
        }
      }
    }
  }, [participantEmpID, employeeDirectory, comprehensiveMapping, employeeLoading, mappingLoading]);

  // Active sections based on toggle
  const getActiveSections = (): ChecklistSection[] => {
    return scoresheetType === 'sensory' ? SENSORY_SECTIONS : TECHNICAL_SECTIONS;
  };
  const visibleSections = getActiveSections();

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

  const handleCaptureTimeForItem = (sec: ChecklistSection, it: ChecklistItem) => {
    const key = `${sec.id}_${it.id}`;
    handleCaptureTime(key);
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

    visibleSections.forEach(sec => {
      let secTotal = 0, secMax = 0;
      sec.items.forEach(it => {
        if (it.w === 0) return; // skip time/marker items
        const key = `${sec.id}_${it.id}`;
        const r = resp[key];
        if (r === 'yes') {
          secTotal += it.w;
          secMax += it.w;
        } else if (r === 'na') {
          // NA – don't count toward max
        } else if (r !== undefined && r !== '' && !isNaN(Number(r))) {
          secTotal += Number(r);
          secMax += it.w;
        } else {
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

    // Time calculations differ per mode
    let startTime = '', endTime = '', timeTaken = '-';
    if (scoresheetType === 'sensory') {
      startTime = resp['startTime'] || '';
      endTime = resp['endTime'] || '';
      timeTaken = getTimeDiff(startTime, endTime);
    } else {
      // Technical: use dial-in start → last section end
      startTime = resp['EspressoDialIn_DialInStartTime'] || '';
      endTime = resp['MilkEnd_MilkEndTime'] || '';
      timeTaken = getTimeDiff(startTime, endTime);
    }

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
        scoresheetType,
        totalScore: total.toString(),
        maxScore: max.toString(),
        percent: pct.toString(),
        startTime,
        endTime,
        timeTaken,
        submissionTime: completion,
        allResponses: JSON.stringify(resp),
        sectionScores: JSON.stringify(sectionScores),
        sectionMax: JSON.stringify(sectionMax),
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
    const sheetLabel = scoresheetType === 'sensory' ? 'National Finals - Sensory Sheet' : 'National Finals - Technical Sheet';
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(sheetLabel, 105, 15, { align: 'center' });
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

    for (const sec of visibleSections) {
      // Skip empty-title sections in PDF (merge with next)
      if (!sec.title && sec.items.length === 1 && sec.items[0].w === 0) {
        // Still render time value if captured
        const tKey = `${sec.id}_${sec.items[0].id}`;
        if (resp[tKey]) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text(`${sec.items[0].q} ${resp[tKey]}`, 18, y);
          y += 6;
        }
        continue;
      }

      doc.setDrawColor('#bdbdbd');
      doc.setLineWidth(0.7);
      doc.line(15, y, 195, y);
      y += 3;

      const secScore = sectionScores[sec.id] ?? 0;
      const secMaxScore = sectionMax[sec.id] ?? 0;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${sec.title}${secMaxScore > 0 ? ` (Score: ${secScore} / ${secMaxScore})` : ''}`, 105, y + 8, { align: 'center' });

      autoTable(doc, {
        startY: y + 12,
        head: [['Question', 'Points', 'Response', 'Score']],
        body: sec.items.map(it => {
          const key = `${sec.id}_${it.id}`;
          const r = resp[key];
          let respText = '';
          let score: number | string = 0;
          if (TIME_ITEM_IDS.includes(it.id)) {
            respText = r || '-';
            score = '-' as any;
          } else if (it.id === 'BeverageName' || it.id === 'Shot0') {
            respText = r || '-';
            score = '-' as any;
          } else if (r === 'yes') {
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
          const comment = comments[key];
          if (comment) respText += ` (${comment})`;
          const scoreStr = score === 'NA' ? `NA/${it.w}` : score === '-' ? '-' : `${score}/${it.w}`;
          return [it.q, it.w.toString(), respText, scoreStr];
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
        const secTitle = visibleSections.find(s => s.id === secId)?.title || secId;
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

    const typeLabel = scoresheetType === 'sensory' ? 'sensory' : 'technical';
    doc.save(`national_finals_${typeLabel}_${participantName}_${Date.now()}.pdf`);
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

  // Only show section breakdowns with actual scored items (not time-only sections)
  const scoredSections = visibleSections.filter(s => (sectionMax[s.id] || 0) > 0);

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
              <h1 className="text-3xl font-bold mb-1">
                National Finals - {scoresheetType === 'sensory' ? 'Sensory' : 'Technical'} Sheet
              </h1>
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
            {/* Scoresheet Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Scoresheet Type *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScoresheetType('technical')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    scoresheetType === 'technical'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Technical
                </button>
                <button
                  type="button"
                  onClick={() => setScoresheetType('sensory')}
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    scoresheetType === 'sensory'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Sensory
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Start Time – sensory only (technical has time items within sections) */}
        {scoresheetType === 'sensory' && (
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
        )}

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
            {scoredSections.map(sec => (
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
        {visibleSections.map((sec) => (
          <div key={sec.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            {sec.title && (
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                  {sec.title}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    {sec.items.filter(i => i.w > 0).length} item{sec.items.filter(i => i.w > 0).length !== 1 ? 's' : ''}
                  </span>
                  {(sectionMax[sec.id] || 0) > 0 && (
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {sectionScores[sec.id] || 0}/{sectionMax[sec.id] || 0}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {sec.items.map((it) => {
                const key = `${sec.id}_${it.id}`;
                const isTimeField = TIME_ITEM_IDS.includes(it.id);
                const isBeverageName = it.id === 'BeverageName';
                const isRecipeCheck = it.id === 'Shot0';

                // Beverage name → select dropdown
                if (isBeverageName) {
                  return (
                    <div key={key} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="font-medium text-gray-900 dark:text-slate-100">{it.q}</span>
                        <select
                          value={resp[key] || ''}
                          onChange={e => handleOption(sec, it, e.target.value)}
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

                // Time fields → capture button
                if (isTimeField) {
                  return (
                    <div key={key} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-slate-100">{it.q}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCaptureTimeForItem(sec, it)}
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
                      </div>
                    </div>
                  );
                }

                // Recipe check → simple text field
                if (isRecipeCheck) {
                  return (
                    <div key={key} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="font-medium text-gray-900 dark:text-slate-100">{it.q}</span>
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
                    </div>
                  );
                }

                // Normal scored items → Yes / No / NA
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

        {/* End Time – sensory only */}
        {scoresheetType === 'sensory' && (
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
        )}

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
