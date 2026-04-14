/*
    This file defines TypeScript interfaces for the API responses and data models used in the FindIt mobile application.
*/
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phoneNumber?: string;
  isVerified: boolean;
}

export interface ReportSummary {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  status: 'OPEN' | 'CLOSED' | 'RESOLVED';
  isLost: boolean;
  user: Pick<User, 'id' | 'firstName' | 'avatar'>;
}

export interface ReportDetail extends ReportSummary {
  location: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  flags: any[];
}

export interface ConversationSummary {
  id: string;
  lastMessage: Message;
  participants: User[];
  report: Pick<ReportSummary, 'id' | 'title'>;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  sender: Pick<User, 'id' | 'firstName' | 'avatar'>;
  conversationId: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewer: Pick<User, 'id' | 'firstName' | 'avatar'>;
  reviewee: Pick<User, 'id' | 'firstName'>;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}
