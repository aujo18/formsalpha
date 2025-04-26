export interface CheckItem {
  id: string;
  label: string;
  category?: string;
  subcategory?: string;
  checked: boolean;
  value?: string; 
  expireDate?: string; 
  disabled?: boolean; 
  isConform?: boolean; 
  comment?: string; 
} 