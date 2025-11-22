// Campus Hiring Assessment Questions - Exported for PDF Report Generation
export const CAMPUS_HIRING_QUESTIONS = [
  // ========== CATEGORY 1: PSYCHOMETRIC (5 questions) ==========
  {
    id: 'Q1',
    text: "Imagine you're explaining a new drink recipe to a teammate whose first language isn't English. You:",
    category: 'Psychometric',
    options: {
      A: { text: 'Repeat exactly what was told to you', weight: 1 },
      B: { text: 'Try to explain in simple words and gestures', weight: 2 },
      C: { text: "Ask them what part they didn't understand and explain accordingly", weight: 3 }
    }
  },
  {
    id: 'Q2',
    text: 'A drink consistently tastes off. You:',
    category: 'Psychometric',
    options: {
      A: { text: 'Remake it and hope it improves next time', weight: 1 },
      B: { text: 'Try adjusting the grind or recipe slightly', weight: 2 },
      C: { text: 'Document the issue and escalate it to the trainer', weight: 3 }
    }
  },
  {
    id: 'Q3',
    text: "Your team isn't following the cleaning checklist. You:",
    category: 'Psychometric',
    options: {
      A: { text: "Do it yourself without mentioning it", weight: 1 },
      B: { text: 'Remind them casually', weight: 2 },
      C: { text: 'Call a short huddle and reinforce expectations', weight: 3 }
    }
  },
  {
    id: 'Q4',
    text: 'A customer says their drink tastes "strange." You:',
    category: 'Psychometric',
    options: {
      A: { text: 'Say sorry and move on', weight: 1 },
      B: { text: 'Offer to remake it once', weight: 2 },
      C: { text: 'Ask specifics and tailor a solution', weight: 3 }
    }
  },
  {
    id: 'Q5',
    text: 'You find a wallet on the café floor. You:',
    category: 'Psychometric',
    options: {
      A: { text: 'Leave it at the counter', weight: 1 },
      B: { text: 'Keep it safe and note the time', weight: 2 },
      C: { text: 'Record it and report to shift lead', weight: 3 }
    }
  },

  // ========== CATEGORY 2: ENGLISH PROFICIENCY (5 questions) ==========
  {
    id: 'Q6',
    text: 'Which sentence is grammatically correct?',
    category: 'English Proficiency',
    options: {
      A: { text: 'The team are working hard.', weight: 1 },
      B: { text: 'The team is working hard.', weight: 3 },
      C: { text: 'The team were working hard.', weight: 2 }
    }
  },
  {
    id: 'Q7',
    text: 'Choose the correctly spelled word:',
    category: 'English Proficiency',
    options: {
      A: { text: 'Occured', weight: 1 },
      B: { text: 'Ocurred', weight: 1 },
      C: { text: 'Occurred', weight: 3 }
    }
  },
  {
    id: 'Q8',
    text: 'Select the sentence with proper punctuation:',
    category: 'English Proficiency',
    options: {
      A: { text: "Let's eat, Grandma!", weight: 3 },
      B: { text: "Lets eat Grandma!", weight: 1 },
      C: { text: "Let's eat Grandma!", weight: 1 }
    }
  },
  {
    id: 'Q9',
    text: 'What is the meaning of "proactive"?',
    category: 'English Proficiency',
    options: {
      A: { text: 'Reacting after something happens', weight: 1 },
      B: { text: 'Taking action in advance', weight: 3 },
      C: { text: 'Being professional', weight: 1 }
    }
  },
  {
    id: 'Q10',
    text: 'Complete the sentence: "Neither the manager ___ the team members were present."',
    category: 'English Proficiency',
    options: {
      A: { text: 'or', weight: 1 },
      B: { text: 'nor', weight: 3 },
      C: { text: 'and', weight: 1 }
    }
  },

  // ========== CATEGORY 3: NUMERICAL APTITUDE (5 questions) ==========
  {
    id: 'Q11',
    text: 'Solve: 2x + 5 = 15. What is x?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '5', weight: 3 },
      B: { text: '10', weight: 1 },
      C: { text: '7', weight: 1 }
    }
  },
  {
    id: 'Q12',
    text: 'What is 15% of 200?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '25', weight: 1 },
      B: { text: '30', weight: 3 },
      C: { text: '35', weight: 1 }
    }
  },
  {
    id: 'Q13',
    text: 'If a product costs ₹150 and is sold for ₹180, what is the profit percentage?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '15%', weight: 1 },
      B: { text: '20%', weight: 3 },
      C: { text: '25%', weight: 1 }
    }
  },
  {
    id: 'Q14',
    text: 'A café sells 120 cups of coffee daily. If 30% are espresso, how many espressos are sold?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '30', weight: 1 },
      B: { text: '36', weight: 3 },
      C: { text: '40', weight: 1 }
    }
  },
  {
    id: 'Q15',
    text: 'If 5 staff members prepare 100 drinks in 2 hours, how many drinks can 8 staff prepare in the same time?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '120', weight: 1 },
      B: { text: '150', weight: 1 },
      C: { text: '160', weight: 3 }
    }
  },

  // ========== CATEGORY 4: LOGICAL REASONING (5 questions) ==========
  {
    id: 'Q16',
    text: 'A, B, C, D, and E are sitting in a row. A is not at either end. C is sitting next to E. D is sitting at one end. Who is in the middle?',
    category: 'Logical Reasoning',
    options: {
      A: { text: 'A', weight: 3 },
      B: { text: 'B', weight: 1 },
      C: { text: 'C', weight: 1 }
    }
  },
  {
    id: 'Q17',
    text: 'Find the odd one out: Apple, Banana, Carrot, Mango',
    category: 'Logical Reasoning',
    options: {
      A: { text: 'Apple', weight: 1 },
      B: { text: 'Banana', weight: 1 },
      C: { text: 'Carrot', weight: 3 }
    }
  },
  {
    id: 'Q18',
    text: 'All managers are leaders. Some leaders are trainers. Conclusion: All managers are trainers.',
    category: 'Logical Reasoning',
    options: {
      A: { text: 'True', weight: 1 },
      B: { text: 'False', weight: 3 },
      C: { text: 'Cannot be determined', weight: 2 }
    }
  },
  {
    id: 'Q19',
    text: 'Complete the series: 2, 6, 12, 20, __',
    category: 'Logical Reasoning',
    options: {
      A: { text: '28', weight: 1 },
      B: { text: '30', weight: 3 },
      C: { text: '32', weight: 1 }
    }
  },
  {
    id: 'Q20',
    text: 'If "CAFE" is coded as "3165", what is "FACE" coded as?',
    category: 'Logical Reasoning',
    options: {
      A: { text: '6135', weight: 1 },
      B: { text: '6315', weight: 3 },
      C: { text: '1635', weight: 1 }
    }
  },

  // ========== CATEGORY 5: ANALYTICAL APTITUDE (5 questions) ==========
  {
    id: 'Q21',
    text: 'A person walks 5 km East, turns left walks 3 km, turns left again walks 5 km. How far is he from the starting point?',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '3 km', weight: 3 },
      B: { text: '5 km', weight: 1 },
      C: { text: '8 km', weight: 1 }
    }
  },
  {
    id: 'Q22',
    text: 'You have 3 coins: one always shows heads, one always shows tails, one is fair. You pick a coin at random and flip it - it shows heads. Probability it is the fair coin?',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '1/3', weight: 3 },
      B: { text: '1/2', weight: 1 },
      C: { text: '2/3', weight: 1 }
    }
  },
  {
    id: 'Q23',
    text: 'If you rearrange the letters "CIFAIPC", you get the name of a:',
    category: 'Analytical Aptitude',
    options: {
      A: { text: 'City', weight: 1 },
      B: { text: 'Ocean', weight: 3 },
      C: { text: 'Country', weight: 1 }
    }
  },
  {
    id: 'Q24',
    text: 'How many triangles are in the given figure? (See diagram)',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '12', weight: 1 },
      B: { text: '14', weight: 3 },
      C: { text: '16', weight: 1 }
    },
    image: '/Prism/assessment-images/q24-triangles.svg'
  },
  {
    id: 'Q25',
    text: 'Count the number of triangles and squares in the figure. (See diagram)',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '40 triangles, 7 squares', weight: 3 },
      B: { text: '38 triangles, 8 squares', weight: 1 },
      C: { text: '42 triangles, 6 squares', weight: 1 }
    },
    image: '/Prism/assessment-images/q25-triangles-squares.svg'
  },

  // ========== CATEGORY 6: COURSE CURRICULUM (5 questions) ==========
  {
    id: 'Q26',
    text: 'What does FIFO stand for in food safety?',
    category: 'Course Curriculum',
    options: {
      A: { text: 'First In, First Out', weight: 3 },
      B: { text: 'Food In, Food Out', weight: 1 },
      C: { text: 'Fresh In, Fresh Out', weight: 1 }
    }
  },
  {
    id: 'Q27',
    text: 'What is the ideal temperature for storing milk?',
    category: 'Course Curriculum',
    options: {
      A: { text: '0-4°C', weight: 3 },
      B: { text: '5-10°C', weight: 1 },
      C: { text: '10-15°C', weight: 1 }
    }
  },
  {
    id: 'Q28',
    text: 'HACCP stands for:',
    category: 'Course Curriculum',
    options: {
      A: { text: 'Hazard Analysis Critical Control Points', weight: 3 },
      B: { text: 'Health and Critical Control Points', weight: 1 },
      C: { text: 'Hygiene Analysis and Control Points', weight: 1 }
    }
  },
  {
    id: 'Q29',
    text: 'Which certification is internationally recognized for food safety management?',
    category: 'Course Curriculum',
    options: {
      A: { text: 'ISO 9001', weight: 1 },
      B: { text: 'ISO 22000', weight: 3 },
      C: { text: 'ISO 14001', weight: 1 }
    }
  },
  {
    id: 'Q30',
    text: 'What is cross-contamination?',
    category: 'Course Curriculum',
    options: {
      A: { text: 'Transfer of harmful bacteria from one food to another', weight: 3 },
      B: { text: 'Mixing different ingredients together', weight: 1 },
      C: { text: 'Using the same cutting board for everything', weight: 1 }
    }
  }
];
