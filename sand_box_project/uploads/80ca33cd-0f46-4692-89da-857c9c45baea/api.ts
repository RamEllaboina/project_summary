import { AuthResponse, User, Subject, Quiz, Question, QuizResult, QuizAnswer } from '../types';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000/api' : '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('userToken', token);
    } else {
      localStorage.removeItem('userToken');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('userToken');
    }
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    return data;
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');
    return data;
  }

  async checkAuth(): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Auth check failed');
    return data;
  }

  // Subject endpoints
  async getSubjects(): Promise<{ subjects: Subject[] }> {
    const response = await fetch(`${API_BASE}/subjects`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch subjects');
    return data;
  }

  // Quiz endpoints
  async getQuizzes(subjectId: string): Promise<{ quizzes: Quiz[] }> {
    const response = await fetch(`${API_BASE}/quizzes?subjectId=${subjectId}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch quizzes');
    return data;
  }

  async getQuiz(quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch quiz');
    return data;
  }

  async submitQuiz(quizId: string, answers: QuizAnswer[]): Promise<{ result: QuizResult }> {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to submit quiz');
    return data;
  }

  // Result endpoints
  async getMyHistory(): Promise<{ results: QuizResult[] }> {
    const response = await fetch(`${API_BASE}/results/my-history`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch history');
    return data;
  }

  async getResult(resultId: string): Promise<{ result: QuizResult }> {
    const response = await fetch(`${API_BASE}/results/${resultId}`, {
      headers: this.getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch result');
    return data;
  }

  async deleteResult(resultId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/results/${resultId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete result');
    }
  }

  async clearHistory(): Promise<void> {
    const response = await fetch(`${API_BASE}/results/my-history`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to clear history');
    }
  }
}

export const apiClient = new ApiClient();
