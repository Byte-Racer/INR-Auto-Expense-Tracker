# Android Expense Tracker APK Build Guide

This guide explains how to build and package your native Android Expense Tracker application into an APK file.

## Project Structure

The Android project is located in the `android/` directory with the following structure:

```
android/
├── app/                          # Main application module
│   ├── src/main/
│   │   ├── java/com/expensetracker/
│   │   │   ├── data/              # Database layer (Room)
│   │   │   │   ├── dao/           # Data Access Objects
│   │   │   │   ├── database/      # Database setup
│   │   │   │   ├── entities/      # Data models
│   │   │   │   └── repository/    # Repository pattern
│   │   │   ├── services/          # Bank notification listener
│   │   │   ├── receivers/         # SMS receiver
│   │   │   ├── ui/
│   │   │   │   ├── fragments/     # Navigation fragments (Home, Activity, Wallets, Alerts)
│   │   │   │   ├── adapters/      # RecyclerView adapters
│   │   │   │   └── viewmodel/     # MVVM ViewModels
│   │   │   └── utils/             # Utilities (currency, date, parsing)
│   │   ├── res/                   # Resources (layouts, colors, strings)
│   │   └── AndroidManifest.xml    # App permissions and components
│   ├── build.gradle               # App-level build configuration
│   └── proguard-rules.pro         # Code obfuscation rules
├── settings.gradle.kts            # Project settings
└── build.gradle.kts               # Root build configuration
```

## Prerequisites

Before building the APK, ensure you have:

1. **Android Studio** (latest version): [Download](https://developer.android.com/studio)
2. **Android SDK** with:
   - API Level 34 (target)
   - API Level 26 (minimum for compatibility)
   - Build Tools 34.0.0+
3. **Java Development Kit (JDK)** 17 or higher

## Setup Instructions

### Step 1: Import Project into Android Studio

1. Open Android Studio
2. Click **File → Open**
3. Navigate to the project directory (`/android/`)
4. Click **Open**
5. Wait for Gradle to sync (this may take 5-10 minutes on first import)

### Step 2: Verify SDK Installation

1. Go to **File → Project Structure**
2. Under **SDK Location**, verify:
   - SDK Path is set to your Android SDK installation
   - NDK is optional but recommended
3. Click **Apply → OK**

### Step 3: Build the Project

1. Go to **Build → Make Project** (or press Ctrl+F9)
2. Wait for the build to complete
3. Check the **Build** output panel for any errors

## Building the APK

### Debug APK (for testing)

1. Connect an Android device via USB or use an emulator
2. Go to **Run → Run 'app'** (or press Shift+F10)
3. Select your device
4. The app will build, sign, and install automatically

### Release APK (for distribution)

Follow these steps to create a signed release APK:

#### Step 1: Create a Signing Key

1. Go to **Build → Generate Signed Bundle/APK**
2. Select **APK** and click **Next**
3. Click **Create new** under "Key store path"
4. Fill in the key store details:
   - **Key Store Path**: Choose a location (e.g., `~/signing.jks`)
   - **Key Store Password**: Create a secure password
   - **Key Alias**: e.g., `expensetracker`
   - **Key Password**: Match key store password or create a new one
   - **Validity**: 10000+ days (recommended)
   - **Name**: Your name or company
   - **Organizational Unit, Organization, City, State, Country Code**: Fill as desired
5. Click **OK**

#### Step 2: Build Release APK

1. Select your newly created key store
2. Enter passwords and click **Next**
3. Choose **Release** build variant
4. Click **Finish**
5. Android Studio will build and sign the APK

The signed APK will be located at:
```
android/app/release/app-release.apk
```

## Testing the APK

### On Android Device

1. Transfer the APK to your device
2. Go to **Settings → Security → Unknown Sources** and enable it (varies by Android version)
3. Open a file manager and tap the APK to install
4. Grant necessary permissions when prompted

### Required Permissions

The app requests the following permissions:

- **READ_SMS**: To auto-detect bank transactions from SMS
- **RECEIVE_SMS**: For SMS transaction listener
- **BIND_NOTIFICATION_LISTENER_SERVICE**: To listen for bank app notifications
- **ACCESS_NOTIFICATION_POLICY**: For notification access
- **INTERNET**: For potential cloud features

Grant these permissions in app settings for full functionality.

## Key Features Implemented

### Core Features
- ✅ Balance tracking (Cash and Bank wallets)
- ✅ Transaction management (Add, edit, delete)
- ✅ Category-based expense tracking
- ✅ Income and expense separation
- ✅ Warning and lock thresholds

### Advanced Features
- ✅ Bank transaction auto-detection (SMS + Notification Listener)
- ✅ Charts (Daily spending bar chart, Category pie chart)
- ✅ Alert system for low balance and locked accounts
- ✅ Local SQLite database (no cloud dependency)
- ✅ Dark mode UI matching your PWA design

### Navigation
- ✅ Bottom navigation with 4 main screens:
  - Home: Dashboard with charts and balance
  - Activity: Transaction history with delete functionality
  - Wallets: Separate cash and bank balance view
  - Alerts: View warning and locked transactions

## APK Size & Performance

- **Minimum Android Version**: Android 8.0 (API 26)
- **Target Android Version**: Android 14 (API 34)
- **Estimated APK Size**: 15-20 MB (with ProGuard enabled)
- **Runtime Memory**: ~150-200 MB

## Troubleshooting

### Build Failures

**Error: "Gradle sync failed"**
- Solution: Go to **File → Invalidate Caches → Invalidate and Restart**

**Error: "SDK not found"**
- Solution: Go to **File → Project Structure** and set the correct SDK path

### Installation Issues

**Error: "Package not installed"**
- Solution: Enable "Unknown Sources" in Security settings
- Alternative: Build and run directly from Android Studio

**Permission Denied**
- Solution: Uninstall the app first, then install again

### Runtime Issues

**App crashes on startup**
- Check logcat: **View → Tool Windows → Logcat**
- Look for exceptions in the error logs

**Notifications not working**
- Verify notification permissions are granted
- Check if notification listener is enabled in Settings

## Customization

### Change App Name
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Your App Name</string>
```

### Change Theme Colors
Edit `android/app/src/main/res/values/colors.xml` to modify:
- `@color/bg_primary` - Main background
- `@color/emerald_500` - Primary accent color
- `@color/warning` - Warning color
- `@color/error` - Error/lock color

### Add App Icon
Replace the default icon by adding your PNG/WebP files to:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

## Distribution

Once you have your `app-release.apk`:

1. **Google Play Store**: Use [Google Play Console](https://play.google.com/console) to publish
2. **GitHub Releases**: Upload APK to your repository
3. **Direct Distribution**: Share APK file directly
4. **APK Hosting**: Use services like AppSeed, Appetize, or APKPure

## Next Steps

1. Test the app thoroughly on multiple devices
2. Gather user feedback and iterate
3. Update version code in `android/app/build.gradle` for future releases
4. Set up CI/CD pipeline (GitHub Actions, Firebase, etc.) for automated builds

## Support & Documentation

- [Android Developer Docs](https://developer.android.com/docs)
- [Room Persistence Library](https://developer.android.com/training/data-storage/room)
- [Navigation Component](https://developer.android.com/guide/navigation)
- [MPAndroidChart Docs](https://github.com/PhilJay/MPAndroidChart)

## License

This Android app is a native replica of your Expense Tracker PWA.

---

**Happy building! 🚀**
