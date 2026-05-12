export type VoteDirection = "up" | "down" | null;

export interface Author {
  id: string;
  name: string;
  username: string;
  reputation: number;
  gender: "male" | "female" | "other";
  avatarColor?: string;
  role?: string;
  emailVerified?: boolean;
  image?: string | null;
}

export interface Comment {
  id: string;
  authorId: string;
  author: Author;
  content: string;
  score: number;
  userVote: VoteDirection;
  replyToId: string | null;
  replyCount: number;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  authorId: string;
  author: Author;
  body: string;
  score: number;
  isAccepted: boolean;
  commentCount: number;
  createdAt: string;
  userVote: VoteDirection;
}

export interface Question {
  id: string;
  authorId: string;
  author: Author;
  title: string;
  slug: string;
  body: string;
  tags: string[];
  score: number;
  images: string[];
  imageCount: number;
  answerCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  userVote: VoteDirection;
}
