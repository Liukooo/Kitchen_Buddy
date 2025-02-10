export interface Ingredient {
    name: string;
    category?: string;
    location: string;
    type: string;
    expirationDate: string; // stored as YYYY-MM-DD
    estimateDate: string;
  }
  
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
    return ingredients.slice(-limit).reverse(); // Get last `limit` items
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