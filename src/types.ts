export type RoleType = 'admin' | 'strategic' | 'territorial';

export interface Campaign {
  id: string;
  name: string;
  type: 'Alcaldía' | 'Gobernación' | 'Concejo' | 'Asamblea' | 'JAL';
  location: string;
  year: number;
}

export interface UserProfile {
  id: string;
  name: string;
  cedula: string;
  email: string;
  role: RoleType;
  roleName: string;
  campaign: string;
  avatar: string;
  accessLevel: string;
}

export interface AccessModuleCardProps {
  id: RoleType;
  title: string;
  roleLabel: string;
  description: string;
  stats: { label: string; value: string; highlight?: boolean }[];
  features: string[];
  buttonText: string;
  borderColor: string;
  bgGradient: string;
  badgeBg: string;
  icon: string;
  onAccessClick: (role: RoleType) => void;
}
