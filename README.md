# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) mobile app developed by **Luca Borrelli** (StudentID: **19057**) with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app) for the Engineering of Mobile System course. The app helps track kitchen ingredients, allowing users to efficiently manage their food storage by recording expiration dates, ripeness, and heling decreaese the food waste.

## Features 📌
* Ingredient Tracking
* Ingredient Visualization and Filtering
* Darkmode and Lightmode
* Barcode Scanning
* Ripeness Monitoring
* Frozen Monitoring
* Opened Tracking

## Description and App Flow 📖
After getting started with the app and granting camera permissions, users can manually input ingredient details such as **name, category, location, confection type, and expiration date**. Only the name is required to add an ingredient. Alternatively, ingredients can be scanned using the **barcode scanner**, which fetches product details from OpenFoodFacts. Users can also specify the brand of an item. All these operations are accessible in the **Add Ingredient** tab.

Ingredients are categorized and stored based on predefined **categories, locations, and confection types**. Users can view ingredients that will **expire within 3 days** in the **Expiring Soon** tab, which updates dynamically whenever an item is added or modified.

The **More Info** tab allows users to visualize and query all added ingredients based on **category, location, confection type, missing data, or recent additions**. Ingredients with a **ripeness** status should be checked regularly (at least every 3 days). Additionally, users can **modify or delete** ingredients from this tab.

For comprehensive edits, the **Modify Ingredient** tab enables users to change all details of a selected ingredient.

When selecting an ingredient as **fresh**, users can assign a **ripeness** status (e.g., **unripe, ripe, overripe, rotten**), which can be manually updated. If an ingredient is **opened**, the expiration date is immediately adjusted. If a fresh ingredient is **frozen**, its original expiration date is **automatically extended by six months**.

Items that are **ripe or opened** are added to the **Expiring Soon** list. Frozen items are **excluded** from this list unless their adjusted expiration date is approaching.



## Get started 🚀

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```
3. Troubleshooting

   ```bash
    npx expo start --tunnel
   ```

## Structure 📂

This project follows the default modular directory structure of an Expo project. 
Here is a more detailed explanation:
- `/app` → Layout and UI files for pages and screens.
- `/(tabs)` → Navigation bar and tabbed page layouts.
- `/assets` → Images and fonts.
- `/components` → Reusable Layout and UI components.
- `/constants` → Constants and TypeScript interfaces.
- `/scripts` → Logic and helper functions.


## Tasks list ✅

- [x] Persistence: the application's data persists accross execution.
- [ ] Ripeness: fresh ingredients have a ripeness or maturity status (e.g., green, ripe/mature, advanced, too ripe). This maturity status can be edited, and the date when it was edited is stored (something ripe a week ago might not be good anymore!).
- [x] Frozen: fresh ingredients can be frozen. This also extend their expiration date to be at least 6 months.
- [ ] Open: some ingredients last only a short time after being opened (e.g., a yogurt) When an ingredient is set as open, their expiry date can be changed to account for this.
- [x] Barcode scanning: the application uses Expo's BarCodeScanner API to read barcodes. It can then query OpenFoodFacts, and if succesful, it retrieves data about the item automatically.
- [x] Brand: some items can have brands, in addition to names.
- [ ] Items that have a ripeness status need to be checked regularly. If the last check was more than 3 days ago, they are added.
- [ ] Items that are ripe, and open items, are added to the "expiring soon" query; items that are frozen are removed from it (unless their new expiry date is coming up)