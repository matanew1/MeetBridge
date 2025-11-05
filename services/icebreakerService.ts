// services/icebreakerService.ts
import { User } from '../store/types';

export interface Icebreaker {
  id: string;
  text: string;
  category: 'interests' | 'personality' | 'fun' | 'zodiac' | 'custom';
  tags?: string[];
}

/**
 * Generate personalized conversation starters based on matched users' profiles
 */
class IcebreakerService {
  private genericIcebreakers: Icebreaker[] = [
    {
      id: 'generic_1',
      text: "What's been the highlight of your week so far?",
      category: 'personality',
    },
    {
      id: 'generic_2',
      text: 'If you could have dinner with anyone, dead or alive, who would it be?',
      category: 'fun',
    },
    {
      id: 'generic_3',
      text: "What's your go-to comfort food?",
      category: 'fun',
    },
    {
      id: 'generic_4',
      text: "What's the best trip you've ever taken?",
      category: 'personality',
    },
    {
      id: 'generic_5',
      text: 'Coffee or tea? ☕',
      category: 'fun',
    },
  ];

  private interestBasedQuestions: Record<string, string[]> = {
    Music: [
      "What's the last concert you went to?",
      'What song is stuck in your head right now?',
      'If you could see any artist perform live, who would it be?',
    ],
    Travel: [
      "What's your dream travel destination?",
      "What's the most interesting place you've visited?",
      'Beach vacation or mountain adventure?',
    ],
    Food: [
      "What's your favorite cuisine?",
      "Can you cook? What's your signature dish?",
      'Favorite local restaurant around here?',
    ],
    Movies: [
      "What's the last movie that made you cry or laugh out loud?",
      "What's a movie you can watch over and over?",
      'What movie are you excited to see?',
    ],
    Fitness: [
      "What's your favorite workout?",
      'Morning or evening workouts?',
      "Any fitness goals you're working towards?",
    ],
    Gaming: [
      'What game are you playing right now?',
      'PC, console, or mobile gaming?',
      "What's the most hours you've put into a single game?",
    ],
    Reading: [
      'What book are you currently reading?',
      'Fiction or non-fiction?',
      "What's a book that changed your perspective?",
    ],
    Pets: [
      'Do you have any pets? Tell me about them! 🐶',
      'Are you a cat person or a dog person?',
      "What's your dream pet?",
    ],
  };

  private zodiacCompatibilityOpeners: Record<string, string> = {
    high: 'I heard {sign1} and {sign2} make a great match! What do you think about astrology?',
    medium: '{sign1} meets {sign2}! Do you believe in zodiac compatibility?',
    low: 'A {sign1} and {sign2} combo - might be interesting! Are you into astrology?',
  };

  /**
   * Generate personalized icebreakers for a matched pair
   */
  generateIcebreakers(
    currentUser: User,
    matchedUser: User,
    count: number = 3
  ): Icebreaker[] {
    const icebreakers: Icebreaker[] = [];

    // 1. Interest-based icebreakers (if they have common interests)
    const commonInterests = this.findCommonInterests(
      currentUser.interests || [],
      matchedUser.interests || []
    );

    if (commonInterests.length > 0) {
      commonInterests.slice(0, 2).forEach((interest) => {
        const questions = this.interestBasedQuestions[interest];
        if (questions && questions.length > 0) {
          const randomQuestion =
            questions[Math.floor(Math.random() * questions.length)];
          icebreakers.push({
            id: `interest_${interest}_${Date.now()}`,
            text: `I see you're into ${interest}! ${randomQuestion}`,
            category: 'interests',
            tags: [interest],
          });
        }
      });
    }

    // 2. Zodiac-based opener (if both have zodiac signs)
    if (currentUser.zodiacSign && matchedUser.zodiacSign) {
      const compatibility = this.getZodiacCompatibility(
        currentUser.zodiacSign,
        matchedUser.zodiacSign
      );
      const template = this.zodiacCompatibilityOpeners[compatibility];
      if (template) {
        icebreakers.push({
          id: `zodiac_${Date.now()}`,
          text: template
            .replace('{sign1}', currentUser.zodiacSign)
            .replace('{sign2}', matchedUser.zodiacSign),
          category: 'zodiac',
        });
      }
    }

    // 3. Bio-based opener (if matched user has a bio)
    if (matchedUser.bio && matchedUser.bio.length > 10) {
      const bioKeywords = this.extractKeywords(matchedUser.bio);
      if (bioKeywords.length > 0) {
        const keyword = bioKeywords[0];
        icebreakers.push({
          id: `bio_${Date.now()}`,
          text: `I noticed you mentioned ${keyword} in your bio. Tell me more about that!`,
          category: 'custom',
        });
      }
    }

    // 4. Fill with generic icebreakers if needed
    while (icebreakers.length < count) {
      const randomGeneric =
        this.genericIcebreakers[
          Math.floor(Math.random() * this.genericIcebreakers.length)
        ];
      // Avoid duplicates
      if (!icebreakers.find((ib) => ib.id === randomGeneric.id)) {
        icebreakers.push({
          ...randomGeneric,
          id: `${randomGeneric.id}_${Date.now()}`,
        });
      }
    }

    return icebreakers.slice(0, count);
  }

  /**
   * Find common interests between two users
   */
  private findCommonInterests(
    interests1: string[],
    interests2: string[]
  ): string[] {
    return interests1.filter((interest) => interests2.includes(interest));
  }

  /**
   * Get zodiac compatibility level (simplified)
   */
  private getZodiacCompatibility(
    sign1: string,
    sign2: string
  ): 'high' | 'medium' | 'low' {
    // Simplified compatibility mapping - you can expand this
    const highCompatibility: Record<string, string[]> = {
      Aries: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
      Taurus: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
      Gemini: ['Libra', 'Aquarius', 'Aries', 'Leo'],
      Cancer: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
      Leo: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
      Virgo: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
      Libra: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
      Scorpio: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
      Sagittarius: ['Aries', 'Leo', 'Libra', 'Aquarius'],
      Capricorn: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
      Aquarius: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
      Pisces: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
    };

    const compatible = highCompatibility[sign1] || [];
    if (compatible.includes(sign2)) {
      return 'high';
    }

    // Same sign is medium compatibility
    if (sign1 === sign2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract keywords from bio text
   */
  private extractKeywords(bio: string): string[] {
    // Simple keyword extraction - can be improved with NLP
    const keywords: string[] = [];
    const words = bio.toLowerCase().split(/\s+/);

    // Common interesting keywords
    const interestingWords = [
      'travel',
      'adventure',
      'music',
      'art',
      'food',
      'cooking',
      'hiking',
      'beach',
      'mountains',
      'yoga',
      'fitness',
      'books',
      'movies',
      'games',
      'coffee',
      'wine',
    ];

    words.forEach((word) => {
      if (interestingWords.includes(word) && !keywords.includes(word)) {
        keywords.push(word);
      }
    });

    return keywords;
  }

  /**
   * Get a random fun question for when users have nothing in common
   */
  getFunRandomQuestion(): string {
    const funQuestions = [
      'If you could have any superpower, what would it be?',
      "What's your guilty pleasure TV show?",
      'Pineapple on pizza - yay or nay?',
      "What's your karaoke song?",
      "If you won the lottery tomorrow, what's the first thing you'd do?",
      "What's the most adventurous thing you've ever done?",
      'Early bird or night owl?',
      "What's your hidden talent?",
    ];

    return funQuestions[Math.floor(Math.random() * funQuestions.length)];
  }
}

export default new IcebreakerService();
