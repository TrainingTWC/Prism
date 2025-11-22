/**
 * Campus Hiring Questions Bank
 * Complete list of all 30 questions with full text and options
 * Used for PDF report generation to show full question details
 */

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
    text: 'A cook uses a mixture where the ratio of flour to sugar is (x+2):(x-1). If the mixture weighs 21 kg and sugar is 6 kg, find x.',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '1', weight: 1 },
      B: { text: '2', weight: 1 },
      C: { text: '3', weight: 1 },
      D: { text: '4', weight: 3 }
    }
  },
  {
    id: 'Q12',
    text: 'A hotel invests Rs.20,000 at 10% compound interest, compounded annually for 3 years. Amount earned?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: 'Rs.24,200', weight: 1 },
      B: { text: 'Rs.26,620', weight: 3 },
      C: { text: 'Rs.26,000', weight: 1 },
      D: { text: 'Rs.27,300', weight: 1 }
    }
  },
  {
    id: 'Q13',
    text: '40% of the guests ordered breakfast. If there were 300 guests, how many ordered breakfast?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '100', weight: 1 },
      B: { text: '120', weight: 3 },
      C: { text: '140', weight: 1 },
      D: { text: '160', weight: 1 }
    }
  },
  {
    id: 'Q14',
    text: 'A dish costs Rs.250 to prepare and is sold at 20% profit. Selling price?',
    category: 'Numerical Aptitude',
    options: {
      A: { text: 'Rs.270', weight: 1 },
      B: { text: 'Rs.275', weight: 1 },
      C: { text: 'Rs.300', weight: 3 },
      D: { text: 'Rs.320', weight: 1 }
    }
  },
  {
    id: 'Q15',
    text: 'Two waiters can set 30 tables in 3 hours. How many tables can one waiter set in 2 hours? (They work at the same rate.)',
    category: 'Numerical Aptitude',
    options: {
      A: { text: '5', weight: 1 },
      B: { text: '10', weight: 3 },
      C: { text: '15', weight: 1 },
      D: { text: '20', weight: 1 }
    }
  },

  // ========== CATEGORY 4: LOGICAL REASONING (5 questions) ==========
  {
    id: 'Q16',
    text: 'Circular Seating Arrangement: Six guests A, B, C, D, E, F sit around a circular table facing the center. B sits second to the right of A. E is not adjacent to B. C sits opposite A. F is to the immediate left of C. Who sits to the immediate right of D?',
    category: 'Logical Reasoning',
    options: {
      A: { text: 'A', weight: 1 },
      B: { text: 'B', weight: 1 },
      C: { text: 'E', weight: 3 },
      D: { text: 'F', weight: 1 }
    }
  },
  {
    id: 'Q17',
    text: 'Puzzle (Hotel Room Allocation): Four guests (P, Q, R, S) booked four rooms (101, 102, 103, 104). Q does not stay in 101 or 102. R stays in an odd-numbered room. S stays immediately next to Q. P does not stay in 104. Where does R stay?',
    category: 'Logical Reasoning',
    options: {
      A: { text: '101', weight: 1 },
      B: { text: '103', weight: 3 },
      C: { text: '104', weight: 1 },
      D: { text: 'Cannot be determined', weight: 1 }
    }
  },
  {
    id: 'Q18',
    text: 'Logical Deduction (Syllogism): Statements: (1) All chefs are trained professionals. (2) Some trained professionals are management graduates. (3) No management graduate is untrained. Conclusions: I. Some chefs may be management graduates. II. No chef is untrained. Which follows?',
    category: 'Logical Reasoning',
    options: {
      A: { text: 'Only I follows', weight: 1 },
      B: { text: 'Only II follows', weight: 1 },
      C: { text: 'Both I and II follow', weight: 3 },
      D: { text: 'Neither follows', weight: 1 }
    }
  },
  {
    id: 'Q19',
    text: 'Coding-Decoding: In a certain code: SERVICE to TFWVJHK (Each letter is converted using different +/- positions). How is QUALITY coded if the pattern continues?',
    category: 'Logical Reasoning',
    options: {
      A: { text: 'RVCPNKZ', weight: 3 },
      B: { text: 'RVDQMJZ', weight: 1 },
      C: { text: 'RBENLJX', weight: 1 },
      D: { text: 'RVCOLKZ', weight: 1 }
    }
  },
  {
    id: 'Q20',
    text: 'Direction Sense: A steward walks 6 m north, 8 m east, 6 m south. How far is he from the starting point?',
    category: 'Logical Reasoning',
    options: {
      A: { text: '4 m', weight: 3 },
      B: { text: '6 m', weight: 1 },
      C: { text: '8 m', weight: 1 },
      D: { text: '10 m', weight: 1 }
    }
  },

  // ========== CATEGORY 5: ANALYTICAL APTITUDE (5 questions) ==========
  {
    id: 'Q21',
    text: 'Aditya walked 15 m towards south and took a right turn and walked 3 m, he took a right turn again and walked 15 m before stopping. Which direction did he face?',
    category: 'Analytical Aptitude',
    options: {
      A: { text: 'East', weight: 1 },
      B: { text: 'West', weight: 1 },
      C: { text: 'North', weight: 3 },
      D: { text: 'South', weight: 1 }
    }
  },
  {
    id: 'Q22',
    text: 'A bag contains Rs.30 which is in the form of 50 paisa, 1 Rs and 2 Rs coins. The ratio of their number is 4:2:1. How many 50 paisa coins are there?',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '20', weight: 3 },
      B: { text: '10', weight: 1 },
      C: { text: '5', weight: 1 },
      D: { text: '15', weight: 1 }
    }
  },
  {
    id: 'Q23',
    text: 'A shopkeeper selling his goods at 7% loss. Had he sold it for Rs.800 more, then he would get 9% profit. Find the CP of that article.',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '500', weight: 1 },
      B: { text: '4000', weight: 1 },
      C: { text: '6000', weight: 1 },
      D: { text: '5000', weight: 3 }
    }
  },
  {
    id: 'Q24',
    text: 'Find the number of triangles in the given figure.',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '8', weight: 1 },
      B: { text: '10', weight: 1 },
      C: { text: '12', weight: 1 },
      D: { text: '14', weight: 3 }
    }
  },
  {
    id: 'Q25',
    text: 'Count the number of triangles and squares in the given figure.',
    category: 'Analytical Aptitude',
    options: {
      A: { text: '36 triangles, 7 squares', weight: 1 },
      B: { text: '38 triangles, 9 squares', weight: 1 },
      C: { text: '40 triangles, 7 squares', weight: 3 },
      D: { text: '42 triangles, 9 squares', weight: 1 }
    }
  },

  // ========== CATEGORY 6: COURSE CURRICULUM (5 questions) ==========
  {
    id: 'Q26',
    text: 'What falls in the danger zone?',
    category: 'Course Curriculum',
    options: {
      A: { text: '1-5 degree Celsius', weight: 1 },
      B: { text: '22-58 degree Celsius', weight: 3 },
      C: { text: '65-80 degree Celsius', weight: 1 },
      D: { text: '2-4 degree Celsius', weight: 1 }
    }
  },
  {
    id: 'Q27',
    text: 'The two parts of HACCP include:',
    category: 'Course Curriculum',
    options: {
      A: { text: 'Hazard analysis and critical control points', weight: 3 },
      B: { text: 'Health analysis and critical control points', weight: 1 },
      C: { text: 'Hazard analysis and critical conformation production', weight: 1 },
      D: { text: 'Health analysis and critical conformation production', weight: 1 }
    }
  },
  {
    id: 'Q28',
    text: 'What is The Third Wave Movement of coffee about?',
    category: 'Course Curriculum',
    options: {
      A: { text: 'Bean to cup', weight: 3 },
      B: { text: 'Flavoured coffee', weight: 1 },
      C: { text: 'Farm to cup', weight: 1 },
      D: { text: 'Monetization of coffee', weight: 1 }
    }
  },
  {
    id: 'Q29',
    text: 'Which ISO standard is applicable for the QSR industry?',
    category: 'Course Curriculum',
    options: {
      A: { text: 'ISO 9001', weight: 3 },
      B: { text: 'ISO 22001', weight: 1 },
      C: { text: 'ISO 22000', weight: 1 },
      D: { text: 'ISO 27001', weight: 1 }
    }
  },
  {
    id: 'Q30',
    text: 'Which of these is not a type of contamination?',
    category: 'Course Curriculum',
    options: {
      A: { text: 'Biological contamination', weight: 1 },
      B: { text: 'Chemical contamination', weight: 1 },
      C: { text: 'Physical contamination', weight: 1 },
      D: { text: 'Mental contamination', weight: 3 }
    }
  }
];
