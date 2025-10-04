// Static Training Audit test data for development
// This avoids re-render loops and provides consistent test data

export const STATIC_TRAINING_DATA = [
  {
    submissionTime: '2024-12-15T10:30:00Z',
    trainerName: 'John Trainer',
    trainerId: 'T001',
    amName: 'Area Manager North',
    amId: 'AM001',
    storeName: 'Store Alpha North',
    storeId: 'S153',
    region: 'North',
    mod: 'Manager Alice',
    totalScore: '85',
    maxScore: '100',
    percentageScore: '85',
    
    // Training Materials (TM_1 to TM_9)
    TM_1: 'yes', TM_2: 'yes', TM_3: 'yes', TM_4: 'no', TM_5: 'yes',
    TM_6: 'yes', TM_7: 'no', TM_8: 'yes', TM_9: 'yes',
    
    // LMS Usage (LMS_1 to LMS_3)
    LMS_1: 'yes', LMS_2: 'no', LMS_3: 'yes',
    
    // Buddy Trainer (Buddy_1 to Buddy_6)
    Buddy_1: 'yes', Buddy_2: 'yes', Buddy_3: 'no', Buddy_4: 'yes', Buddy_5: 'yes', Buddy_6: 'no',
    
    // New Joiner Training (NJ_1 to NJ_7)
    NJ_1: 'yes', NJ_2: 'yes', NJ_3: 'yes', NJ_4: 'no', NJ_5: 'yes', NJ_6: 'yes', NJ_7: 'no',
    
    // Partner Knowledge (PK_1 to PK_7)
    PK_1: 'yes', PK_2: 'Excellent', PK_3: 'yes', PK_4: 'yes', PK_5: 'no', PK_6: 'yes', 
    PK_7: 'Knowledge check completed successfully',
    
    // TSA - Training Skill Assessment (TSA_1 to TSA_3)
    TSA_1: '8.5', TSA_2: '7.2', TSA_3: '9.1',
    
    // TSA Score mapping for modal display
    tsaCoffeeScore: '8.5',  // Maps to TSA_1 (Hot & Cold stations work)
    tsaFoodScore: '7.2',    // Maps to TSA_2 (Food station cleanliness)
    tsaCXScore: '9.1',      // Maps to TSA_3 (Customer Service quality)
    
    // Customer Experience (CX_1 to CX_9)
    CX_1: 'yes', CX_2: 'yes', CX_3: 'no', CX_4: 'yes', CX_5: 'yes', 
    CX_6: 'yes', CX_7: 'yes', CX_8: 'no', CX_9: 'Good',
    
    // Action Plan (AP_1 to AP_3)
    AP_1: 'Improve training materials display',
    AP_2: 'Schedule additional LMS training',
    AP_3: 'Follow-up in 2 weeks'
  },
  {
    submissionTime: '2024-12-14T14:20:00Z',
    trainerName: 'Sarah Wilson',
    trainerId: 'T002',
    amName: 'Area Manager South',
    amId: 'AM002',
    storeName: 'Store Beta South',
    storeId: 'S089',
    region: 'South',
    mod: 'Manager Bob',
    totalScore: '92',
    maxScore: '100',
    percentageScore: '92',
    
    // Training Materials (TM_1 to TM_9)
    TM_1: 'yes', TM_2: 'yes', TM_3: 'yes', TM_4: 'yes', TM_5: 'yes',
    TM_6: 'yes', TM_7: 'yes', TM_8: 'yes', TM_9: 'no',
    
    // LMS Usage (LMS_1 to LMS_3)
    LMS_1: 'yes', LMS_2: 'yes', LMS_3: 'yes',
    
    // Buddy Trainer (Buddy_1 to Buddy_6)
    Buddy_1: 'yes', Buddy_2: 'yes', Buddy_3: 'yes', Buddy_4: 'yes', Buddy_5: 'yes', Buddy_6: 'yes',
    
    // New Joiner Training (NJ_1 to NJ_7)
    NJ_1: 'yes', NJ_2: 'yes', NJ_3: 'yes', NJ_4: 'yes', NJ_5: 'yes', NJ_6: 'yes', NJ_7: 'yes',
    
    // Partner Knowledge (PK_1 to PK_7)
    PK_1: 'yes', PK_2: 'Excellent', PK_3: 'yes', PK_4: 'yes', PK_5: 'yes', PK_6: 'yes', 
    PK_7: 'All knowledge areas covered excellently',
    
    // TSA - Training Skill Assessment (TSA_1 to TSA_3)
    TSA_1: '9.2', TSA_2: '9.0', TSA_3: '9.5',
    
    // TSA Score mapping for modal display
    tsaCoffeeScore: '9.2',  // Maps to TSA_1 (Hot & Cold stations work)
    tsaFoodScore: '9.0',    // Maps to TSA_2 (Food station cleanliness)
    tsaCXScore: '9.5',      // Maps to TSA_3 (Customer Service quality)
    
    // Customer Experience (CX_1 to CX_9)
    CX_1: 'yes', CX_2: 'yes', CX_3: 'yes', CX_4: 'yes', CX_5: 'yes', 
    CX_6: 'yes', CX_7: 'yes', CX_8: 'yes', CX_9: 'Excellent',
    
    // Action Plan (AP_1 to AP_3)
    AP_1: 'Continue excellent practices',
    AP_2: 'Share best practices with other stores',
    AP_3: 'Monthly review scheduled'
  },
  {
    submissionTime: '2024-12-13T09:45:00Z',
    trainerName: 'Mike Johnson',
    trainerId: 'T003',
    amName: 'Area Manager West',
    amId: 'AM003',
    storeName: 'Store Gamma West',
    storeId: 'S176',
    region: 'West',
    mod: 'Manager Carol',
    totalScore: '78',
    maxScore: '100',
    percentageScore: '78',
    
    // Training Materials (TM_1 to TM_9)
    TM_1: 'yes', TM_2: 'no', TM_3: 'yes', TM_4: 'yes', TM_5: 'no',
    TM_6: 'yes', TM_7: 'yes', TM_8: 'no', TM_9: 'yes',
    
    // LMS Usage (LMS_1 to LMS_3)
    LMS_1: 'no', LMS_2: 'yes', LMS_3: 'yes',
    
    // Buddy Trainer (Buddy_1 to Buddy_6)
    Buddy_1: 'no', Buddy_2: 'yes', Buddy_3: 'yes', Buddy_4: 'no', Buddy_5: 'yes', Buddy_6: 'yes',
    
    // New Joiner Training (NJ_1 to NJ_7)
    NJ_1: 'yes', NJ_2: 'no', NJ_3: 'yes', NJ_4: 'yes', NJ_5: 'no', NJ_6: 'yes', NJ_7: 'yes',
    
    // Partner Knowledge (PK_1 to PK_7)
    PK_1: 'no', PK_2: 'Good', PK_3: 'yes', PK_4: 'no', PK_5: 'yes', PK_6: 'yes', 
    PK_7: 'Some areas need improvement',
    
    // TSA - Training Skill Assessment (TSA_1 to TSA_3)
    TSA_1: '7.8', TSA_2: '6.5', TSA_3: '8.0',
    
    // TSA Score mapping for modal display
    tsaCoffeeScore: '7.8',  // Maps to TSA_1 (Hot & Cold stations work)
    tsaFoodScore: '6.5',    // Maps to TSA_2 (Food station cleanliness)
    tsaCXScore: '8.0',      // Maps to TSA_3 (Customer Service quality)
    
    // Customer Experience (CX_1 to CX_9)
    CX_1: 'yes', CX_2: 'no', CX_3: 'yes', CX_4: 'no', CX_5: 'yes', 
    CX_6: 'no', CX_7: 'yes', CX_8: 'yes', CX_9: 'Average',
    
    // Action Plan (AP_1 to AP_3)
    AP_1: 'Focus on LMS completion',
    AP_2: 'Improve buddy trainer certification',
    AP_3: 'Weekly progress reviews'
  },
  {
    submissionTime: '2024-12-12T16:15:00Z',
    trainerName: 'Lisa Chen',
    trainerId: 'T004',
    amName: 'Area Manager North',
    amId: 'AM001',
    storeName: 'Store Delta North',
    storeId: 'S195',
    region: 'North',
    mod: 'Manager David',
    totalScore: '88',
    maxScore: '100',
    percentageScore: '88',
    
    // Training Materials (TM_1 to TM_9)
    TM_1: 'yes', TM_2: 'yes', TM_3: 'yes', TM_4: 'yes', TM_5: 'yes',
    TM_6: 'no', TM_7: 'yes', TM_8: 'yes', TM_9: 'yes',
    
    // LMS Usage (LMS_1 to LMS_3)
    LMS_1: 'yes', LMS_2: 'yes', LMS_3: 'no',
    
    // Buddy Trainer (Buddy_1 to Buddy_6)
    Buddy_1: 'yes', Buddy_2: 'yes', Buddy_3: 'yes', Buddy_4: 'yes', Buddy_5: 'no', Buddy_6: 'yes',
    
    // New Joiner Training (NJ_1 to NJ_7)
    NJ_1: 'yes', NJ_2: 'yes', NJ_3: 'no', NJ_4: 'yes', NJ_5: 'yes', NJ_6: 'yes', NJ_7: 'yes',
    
    // Partner Knowledge (PK_1 to PK_7)
    PK_1: 'yes', PK_2: 'Good', PK_3: 'yes', PK_4: 'yes', PK_5: 'yes', PK_6: 'no', 
    PK_7: 'Good overall knowledge with minor gaps',
    
    // TSA - Training Skill Assessment (TSA_1 to TSA_3)
    TSA_1: '8.8', TSA_2: '8.2', TSA_3: '8.5',
    
    // Customer Experience (CX_1 to CX_9)
    CX_1: 'yes', CX_2: 'yes', CX_3: 'yes', CX_4: 'yes', CX_5: 'no', 
    CX_6: 'yes', CX_7: 'yes', CX_8: 'yes', CX_9: 'Good',
    
    // Action Plan (AP_1 to AP_3)
    AP_1: 'Address LMS communication usage',
    AP_2: 'Improve promotional materials display',
    AP_3: 'Bi-weekly follow-ups scheduled'
  },
  {
    submissionTime: '2024-12-11T11:30:00Z',
    trainerName: 'John Trainer',
    trainerId: 'T001',
    amName: 'Area Manager South',
    amId: 'AM002',
    storeName: 'Store Echo South',
    storeId: 'S091',
    region: 'South',
    mod: 'Manager Eva',
    totalScore: '95',
    maxScore: '100',
    percentageScore: '95',
    
    // Training Materials (TM_1 to TM_9)
    TM_1: 'yes', TM_2: 'yes', TM_3: 'yes', TM_4: 'yes', TM_5: 'yes',
    TM_6: 'yes', TM_7: 'yes', TM_8: 'yes', TM_9: 'yes',
    
    // LMS Usage (LMS_1 to LMS_3)
    LMS_1: 'yes', LMS_2: 'yes', LMS_3: 'yes',
    
    // Buddy Trainer (Buddy_1 to Buddy_6)
    Buddy_1: 'yes', Buddy_2: 'yes', Buddy_3: 'yes', Buddy_4: 'yes', Buddy_5: 'yes', Buddy_6: 'yes',
    
    // New Joiner Training (NJ_1 to NJ_7)
    NJ_1: 'yes', NJ_2: 'yes', NJ_3: 'yes', NJ_4: 'yes', NJ_5: 'yes', NJ_6: 'no', NJ_7: 'yes',
    
    // Partner Knowledge (PK_1 to PK_7)
    PK_1: 'yes', PK_2: 'Excellent', PK_3: 'yes', PK_4: 'yes', PK_5: 'yes', PK_6: 'yes', 
    PK_7: 'Outstanding knowledge across all areas',
    
    // TSA - Training Skill Assessment (TSA_1 to TSA_3)
    TSA_1: '9.5', TSA_2: '9.3', TSA_3: '9.8',
    
    // Customer Experience (CX_1 to CX_9)
    CX_1: 'yes', CX_2: 'yes', CX_3: 'yes', CX_4: 'yes', CX_5: 'yes', 
    CX_6: 'yes', CX_7: 'yes', CX_8: 'yes', CX_9: 'Excellent',
    
    // Action Plan (AP_1 to AP_3)
    AP_1: 'Maintain current excellence',
    AP_2: 'Document best practices for replication',
    AP_3: 'Quarterly excellence reviews'
  }
];