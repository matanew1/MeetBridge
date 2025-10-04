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
