export interface User {
  id: string;
  name: string;
  age: number;
  image: string;
  bio?: string;
  interests?: string[];
  location?: string;
  distance?: number;
  isOnline?: boolean;
  lastSeen?: Date;
  gender: 'male' | 'female' | 'other';
  preferences?: {
    ageRange: [number, number];
    maxDistance: number;
    interestedIn: 'male' | 'female' | 'both';
  };
}

export interface MatchProfile extends User {
  size: number;
  radius: number;
  matchScore?: number;
}

export interface SearchFilters {
  gender: 'male' | 'female' | 'both';
  ageRange: [number, number];
  maxDistance: number;
  interests?: string[];
}
