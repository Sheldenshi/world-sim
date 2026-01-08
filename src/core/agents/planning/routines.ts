/**
 * Character Routines - Pre-defined daily schedules based on occupation
 */

import type { Plan } from '../../types';
import { createPlan } from './Planner';

/**
 * Big Bang Theory character routines
 */
const BBT_ROUTINES: Record<string, () => Plan[]> = {
  theoretical_physicist: () => [
    createPlan('Wake up at precisely 6:15 AM', 6, 15, 15),
    createPlan('Morning bathroom routine (exactly 11 minutes)', 6, 30, 11),
    createPlan('Eat breakfast - cereal with 1/4 cup of milk on Mondays', 6, 45, 30),
    createPlan('Watch morning cartoons (Doctor Who reruns)', 7, 15, 45),
    createPlan('Walk to Caltech (Leonard drives)', 8, 0, 30),
    createPlan('Work on string theory equations at Caltech', 8, 30, 210),
    createPlan("Lunch at Caltech cafeteria - it's Thai food Thursday!", 12, 0, 45),
    createPlan('Continue physics research at Caltech', 12, 45, 195),
    createPlan('Leave Caltech', 16, 0, 30),
    createPlan('Play Halo 3 or World of Warcraft', 16, 30, 90),
    createPlan('Watch vintage TV shows', 18, 0, 60),
    createPlan('Order dinner - Chinese food on Tuesdays', 19, 0, 60),
    createPlan('Comic book store visit or board game night', 20, 0, 120),
    createPlan('Prepare for bed with exact routine', 22, 0, 30),
    createPlan('Sleep', 22, 30, 480),
  ],

  experimental_physicist: () => [
    createPlan('Wake up', 7, 0, 30),
    createPlan('Morning routine and breakfast', 7, 30, 45),
    createPlan('Drive Sheldon to Caltech', 8, 15, 30),
    createPlan('Work on laser experiments at Caltech', 8, 45, 195),
    createPlan('Lunch at Caltech', 12, 0, 45),
    createPlan('Continue experimental work at Caltech', 12, 45, 195),
    createPlan('Drive home from Caltech', 16, 0, 30),
    createPlan('Check on Penny or hang out with friends', 16, 30, 90),
    createPlan('Dinner', 18, 0, 60),
    createPlan('Video games or comic store with the guys', 19, 0, 120),
    createPlan('Watch TV or try to have alone time', 21, 0, 60),
    createPlan('Prepare for bed', 22, 0, 30),
    createPlan('Sleep', 22, 30, 510),
  ],

  waitress: () => [
    createPlan('Wake up (usually late)', 9, 0, 30),
    createPlan('Morning routine', 9, 30, 45),
    createPlan('Quick breakfast', 10, 15, 30),
    createPlan('Practice lines for auditions', 10, 45, 75),
    createPlan('Get ready for work', 12, 0, 60),
    createPlan('Work lunch shift at Cheesecake Factory', 13, 0, 180),
    createPlan('Short break at work', 16, 0, 30),
    createPlan('Work dinner shift at Cheesecake Factory', 16, 30, 210),
    createPlan('End shift and clean up', 20, 0, 30),
    createPlan('Hang out with Leonard and the guys', 20, 30, 90),
    createPlan('Watch reality TV or relax', 22, 0, 60),
    createPlan('Sleep', 23, 0, 600),
  ],

  aerospace_engineer: () => [
    createPlan('Wake up to mom yelling', 7, 30, 15),
    createPlan('Eat breakfast mom prepared', 7, 45, 30),
    createPlan("Morning routine (using mom's bathroom)", 8, 15, 30),
    createPlan('Drive to Caltech', 8, 45, 30),
    createPlan('Work on NASA projects at Caltech', 9, 15, 165),
    createPlan('Lunch at Caltech cafeteria - hit on women', 12, 0, 60),
    createPlan('Continue engineering work at Caltech', 13, 0, 180),
    createPlan('Leave Caltech', 16, 0, 30),
    createPlan('Hang out with Raj', 16, 30, 90),
    createPlan("Dinner at mom's house", 18, 0, 60),
    createPlan('Comic store or video games with the guys', 19, 0, 120),
    createPlan('Try online dating or work on pickup lines', 21, 0, 60),
    createPlan("Go to sleep at mom's house", 22, 0, 540),
  ],

  astrophysicist: () => [
    createPlan('Wake up', 7, 0, 30),
    createPlan('Morning yoga and meditation', 7, 30, 30),
    createPlan('Breakfast', 8, 0, 30),
    createPlan('Drive to Caltech', 8, 30, 30),
    createPlan('Research on planetary formation at Caltech', 9, 0, 180),
    createPlan('Lunch at Caltech with Howard', 12, 0, 60),
    createPlan('Continue astrophysics research at Caltech', 13, 0, 180),
    createPlan('Leave Caltech', 16, 0, 30),
    createPlan('Hang out with Howard', 16, 30, 90),
    createPlan('Dinner', 18, 0, 60),
    createPlan('Video games or comic store with friends', 19, 0, 120),
    createPlan('Watch romantic comedies alone', 21, 0, 60),
    createPlan('Sleep', 22, 0, 540),
  ],

  comic_book_store_owner: () => [
    createPlan('Wake up alone in small apartment', 8, 0, 30),
    createPlan('Contemplate existence while eating cereal', 8, 30, 30),
    createPlan('Open the Comic Center of Pasadena', 9, 0, 30),
    createPlan('Wait for customers at the Comic Store', 9, 30, 150),
    createPlan('Eat sad lunch alone at the store', 12, 0, 30),
    createPlan('Organize comics nobody will buy at Comic Store', 12, 30, 180),
    createPlan('Hope someone comes in to the Comic Store', 15, 30, 90),
    createPlan('New comic day prep at Comic Store', 17, 0, 60),
    createPlan('Close store, count meager earnings', 18, 0, 30),
    createPlan('Eat dinner alone', 18, 30, 60),
    createPlan('Draw sketches that will never be sold', 19, 30, 90),
    createPlan('Watch TV alone', 21, 0, 60),
    createPlan('Sleep', 22, 0, 600),
  ],
};

