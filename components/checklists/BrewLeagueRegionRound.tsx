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

// Checklist Data & Scoring
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
    title: '',
    items: [
      { id: 'DialInEndTime', q: 'Dial-In End time:', w: 0 }
    ]
  },
  // Milk Based Beverages
  {
    id: 'MilkBasedBeverages',
    title: 'Milk Based Beverages',
    items: [
      { id: 'BeverageName', q: 'Mention the name of the beverage that is asked to be prepared.', w: 0 },
      { id: 'StartTime', q: 'Start time:', w: 0 }
    ]
  },
  // Milk Based Beverages Cup-1
  {
    id: 'MilkCup1',
    title: 'Milk Based Beverages Cup-1',
    items: [
      { id: 'Cup1PreWarmed', q: 'Is the cup pre-warmed before extraction', w: 2 },
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
      { id: 'TapPitcher', q: 'Does the barista tap the pitcher to remove excess bubbles (if any)', w: 1 },
      { id: 'SwirlPitcher', q: 'Did the barista swirl the pitcher to ensure the milk and foam is well mixed', w: 1 },
      { id: 'LatteArt', q: 'Barista able to create latte art in the cup (Cappuccino- Heart , Latte- Tulip/ Rosetta , Flat white - Single dot in the centre )', w: 5 },
      { id: 'IdenticalArt', q: 'Did the 2 beverages presented have identical latte art', w: 5 },
      { id: 'NoSpillage', q: 'No spillage of espresso or milk on the outer part of the cup', w: 2 },
      { id: 'MilkWastage', q: 'Milk wastage less than 50ml', w: 3 },
      { id: 'CleanPitcherAfter', q: 'Did the barista clean the milk pitcher after use', w: 1 }
    ]
  },
  // Cup-2
  {
    id: 'MilkCup2',
    title: 'Cup-2',
    items: [
      { id: 'Cup2PreWarmed', q: 'Is the cup pre-warmed before extraction', w: 2 },
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
  // Cup-2 Steaming
  {
    id: 'Cup2Steaming',
    title: 'Cup-2 Steaming',
    items: [
      { id: 'SteamingExplain', q: 'Is the barista able to explain the milk steaming process', w: 2 },
      { id: 'SteamingPurged', q: 'Steaming wand is purged before use', w: 3 },
      { id: 'CleanPitcher', q: 'Is the Barista uses a clean milk pitcher for every order', w: 2 },
      { id: 'RightPitcher', q: 'Is the barista using the right milk pitcher for the intended beverage size', w: 3 },
      { id: 'ColdMilk', q: 'In the barista using cold milk stored in the chiller', w: 3 },
      { id: 'MilkPouch', q: 'Is the milk pouch stored in the 900ml pitcher', w: 1 },
      { id: 'RightMilkAmount', q: 'Is the barista taking the right amount of milk for the intended beverage size', w: 3 },
      { id: 'FoamConsistency', q: 'Is the barista able to create the right consistency of foam for a latte/ Cappuccino/Flat white', w: 3 },
      { id: 'SteamingWiped', q: 'Steaming wand is wiped & purged after use', w: 3 },
      { id: 'GreenClothSteam', q: 'Did the barista use the right green cloth to wipe the steam wand', w: 2 },
      { id: 'GreenClothStored', q: 'Did the barista store the green cloth in the GN pan after use', w: 1 }
    ]
  },
  // Cup-2 Pouring
  {
    id: 'Cup2Pouring',
    title: 'Cup-2 Pouring',
    items: [
      { id: 'TapPitcher', q: 'Does the barista tap the pitcher to remove excess bubbles (if any)', w: 1 },
      { id: 'SwirlPitcher', q: 'Did the barista swirl the pitcher to ensure the milk and foam is well mixed', w: 1 },
      { id: 'LatteArt', q: 'Barista able to create latte art in the cup (Cappuccino- Heart , Latte- Tulip/ Rosetta , Flat white - Single dot in the centre)', w: 5 },
      { id: 'NoSpillage', q: 'No spillage of espresso or milk on the outer part of the cup', w: 2 },
      { id: 'MilkWastage', q: 'Milk wastage less than 50ml', w: 3 },
      { id: 'CleanPitcherAfter', q: 'Did the barista clean the milk pitcher after use', w: 1 }
    ]
  },
  // Cup-3
  {
    id: 'MilkCup3',
    title: 'Cup-3',
    items: [
      { id: 'Cup3PreWarmed', q: 'Is the cup pre-warmed before extraction', w: 2 },
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
  // Cup-3 Steaming
  {
    id: 'Cup3Steaming',
    title: 'Cup-3 Steaming',
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
  // Cup-3 Pouring
  {
    id: 'Cup3Pouring',
    title: 'Cup-3 Pouring',
    items: [
      { id: 'TapPitcher', q: 'Does the barista tap the pitcher to remove excess bubbles (if any)', w: 1 },
      { id: 'SwirlPitcher', q: 'Did the barista swirl the pitcher to ensure the milk and foam is well mixed', w: 1 },
      { id: 'LatteArt', q: 'Barista able to create latte art in the cup (Cappuccino- Heart , Latte- Tulip/ Rosetta , Flat white - Single dot in the centre)', w: 5 },
      { id: 'NoSpillage', q: 'No spillage of espresso or milk on the outer part of the cup', w: 2 },
      { id: 'MilkWastage', q: 'Milk wastage less than 50ml', w: 3 },
      { id: 'CleanPitcherAfter', q: 'Did the barista clean the milk pitcher after use', w: 1 }
    ]
  },
  // End time and final questions
  {
    id: 'EndTime',
    title: 'Overall',
    items: [
      { id: 'EndTime', q: 'End time:', w: 0 },
      { id: 'CounterClean', q: 'Did the barista clean the counter before completing his/ Her routine', w: 5 },
      { id: 'CouponsRedeemed', q: "The coupons are redeemed from the participant's app", w: 0 }
    ]
  }
];

// Sensory-only simplified sections
const SENSORY_SECTIONS: ChecklistSection[] = [
  {
    id: 'SensoryScore',
    title: 'Sensory Sheet',
    items: [
      { id: 'BeverageName', q: 'Mention the name of the beverage that is asked to be prepared.', w: 0 },
      { id: 'LatteArtStd', q: 'Was the Latte art created as per TWC std (Cappuccino- Heart , Latte- Tulip/ Rosetta , Flat white - Single dot )', w: 5 },
      { id: 'ShinyGlossy', q: 'Was it shiny and glossy?', w: 3 },
      { id: 'NoBubbles', q: 'No visible bubbles on the surface', w: 3 },
      { id: 'ArtCentre', q: 'Is the latte art in the centre of the cup', w: 3 },
      { id: 'ContrastCrema', q: 'Is there a visible contrast between the crema and the latte art', w: 3 },
      { id: 'ArtFacing', q: 'Is the latte art facing the customer with the handle on the right side', w: 5 },
      { id: 'Cover70', q: 'Did the latte art cover 70% of the cup surface', w: 3 },
      { id: 'FrothLevel', q: 'Was the froth level present as per TWC standard (Three Swipes- cappuccino, Two Swipes- Latte & One swipe- Flatwhite)', w: 4 },
      { id: 'CupImage', q: 'Cup 1 and 2 - Image (All Together)', w: 0 },
      { id: 'Smile', q: 'Did the barista smile and have an engaging interaction with the judge', w: 3 },
      { id: 'CounterClean', q: 'Did the barista leave the counter clean after finishing his/her performance', w: 3 }
    ]
  }
];

const LOG_ENDPOINTS = [
  'https://script.google.com/macros/s/AKfycbxU1_r90HuttOrnGzpkZ47F2a5T20ZT-yGM0HBkOYWKeCgJEjXyaiPezj-Z33TUN-7oMg/exec'
];

const BrewLeagueRegionRound: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const judgeName = urlParams.get('judgeName') || urlParams.get('name') || '';
  const judgeId = urlParams.get('judgeId') || urlParams.get('EMPID') || '';
  
  // Employee directory for searchable dropdown
  const { directory: employeeDirectory, loading: employeeLoading } = useEmployeeDirectory();
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [resp, setResp] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('brewLeagueRegionResp');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [participantName, setParticipantName] = useState(() => localStorage.getItem('brewLeagueRegionParticipantName') || '');
  const [participantEmpID, setParticipantEmpID] = useState(() => localStorage.getItem('brewLeagueRegionParticipantEmpID') || '');
  const [storeName, setStoreName] = useState(() => localStorage.getItem('brewLeagueRegionStoreName') || '');
  const [storeID, setStoreID] = useState(() => localStorage.getItem('brewLeagueRegionStoreID') || '');
  const [region, setRegion] = useState(() => localStorage.getItem('brewLeagueRegionRegion') || '');
  const [imgs, setImgs] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('brewLeagueRegionImgs');
    return saved ? JSON.parse(saved) : {};
  });
  const [remarks, setRemarks] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('brewLeagueRegionRemarks');
    return saved ? JSON.parse(saved) : {};
  });
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scoresheetType, setScoresheetType] = useState<'technical' | 'sensory'>(() => {
    return (localStorage.getItem('brewLeagueRegionScoresheetType') as 'technical' | 'sensory') || 'technical';
  });
  const [machineType, setMachineType] = useState<'manual' | 'automatic'>(() => {
    return (localStorage.getItem('brewLeagueRegionMachineType') as 'manual' | 'automatic') || 'manual';
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('brewLeagueRegionResp', JSON.stringify(resp));
    localStorage.setItem('brewLeagueRegionParticipantName', participantName);
    localStorage.setItem('brewLeagueRegionParticipantEmpID', participantEmpID);
    localStorage.setItem('brewLeagueRegionStoreName', storeName);
    localStorage.setItem('brewLeagueRegionStoreID', storeID);
    localStorage.setItem('brewLeagueRegionRegion', region);
    localStorage.setItem('brewLeagueRegionImgs', JSON.stringify(imgs));
    localStorage.setItem('brewLeagueRegionRemarks', JSON.stringify(remarks));
  }, [resp, participantName, participantEmpID, storeName, storeID, imgs, remarks]);

  useEffect(() => {
    localStorage.setItem('brewLeagueRegionScoresheetType', scoresheetType);
  }, [scoresheetType]);

  useEffect(() => {
    localStorage.setItem('brewLeagueRegionMachineType', machineType);
  }, [machineType]);

  const getActiveSections = () => {
    if (scoresheetType === 'sensory') return SENSORY_SECTIONS;
    if (machineType === 'automatic') {
      const ids = ['GroomingHygiene', 'MilkBasedBeverages', 'Cup1Steaming', 'Cup1Pouring', 'Cup2Steaming', 'Cup2Pouring', 'Cup3Steaming', 'Cup3Pouring', 'EndTime'];
      return SECTIONS.filter(s => ids.includes(s.id));
    }
    const idsManual = ['GroomingHygiene', 'EspressoDialIn', 'EspressoDialInShot1', 'EspressoDialInShot2', 'DialInEndTime', 'MilkBasedBeverages', 'MilkCup1', 'Cup1Steaming', 'Cup1Pouring', 'MilkCup2', 'Cup2Steaming', 'Cup2Pouring', 'MilkCup3', 'Cup3Steaming', 'Cup3Pouring', 'EndTime'];
    return SECTIONS.filter(s => idsManual.includes(s.id));
  };

  const visibleSections = getActiveSections();

  const handleOption = (sec: ChecklistSection, it: ChecklistItem, val: string) => {
    const key = `${sec.id}_${it.id}`;
    setResp(p => ({ ...p, [key]: val }));
  };

  const handleTSA = (sec: ChecklistSection, it: ChecklistItem, val: string) => {
    const key = `${sec.id}_${it.id}`;
    setResp(p => ({ ...p, [key]: val }));
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

  const handleCaptureTime = (sec: ChecklistSection, it: ChecklistItem) => {
    const key = `${sec.id}_${it.id}`;
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setResp(prev => ({ ...prev, [key]: currentTime }));
  };

  const getTime = (secId: string, itemId: string) => {
    const sec = getActiveSections().find(s => s.id === secId);
    if (!sec) return '';
    const it = sec.items.find(i => i.id === itemId);
    if (!it) return '';
    return resp[`${secId}_${itemId}`] || '';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloading(true);
    setIsLoading(true);
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

    // Log to Google Sheets
    const data = new URLSearchParams({
      participantName,
      participantEmpID,
      judgeName,
      judgeId,
      scoresheetType,
      machineType,
      storeName,
      storeID,
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
      MilkCup3Score: (sectionScores.MilkCup3 || 0).toString(),
      Cup3SteamingScore: (sectionScores.Cup3Steaming || 0).toString(),
      Cup3PouringScore: (sectionScores.Cup3Pouring || 0).toString(),
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
    } catch (error) {
      console.error('Error logging to sheets:', error);
    }

    // Generate PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Brew League Score Sheet - Region Round', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Participant Name: ${participantName}`, 10, 25);
    doc.text(`Participant Emp. ID: ${participantEmpID}`, 10, 30);
    doc.text(`Judge Name: ${judgeName}`, 10, 35);
    doc.text(`Judge ID: ${judgeId}`, 10, 40);
    doc.text(`Scoresheet Type: ${scoresheetType}`, 10, 45);
    doc.text(`Machine Type: ${machineType}`, 10, 50);
    doc.text(`Date/Time: ${completion}`, 10, 55);
    doc.text(`Store Name: ${storeName}`, 10, 60);
    doc.text(`Store ID: ${storeID}`, 10, 65);
    doc.text(`Region: ${region}`, 10, 70);

    let y = 75;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Time taken for espresso: ${dialInTimeTaken}`, 105, y, { align: 'center' });
    y += 6;
    doc.text(`Time taken for milk based: ${milkTimeTaken}`, 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(15);
    doc.text(`Score: ${total} / ${max} (${pct}%)`, 105, y, { align: 'center' });
    y += 10;

    // Sections
    for (const sec of scoringSections) {
      doc.setDrawColor('#bdbdbd');
      doc.setLineWidth(0.7);
      doc.line(15, y, 195, y);
      y += 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`${sec.title} (Score: ${sectionScores[sec.id]} / ${sectionMax[sec.id]})`, 105, y + 8, { align: 'center' });

      autoTable(doc, {
        startY: y + 12,
        head: [['Question', 'Response', 'Score (Weightage)']],
        body: sec.items.map(it => {
          const key = `${sec.id}_${it.id}`;
          const r = resp[key];
          const respText = r === 'yes' ? 'Yes' : r === 'no' ? 'No' : r === 'na' ? 'NA' : r || '';
          let score, maxScore;
          if (r === 'yes') {
            score = it.w;
            maxScore = it.w;
          } else if (r === 'na') {
            score = 'NA';
            maxScore = it.w;
          } else {
            score = 0;
            maxScore = it.w;
          }
          const scoreDisplay = score === 'NA' ? `NA/${maxScore}` : `${score}/${maxScore}`;
          return [it.q, respText, scoreDisplay];
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
    const groomingImgs = imgs['GroomingHygiene'] || [];
    const sensoryImgs = imgs['SensoryScore'] || [];
    if (groomingImgs.length || sensoryImgs.length) {
      doc.addPage();
      let imgY = 20;
      if (groomingImgs.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Grooming & Hygiene Images', 40, imgY);
        let x = 15, y = imgY + 5;
        const imgW = 35, imgH = 35;
        groomingImgs.forEach((src, i) => {
          if (i && i % 4 === 0) { y += imgH + 8; x = 15; }
          doc.addImage(src, 'JPEG', x, y, imgW, imgH);
          x += imgW + 5;
        });
      }
      if (sensoryImgs.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Sensory Cup Images', 150, imgY);
        let x = 120, y = imgY + 5;
        const imgW = 35, imgH = 35;
        sensoryImgs.forEach((src, i) => {
          if (i && i % 4 === 0) { y += imgH + 8; x = 120; }
          doc.addImage(src, 'JPEG', x, y, imgW, imgH);
          x += imgW + 5;
        });
      }
    }

    doc.save(`brew_league_region_${participantName}_${Date.now()}.pdf`);
    setDownloading(false);
    setIsLoading(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to reset the scoresheet? All responses will be lost.')) {
      localStorage.removeItem('brewLeagueRegionResp');
      localStorage.removeItem('brewLeagueRegionParticipantName');
      localStorage.removeItem('brewLeagueRegionParticipantEmpID');
      localStorage.removeItem('brewLeagueRegionStoreName');
      localStorage.removeItem('brewLeagueRegionStoreID');
      localStorage.removeItem('brewLeagueRegionRegion');
      localStorage.removeItem('brewLeagueRegionImgs');
      localStorage.removeItem('brewLeagueRegionRemarks');
      setResp({});
      setParticipantName('');
      setParticipantEmpID('');
      setStoreName('');
      setStoreID('');
      setImgs({});
      setRemarks({});
    }
  };

  const handleNav = (id: string) => {
    setActiveSection(id);
    setTimeout(() => {
      const el = document.getElementById(`${id}-section`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

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
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Trophy size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Brew League - Region Round</h1>
              <p className="text-amber-100">Regional Competition Scoresheet</p>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Judge Name</label>
              <input 
                readOnly 
                value={judgeName} 
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-slate-100 cursor-not-allowed"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Name *</label>
              <input 
                value={storeName} 
                onChange={e => setStoreName(e.target.value)} 
                required 
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store ID *</label>
              <input 
                value={storeID} 
                onChange={e => setStoreID(e.target.value)} 
                required 
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Region *</label>
              <input 
                value={region} 
                onChange={e => setRegion(e.target.value)} 
                required 
                placeholder="e.g., North, South, East, West"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Machine Type *</label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setMachineType('manual')} 
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    machineType === 'manual' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Manual
                </button>
                <button 
                  type="button" 
                  onClick={() => setMachineType('automatic')} 
                  className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                    machineType === 'automatic' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                  }`}
                >
                  Automatic
                </button>
              </div>
            </div>
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

        {/* Sections */}
        {visibleSections.map((sec, idx) => (
          <div key={sec.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                {sec.title}
              </h3>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {sec.items.length} item{sec.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4">
              {sec.items.map((it, itIdx) => {
                const key = `${sec.id}_${it.id}`;
                const isTimeField = ['DialInStartTime', 'DialInEndTime', 'StartTime', 'EndTime'].includes(it.id);

                if (it.id === 'BeverageName') {
                  return (
                    <div key={key} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      {isTimeField ? (
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
                  className="block w-full text-sm text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-600 rounded-md cursor-pointer bg-white dark:bg-slate-800"
                />
                {imgs[sec.id] && imgs[sec.id].length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
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

export default BrewLeagueRegionRound;
