export interface User {
  _id: string;
  username: string;
  email: string;
  role?: 'user' | 'admin';
}

export interface Subject {
  _id: string;
  name: string;
  description?: string;
}

export interface Option {
  _id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  questionText: string;
  options: Option[];
  explanation?: string;
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number; // in minutes
  subjectId: string;
  subject?: Subject;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
}

export interface QuizResult {
  _id: string;
  quiz: Quiz;
  user: User;
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  completedAt: string;
  answers: Array<{
    question: Question;
    selectedOption: string;
    isCorrect: boolean;
  }>;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface QuizState {
  questions: Question[];
  currentQuestion: number;
  userAnswers: (string | null)[];
  score: number;
  timeLeft: number;
  isSubmitted: boolean;
}

export interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
