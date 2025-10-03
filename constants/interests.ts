export interface InterestTag {
  id: string;
  label: string;
  emoji: string;
}

export const PREDEFINED_INTERESTS: InterestTag[] = [
  { id: 'horror', label: 'Horror', emoji: '👻' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'theater', label: 'Theater', emoji: '🎭' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'cooking', label: 'Cooking', emoji: '👨‍🍳' },
  { id: 'reading', label: 'Reading', emoji: '📚' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'photography', label: 'Photography', emoji: '📷' },
  { id: 'nature', label: 'Nature', emoji: '🌲' },
  { id: 'pets', label: 'Pets', emoji: '🐶' },
  { id: 'dancing', label: 'Dancing', emoji: '💃' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'wine', label: 'Wine', emoji: '🍷' },
  { id: 'tech', label: 'Technology', emoji: '💻' },
];

export const MAX_INTERESTS = 10;
export const MAX_CUSTOM_INTERESTS = 5;
