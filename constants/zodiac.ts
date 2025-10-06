/**
 * Zodiac Signs Constants
 * Contains information about all zodiac signs including emojis, date ranges, and traits
 */

export interface ZodiacInfo {
  name: string;
  emoji: string;
  symbol: string;
  dateRange: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  traits: string[];
  compatibility: string[];
}

export const ZODIAC_SIGNS: Record<string, ZodiacInfo> = {
  Aries: {
    name: 'Aries',
    emoji: '♈',
    symbol: 'Ram',
    dateRange: 'March 21 - April 19',
    element: 'Fire',
    traits: ['Confident', 'Passionate', 'Adventurous', 'Energetic'],
    compatibility: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
  },
  Taurus: {
    name: 'Taurus',
    emoji: '♉',
    symbol: 'Bull',
    dateRange: 'April 20 - May 20',
    element: 'Earth',
    traits: ['Reliable', 'Patient', 'Devoted', 'Practical'],
    compatibility: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
  },
  Gemini: {
    name: 'Gemini',
    emoji: '♊',
    symbol: 'Twins',
    dateRange: 'May 21 - June 20',
    element: 'Air',
    traits: ['Curious', 'Adaptable', 'Social', 'Witty'],
    compatibility: ['Libra', 'Aquarius', 'Aries', 'Leo'],
  },
  Cancer: {
    name: 'Cancer',
    emoji: '♋',
    symbol: 'Crab',
    dateRange: 'June 21 - July 22',
    element: 'Water',
    traits: ['Nurturing', 'Loyal', 'Intuitive', 'Emotional'],
    compatibility: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
  },
  Leo: {
    name: 'Leo',
    emoji: '♌',
    symbol: 'Lion',
    dateRange: 'July 23 - August 22',
    element: 'Fire',
    traits: ['Confident', 'Generous', 'Warm-hearted', 'Creative'],
    compatibility: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
  },
  Virgo: {
    name: 'Virgo',
    emoji: '♍',
    symbol: 'Virgin',
    dateRange: 'August 23 - September 22',
    element: 'Earth',
    traits: ['Analytical', 'Practical', 'Loyal', 'Hardworking'],
    compatibility: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
  },
  Libra: {
    name: 'Libra',
    emoji: '♎',
    symbol: 'Scales',
    dateRange: 'September 23 - October 22',
    element: 'Air',
    traits: ['Diplomatic', 'Fair', 'Social', 'Romantic'],
    compatibility: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
  },
  Scorpio: {
    name: 'Scorpio',
    emoji: '♏',
    symbol: 'Scorpion',
    dateRange: 'October 23 - November 21',
    element: 'Water',
    traits: ['Passionate', 'Resourceful', 'Determined', 'Loyal'],
    compatibility: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
  },
  Sagittarius: {
    name: 'Sagittarius',
    emoji: '♐',
    symbol: 'Archer',
    dateRange: 'November 22 - December 21',
    element: 'Fire',
    traits: ['Optimistic', 'Adventurous', 'Independent', 'Honest'],
    compatibility: ['Aries', 'Leo', 'Libra', 'Aquarius'],
  },
  Capricorn: {
    name: 'Capricorn',
    emoji: '♑',
    symbol: 'Goat',
    dateRange: 'December 22 - January 19',
    element: 'Earth',
    traits: ['Responsible', 'Disciplined', 'Ambitious', 'Patient'],
    compatibility: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
  },
  Aquarius: {
    name: 'Aquarius',
    emoji: '♒',
    symbol: 'Water Bearer',
    dateRange: 'January 20 - February 18',
    element: 'Air',
    traits: ['Progressive', 'Independent', 'Humanitarian', 'Original'],
    compatibility: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
  },
  Pisces: {
    name: 'Pisces',
    emoji: '♓',
    symbol: 'Fish',
    dateRange: 'February 19 - March 20',
    element: 'Water',
    traits: ['Compassionate', 'Artistic', 'Intuitive', 'Gentle'],
    compatibility: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
  },
};

export const ZODIAC_ELEMENTS = {
  Fire: ['Aries', 'Leo', 'Sagittarius'],
  Earth: ['Taurus', 'Virgo', 'Capricorn'],
  Air: ['Gemini', 'Libra', 'Aquarius'],
  Water: ['Cancer', 'Scorpio', 'Pisces'],
};

/**
 * Get compatibility score between two zodiac signs (0-100)
 */
export const getZodiacCompatibility = (
  sign1?: string | null,
  sign2?: string | null
): number => {
  if (!sign1 || !sign2) return 50; // Neutral if either is missing

  const zodiac1 = ZODIAC_SIGNS[sign1];
  const zodiac2 = ZODIAC_SIGNS[sign2];

  if (!zodiac1 || !zodiac2) return 50;

  // Same sign
  if (sign1 === sign2) return 85;

  // Check if they're in compatibility list
  if (zodiac1.compatibility.includes(sign2)) return 90;

  // Same element
  if (zodiac1.element === zodiac2.element) return 75;

  // Fire and Air are compatible
  if (
    (zodiac1.element === 'Fire' && zodiac2.element === 'Air') ||
    (zodiac1.element === 'Air' && zodiac2.element === 'Fire')
  ) {
    return 70;
  }

  // Earth and Water are compatible
  if (
    (zodiac1.element === 'Earth' && zodiac2.element === 'Water') ||
    (zodiac1.element === 'Water' && zodiac2.element === 'Earth')
  ) {
    return 70;
  }

  // Opposite elements (Fire-Water, Earth-Air)
  return 50;
};

/**
 * Get a description of compatibility between two signs
 */
export const getCompatibilityDescription = (
  sign1?: string | null,
  sign2?: string | null
): string => {
  const score = getZodiacCompatibility(sign1, sign2);

  if (score >= 85) return 'Excellent match! ✨';
  if (score >= 75) return 'Great compatibility! 💫';
  if (score >= 65) return 'Good connection! 🌟';
  if (score >= 50) return 'Potential match! ⭐';
  return 'Could be interesting! 💭';
};
