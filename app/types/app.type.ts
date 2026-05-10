export interface Session {
  id: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userName: string | null;
  parsedDetails?: {
    browser: string;
    os: string;
    platform: string;
  };
  userEmail: string | null;
}

export interface Author {
  id: string;
  name: string;
  image?: string | null;
  username?: string | null;
  reputation: number;
  gender?: string;
}

export interface Question {
  id: string;
  authorId: string | null;
  title: string;
  slug: string;
  body: string;
  tags: string[];
  score: number;
  answerCount: number;
  viewCount: number;
  createdAt: string;
  author?: Author | null;
  userVote?: "up" | "down" | null;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string | null;
  body: string;
  score: number;
  isAccepted: boolean;
  createdAt: string;
  author?: Author | null;
  userVote?: "up" | "down" | null;
}

export interface VotePayload {
  votableId: string;
  votableType: "question" | "answer";
  direction: "up" | "down";
}

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}