
import { Question, Store, AreaManager, HRPerson } from './types';
import { MAPPED_STORES } from './mappedStores';

export const QUESTIONS: Question[] = [
    { id: 'q1', title: 'Is there any work pressure in the café?', type: 'radio', choices: [
      {label: 'Every time', score: 1}, {label: 'Most of the time', score:2}, {label: 'Sometime', score:3}, {label: 'At Time', score:4}, {label: 'Never', score:5}
    ]},
    { id: 'q2', title: 'Are you empowered to make decisions on the spot to help customers and immediately solve their problems/complaints?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q3', title: 'Do you receive regular performance reviews and constructive feedback from your SM / AM ?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q4', title: 'Do you think there is any partiality or unfair treatment within team ?', type: 'radio', choices: [
      {label: 'Every time', score:1}, {label: 'Most of the time', score:2}, {label: 'Sometime', score:3}, {label: 'At Time', score:4}, {label: 'Never', score:5}
    ]},
    { id: 'q5', title: 'Are you getting the training as per Wings program? What was the last training you got and when ?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q6', title: 'Are you facing any issues with operational Apps ( Zing, Meal benefit, Jify ) or any issues with PF, ESI, Reimbursements,Insurance & Payslips', type: 'radio', choices: [
      {label: 'Every time', score:1}, {label: 'Most of the time', score:2}, {label: 'Sometime', score:3}, {label: 'At Time', score:4}, {label: 'Never', score:5}
    ]},
    { id: 'q7', title: 'Have you gone through the HR Handbook on Zing / Accepted all the policies?', type: 'radio', choices: [
      {label: 'Excellent', score:5}, {label: 'Very Good', score:4}, {label: 'Good', score:3}, {label: 'Average', score:2}, {label: 'Poor', score:1}
    ]},
    { id: 'q8', title: 'Are you satisfied with your current work schedule - Working Hours, Breaks, Timings, Weekly Offs & Comp Offs ?', type: 'radio', choices: [
      {label: 'Every time', score:5}, {label: 'Most of the time', score:4}, {label: 'Sometime', score:3}, {label: 'At Time', score:2}, {label: 'Never', score:1}
    ]},
    { id: 'q9', title: 'How effectively does the team collaborate, and what factors contribute to that?', type: 'radio', choices: [
      {label: 'Excellent', score:5}, {label: 'Very Good', score:4}, {label: 'Good', score:3}, {label: 'Average', score:2}, {label: 'Poor', score:1}
    ]},
    { id: 'q10', title: 'Name one of your colleague who is very helpful on the floor', type: 'input' },
    { id: 'q11', title: 'Any suggestions or support required from the organization ?', type: 'textarea' },
    { id: 'q12', title: 'On a scale of 1 to 5 how do you rate your experience with TWC & why ?', type: 'radio', choices: [
      {label: 'Excellent', score:5}, {label: 'Very Good', score:4}, {label: 'Good', score:3}, {label: 'Average', score:2}, {label: 'Poor', score:1}
    ]}
];

export const AREA_MANAGERS: AreaManager[] = [
      { name: 'Abhishek', id: 'H3386' },
      { name: 'Ajay  H', id: 'H546' },
      { name: 'Ajay Omnath Tiwari', id: 'H1815' },
      { name: 'Amar', id: 'H535' },
      { name: 'Anil  Rawat', id: 'H2262' },
      { name: 'Umakanth', id: 'H3270' },
      { name: 'Himanshu', id: 'H955' },
      { name: 'Jagruti', id: 'H2155' },
      { name: 'Karthick  G', id: 'H3362' },
      { name: 'Kiran', id: 'H2601' },
      { name: 'Shailesh', id: 'H2908' },
      { name: 'Suresh  A', id: 'H1355' },
      { name: 'Vishal Vishwanath Khatakalle', id: 'H3184' },
      { name: 'Vishu', id: 'H1766' },
      { name: 'Vruchika', id: 'H1575' },
      { name: 'Nandish  M', id: 'H833' },
      { name: 'Atul', id: 'H2396' },
      { name: 'Sanjay', id: 'H2273' },
      { name: 'Rutuja', id: 'H2758' }
];

export const REGIONS = ['North', 'South', 'West'];

// Use the mapped stores from the HR mapping data
export const STORES: Store[] = MAPPED_STORES;

export const HR_PERSONNEL: HRPerson[] = [
    { name: 'Abhishek', id: 'H3578' },
    { name: 'Monica', id: 'H2165' },
    { name: 'Subin', id: 'H2761' },
    { name: 'Swati', id: 'H1972' },
    { name: 'Manasi', id: 'H3603' },
    { name: 'Sunil', id: 'H3247' },
    { name: 'Sarit', id: 'H2081' },
    { name: 'Pooja', id: 'HC002' },
    { name: 'Rohit Paul', id: 'H3551' },
    { name: 'Training Head', id: 'H3237' },
    { name: 'LMS Head', id: 'H541' }
];

// Senior HR roles that should have access to all Area Managers
export const SENIOR_HR_ROLES = ['H2081', 'H3237', 'H541']; // Sarit, Training Head, LMS Head