/**
 * Default routines for common occupations
 */
const DEFAULT_ROUTINES: Record<string, () => Plan[]> = {
  artist: () => [
    createPlan('Wake up and morning routine', 7, 0, 60),
    createPlan('Have breakfast', 8, 0, 30),
    createPlan('Work on art projects at the gallery', 9, 0, 180),
    createPlan('Take a break and have lunch', 12, 0, 60),
    createPlan('Continue art work or meet with clients', 13, 0, 180),
    createPlan('Take a walk for inspiration', 16, 0, 60),
    createPlan('Have dinner', 18, 0, 60),
    createPlan('Relax and socialize', 19, 0, 120),
    createPlan('Prepare for bed', 21, 0, 60),
  ],

  bookstore_owner: () => [
    createPlan('Wake up and morning routine', 6, 30, 60),
    createPlan('Have breakfast and read', 7, 30, 45),
    createPlan('Open the bookstore', 8, 30, 30),
    createPlan('Manage store and help customers', 9, 0, 180),
    createPlan('Have lunch', 12, 0, 60),
    createPlan('Continue store operations', 13, 0, 240),
    createPlan('Close store and inventory', 17, 0, 60),
    createPlan('Have dinner', 18, 0, 60),
    createPlan('Read or socialize', 19, 0, 120),
    createPlan('Prepare for bed', 21, 0, 60),
  ],

  barista: () => [
    createPlan('Wake up early', 5, 30, 60),
    createPlan('Have breakfast', 6, 30, 30),
    createPlan('Commute to cafe', 7, 0, 30),
    createPlan('Open cafe and prepare', 7, 30, 30),
    createPlan('Morning rush - serve customers', 8, 0, 180),
    createPlan('Take a break', 11, 0, 30),
    createPlan('Lunch service', 11, 30, 150),
    createPlan('Afternoon shift', 14, 0, 180),
    createPlan('End shift and clean up', 17, 0, 60),
    createPlan('Have dinner and relax', 18, 0, 120),
    createPlan('Socialize or personal time', 20, 0, 90),
    createPlan('Prepare for bed', 21, 30, 60),
  ],
};

/**
 * Generic routine for unknown occupations
 */
function getGenericRoutine(): Plan[] {
  return [
    createPlan('Wake up and morning routine', 7, 0, 60),
    createPlan('Have breakfast', 8, 0, 30),
    createPlan('Work or activities', 9, 0, 180),
    createPlan('Have lunch', 12, 0, 60),
    createPlan('Continue activities', 13, 0, 240),
    createPlan('Have dinner', 18, 0, 60),
    createPlan('Evening relaxation', 19, 0, 120),
    createPlan('Prepare for bed', 21, 0, 60),
  ];
}

/**
 * Get routine based on occupation
 */
export function getDefaultRoutine(occupation: string): Plan[] {
  const lower = occupation.toLowerCase();

  // Check for Big Bang Theory specific occupations
  if (lower.includes('theoretical physicist')) {
    return BBT_ROUTINES.theoretical_physicist();
  }
  if (lower.includes('experimental physicist')) {
    return BBT_ROUTINES.experimental_physicist();
  }
  if (lower.includes('waitress')) {
    return BBT_ROUTINES.waitress();
  }
  if (lower.includes('aerospace engineer')) {
    return BBT_ROUTINES.aerospace_engineer();
  }
  if (lower.includes('astrophysicist')) {
    return BBT_ROUTINES.astrophysicist();
  }
  if (lower.includes('comic') && lower.includes('store')) {
    return BBT_ROUTINES.comic_book_store_owner();
  }

  // Check default routines
  const key = lower.replace(/\s+/g, '_');
  if (DEFAULT_ROUTINES[key]) {
    return DEFAULT_ROUTINES[key]();
  }

  // Return generic routine
  return getGenericRoutine();
}

/**
 * Create a routine generator function
 */
export function createRoutineGenerator(): (occupation: string) => Plan[] {
  return getDefaultRoutine;
}
