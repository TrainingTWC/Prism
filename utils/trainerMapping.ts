/**
 * Trainer ID to Name Mapping Utility
 * 
 * This provides a centralized mapping of trainer IDs to full names
 * based on the employee_data.json file to ensure consistency across
 * all components and eliminate "Unknown" entries in dropdowns.
 */

export interface TrainerInfo {
  id: string;
  name: string;
}

// Centralized trainer name mapping based on employee_data.json
export const TRAINER_NAME_OVERRIDES: Record<string, string> = {
  H1278: 'Viraj Vijay Mahamunkar',
  H1697: 'Sheldon Antonio Xavier DSouza',
  H1761: 'Mahadev Nayak',
  H2155: 'Jagruti Narendra Bhanushali',
  H2595: 'Kailash Singh',
  H3247: 'Thatikonda Sunil Kumar',
  H3252: 'Priyanka Pankajkumar Gupta',
  H3595: 'Bhawna Devidas',
  H3603: 'Manasi',
  H3728: 'Siddhant'  H3786: 'Oviya',  H701: 'Mallika M'
};

/**
 * Get trainer name by ID
 * @param trainerId - The trainer ID (e.g., "H1761")
 * @returns The trainer's full name or the ID if not found
 */
export function getTrainerName(trainerId: string): string {
  return TRAINER_NAME_OVERRIDES[trainerId] || trainerId;
}

/**
 * Get all trainers as an array of TrainerInfo objects
 * @param sourceIds - Optional array of trainer IDs to filter by
 * @returns Array of trainer information sorted by name
 */
export function getAllTrainers(sourceIds?: string[]): TrainerInfo[] {
  const idsToUse = sourceIds || Object.keys(TRAINER_NAME_OVERRIDES);
  
  return idsToUse
    .map(id => ({
      id,
      name: getTrainerName(id)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Format trainer for display in dropdowns
 * @param trainerId - The trainer ID
 * @returns Formatted string like "Mahadev Nayak (H1761)"
 */
export function formatTrainerDisplay(trainerId: string): string {
  const name = getTrainerName(trainerId);
  return name === trainerId ? trainerId : `${name} (${trainerId})`;
}

/**
 * Check if a trainer ID exists in our mapping
 * @param trainerId - The trainer ID to check
 * @returns true if the trainer exists in our mapping
 */
export function isValidTrainer(trainerId: string): boolean {
  return trainerId in TRAINER_NAME_OVERRIDES;
}