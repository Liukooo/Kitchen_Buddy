# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

3. Tasks

### Ingredient handling

The application is extended with additional functionality and ingredient data.

Complete:
- Persistence: the application's data persists accross execution.
- Barcode scanning: the application uses Expo's BarCodeScanner API to read barcodes. It can then query OpenFoodFacts, and if succesful, it retrieves data about the item automatically.
- Brand: some items can have brands, in addition to names.

Incomplete:
- Ripeness: fresh ingredients have a ripeness or maturity status (e.g., green, ripe/mature, advanced, too ripe). This maturity status can be edited, and the date when it was edited is stored (something ripe a week ago might not be good anymore!).
- Frozen: fresh ingredients can be frozen. This also extend their expiration date to be at least 6 months.
- Open: some ingredients last only a short time after being opened (e.g., a yogurt) When an ingredient is set as open, their expiry date can be changed to account for this.
- Items that have a ripeness status need to be checked regularly. If the last check was more than 3 days ago, they are added.
- Items that are ripe, and open items, are added to the "expiring soon" query; items that are frozen are removed from it (unless their new expiry date is coming up)