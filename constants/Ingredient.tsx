export interface Ingredient {
    name: string;
    brand?: string;
    category?: string;
    location?: string;
    type?: string;
    expirationDate: string; // Stored as YYYY-MM-DD
  }