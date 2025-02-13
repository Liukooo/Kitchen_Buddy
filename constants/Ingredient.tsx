export interface Ingredient {
    name: string;
    brand?: string;
    category?: string;
    location?: string;
    type?: string;
    status?: string;
    isOpened?: boolean;
    expirationDate: string; // Stored as YYYY-MM-DD
  }