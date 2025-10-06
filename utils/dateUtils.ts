/**
 * Calculate age from date of birth
 * @param birthDate Date of birth (Date object or string)
 * @returns Age in years, or null if invalid
 */
export const calculateAge = (birthDate?: Date | string): number | null => {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
};

/**
 * Get age display string
 * @param birthDate Date of birth (Date object or string)
 * @returns Formatted age string
 */
export const getAgeDisplay = (birthDate?: Date | string): string => {
  const age = calculateAge(birthDate);
  return age !== null ? `${age} years old` : 'Age not set';
};

/**
 * Calculate zodiac sign from date of birth
 * @param birthDate Date of birth (Date object or string)
 * @returns Zodiac sign name, or null if invalid
 */
export const calculateZodiacSign = (
  birthDate?: Date | string
): string | null => {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    const month = birth.getMonth() + 1; // 1-12
    const day = birth.getDate();

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19))
      return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20))
      return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20))
      return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22))
      return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22))
      return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22))
      return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21))
      return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21))
      return 'Sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19))
      return 'Capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18))
      return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20))
      return 'Pisces';

    return null;
  } catch (error) {
    console.error('Error calculating zodiac sign:', error);
    return null;
  }
};

/**
 * Get zodiac sign emoji
 * @param zodiacSign Zodiac sign name
 * @returns Zodiac emoji
 */
export const getZodiacEmoji = (zodiacSign?: string | null): string => {
  if (!zodiacSign) return '⭐';

  const emojis: { [key: string]: string } = {
    Aries: '♈',
    Taurus: '♉',
    Gemini: '♊',
    Cancer: '♋',
    Leo: '♌',
    Virgo: '♍',
    Libra: '♎',
    Scorpio: '♏',
    Sagittarius: '♐',
    Capricorn: '♑',
    Aquarius: '♒',
    Pisces: '♓',
  };

  return emojis[zodiacSign] || '⭐';
};
