// src/app/models/resume.interface.ts

export interface Skill {
  category: string;
  items: string[];
}

export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Certification {
  name: string;
  credentialId: string;
  description: string;
}

// 這是你履歷的核心資料結構
export interface ResumeData {
  id: number;
  title: string;
  summary: string;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  updated_at: string;
}

// 這是後端 API 回傳的最外層格式
export interface ApiResponse {
  success: boolean;
  data: ResumeData;
}