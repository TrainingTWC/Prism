
export interface Choice {
  label: string;
  score: number;
}

export interface Question {
  id: string;
  title: string;
  type: 'radio' | 'input' | 'textarea' | 'scale';
  choices?: Choice[];
}

export interface Submission {
  submissionTime: string;
  hrName: string;
  hrId: string;
  amName: string;
  amId: string;
  empName: string;
  empId: string;
  storeName: string;
  storeID: string;
  region?: string;
  q1: string;
  q1_remarks?: string;
  q2: string;
  q2_remarks?: string;
  q3: string;
  q3_remarks?: string;
  q4: string;
  q4_remarks?: string;
  q5: string;
  q5_remarks?: string;
  q6: string;
  q6_remarks?: string;
  q7: string;
  q7_remarks?: string;
  q8: string;
  q8_remarks?: string;
  q9: string;
  q9_remarks?: string;
  q10: string;
  q10_remarks?: string;
  q11: string;
  q11_remarks?: string;
  q12: string;
  q12_remarks?: string;
  totalScore: number;
  maxScore: number;
  percent: number;
}

export interface Store {
  name: string;
  id: string;
  region?: string;
}

export interface AreaManager {
  name: string;
  id: string;
}

export interface HRPerson {
  name: string;
  id: string;
}
