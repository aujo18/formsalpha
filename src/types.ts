export interface CheckItem {
  id: string;
  label: string;
  category: string;
  subcategory?: string;
  checked: boolean;
  disabled?: boolean;
  comment?: string;
} 