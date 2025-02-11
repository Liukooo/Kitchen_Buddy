// Local imports
import { Ingredient } from "@/constants/Ingredient";
  
// Transform Estimated Date of Exiration into a operable String
export const getEstimatedDate = (estimate: string): string => {
  const date = new Date();
  const daysMap: Record<string, number> = {
    "2 days": 2,
    "1 week": 7,
    "10 days": 10,
    "1 month": 30,
  };
  date.setDate(date.getDate() + (daysMap[estimate] || 0));
  return estimate ? date.toISOString().split("T")[0] : "";
};

const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// 1. Get ingredients expiring soon
export const getExpiringSoon = (ingredients: Ingredient[], daysThreshold: number = 3) => {
  return ingredients.filter(
    (ingredient) => ingredient.expirationDate && getDaysUntilExpiration(ingredient.expirationDate) <= daysThreshold
  );
};

// 2. Get ingredients missing data
export const getMissingData = (ingredients: Ingredient[]) => {
  return ingredients.filter(
    (ingredient) => !ingredient.category || !ingredient.location || !ingredient.expirationDate
  );
};

// 3. Get most recently added ingredients
export const getRecentlyAdded = (ingredients: Ingredient[], limit: number = 5) => {
  return ingredients.slice(-limit).reverse();
};

// 4. Get ingredients by location
export const getByLocation = (ingredients: Ingredient[], location: string) => {
  return ingredients.filter((ingredient) => ingredient.location === location);
};

// 5. Get ingredients by category or confection type
export const getByCategoryOrConfection = (ingredients: Ingredient[], category?: string, type?: string) => {
  return ingredients.filter(
    (ingredient) =>
      (category && ingredient.category === category) || 
      (type && ingredient.type === type)
  );
};