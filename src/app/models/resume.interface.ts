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

export interface ResumeData {
  id: number;
  lang: 'zh' | 'en';
  title: string;
  summary: string;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  updated_at: string;
}