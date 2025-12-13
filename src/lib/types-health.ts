// Tipos para o sistema de saúde e favoritos
import type { Transaction } from './types';

export interface HealthProfessional {
  id: string;
  userId: string;
  name: string;
  profession: string;
  specialty?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  instagram?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HealthEstablishment {
  id: string;
  userId: string;
  name: string;
  type: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy' | 'gym' | 'spa' | 'other';
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  openingHours?: string;
  specialties?: string[];
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HealthExpenseWithProfessional extends Transaction {
  professionalId?: string;
  professional?: HealthProfessional;
  establishmentId?: string;
  establishment?: HealthEstablishment;
}

export type ProfessionalType = 
  | 'doctor' 
  | 'dentist' 
  | 'psychologist' 
  | 'nutritionist' 
  | 'physiotherapist' 
  | 'personal_trainer' 
  | 'nurse' 
  | 'pharmacist' 
  | 'other';

export const professionalTypes: Record<ProfessionalType, string> = {
  doctor: 'Médico',
  dentist: 'Dentista',
  psychologist: 'Psicólogo',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta',
  personal_trainer: 'Personal Trainer',
  nurse: 'Enfermeiro',
  pharmacist: 'Farmacêutico',
  other: 'Outro'
};

export const establishmentTypes = {
  hospital: 'Hospital',
  clinic: 'Clínica',
  laboratory: 'Laboratório',
  pharmacy: 'Farmácia',
  gym: 'Academia',
  spa: 'Spa',
  other: 'Outro'
} as const;
