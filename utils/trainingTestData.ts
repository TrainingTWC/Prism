// Training Audit Test Data Generator
// This generates sample data for testing the Training Audit Dashboard

export const generateTrainingTestData = () => {
  const regions = ['North', 'South', 'West'];
  const trainers = [
    { id: 'T001', name: 'John Trainer' },
    { id: 'T002', name: 'Sarah Wilson' },
    { id: 'T003', name: 'Mike Johnson' },
    { id: 'T004', name: 'Lisa Chen' }
  ];
  const ams = [
    { id: 'AM001', name: 'Area Manager 1' },
    { id: 'AM002', name: 'Area Manager 2' },
    { id: 'AM003', name: 'Area Manager 3' }
  ];
  const stores = [
    { id: 'S001', name: 'Store Alpha' },
    { id: 'S002', name: 'Store Beta' },
    { id: 'S003', name: 'Store Gamma' },
    { id: 'S004', name: 'Store Delta' }
  ];

  const testData = [];

  for (let i = 0; i < 10; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const trainer = trainers[Math.floor(Math.random() * trainers.length)];
    const am = ams[Math.floor(Math.random() * ams.length)];
    const store = stores[Math.floor(Math.random() * stores.length)];
    
    const baseScore = 60 + Math.random() * 35; // Score between 60-95%
    const totalScore = Math.round(baseScore);
    const maxScore = 100;
    
    const submission = {
      submissionTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      trainerName: trainer.name,
      trainerId: trainer.id,
      amName: am.name,
      amId: am.id,
      storeName: store.name,
      storeId: store.id,
      region: region,
      mod: 'Manager ' + (i + 1),
      totalScore: totalScore.toString(),
      maxScore: maxScore.toString(),
      percentageScore: totalScore.toString(),
      
      // Training Materials (TM_1 to TM_9) - Yes/No questions
      TM_1: Math.random() > 0.3 ? 'yes' : 'no',
      TM_2: Math.random() > 0.3 ? 'yes' : 'no',
      TM_3: Math.random() > 0.3 ? 'yes' : 'no',
      TM_4: Math.random() > 0.3 ? 'yes' : 'no',
      TM_5: Math.random() > 0.3 ? 'yes' : 'no',
      TM_6: Math.random() > 0.3 ? 'yes' : 'no',
      TM_7: Math.random() > 0.3 ? 'yes' : 'no',
      TM_8: Math.random() > 0.3 ? 'yes' : 'no',
      TM_9: Math.random() > 0.3 ? 'yes' : 'no',
      
      // LMS Usage (LMS_1 to LMS_3)
      LMS_1: Math.random() > 0.2 ? 'yes' : 'no',
      LMS_2: Math.random() > 0.2 ? 'yes' : 'no',
      LMS_3: Math.random() > 0.2 ? 'yes' : 'no',
      
      // Buddy Trainer (Buddy_1 to Buddy_6)
      Buddy_1: Math.random() > 0.3 ? 'yes' : 'no',
      Buddy_2: Math.random() > 0.3 ? 'yes' : 'no',
      Buddy_3: Math.random() > 0.3 ? 'yes' : 'no',
      Buddy_4: Math.random() > 0.3 ? 'yes' : 'no',
      Buddy_5: Math.random() > 0.3 ? 'yes' : 'no',
      Buddy_6: Math.random() > 0.3 ? 'yes' : 'no',
      
      // New Joiner Training (NJ_1 to NJ_7)
      NJ_1: Math.random() > 0.3 ? 'yes' : 'no',
      NJ_2: Math.random() > 0.3 ? 'yes' : 'no',
      NJ_3: Math.random() > 0.3 ? 'yes' : 'no',
      NJ_4: Math.random() > 0.3 ? 'yes' : 'no',
      NJ_5: Math.random() > 0.3 ? 'yes' : 'no',
      NJ_6: Math.random() > 0.3 ? 'yes' : 'no',
      NJ_7: Math.random() > 0.3 ? 'yes' : 'no',
      
      // Partner Knowledge (PK_1 to PK_7)
      PK_1: Math.random() > 0.3 ? 'yes' : 'no',
      PK_2: ['Excellent', 'Good', 'Poor'][Math.floor(Math.random() * 3)],
      PK_3: Math.random() > 0.3 ? 'yes' : 'no',
      PK_4: Math.random() > 0.3 ? 'yes' : 'no',
      PK_5: Math.random() > 0.3 ? 'yes' : 'no',
      PK_6: Math.random() > 0.3 ? 'yes' : 'no',
      PK_7: 'Knowledge check completed successfully',
      
      // TSA - Training Skill Assessment (TSA_1 to TSA_3) - Numerical scores
      TSA_1: (6 + Math.random() * 4).toFixed(1), // Score between 6-10
      TSA_2: (6 + Math.random() * 4).toFixed(1),
      TSA_3: (6 + Math.random() * 4).toFixed(1),
      
      // Customer Experience (CX_1 to CX_9)
      CX_1: Math.random() > 0.3 ? 'yes' : 'no',
      CX_2: Math.random() > 0.3 ? 'yes' : 'no',
      CX_3: Math.random() > 0.3 ? 'yes' : 'no',
      CX_4: Math.random() > 0.3 ? 'yes' : 'no',
      CX_5: Math.random() > 0.3 ? 'yes' : 'no',
      CX_6: Math.random() > 0.3 ? 'yes' : 'no',
      CX_7: Math.random() > 0.3 ? 'yes' : 'no',
      CX_8: Math.random() > 0.3 ? 'yes' : 'no',
      CX_9: ['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)],
      
      // Action Plan (AP_1 to AP_3)
      AP_1: 'Immediate training improvements needed',
      AP_2: 'Long-term development plan established',
      AP_3: 'Follow-up scheduled for next month'
    };
    
    testData.push(submission);
  }
  
  return testData;
};