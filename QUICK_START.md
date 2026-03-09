# Quick Start: Building Your APK in 5 Minutes

## Prerequisites Check
- ✅ Android Studio installed
- ✅ Android SDK API 34 installed
- ✅ 2+ GB free disk space

## Step-by-Step

### 1. Open Project (1 min)
```bash
# Navigate to the android folder
cd /path/to/project/android

# Open with Android Studio
# File → Open → Select this folder
```

### 2. Wait for Sync (2 mins)
- Android Studio automatically starts Gradle sync
- Wait for "Build successful" message in console
- This downloads all dependencies

### 3. Build APK (2 mins)

#### For Testing (Debug APK)
```
Run → Run 'app'
Select your device
Wait for installation
```

#### For Release (Signed APK)
```
Build → Generate Signed Bundle/APK
Select APK
Click Create new... (create signing key if first time)
Fill in details:
  - Key store path: ~/signing.jks (or anywhere)
  - Password: (create secure password)
  - Key alias: expensetracker
  - Validity: 10000 days
Click Next → Select Release → Finish
```

### 4. Find Your APK

**Debug APK Location:**
```
android/app/debug/app-debug.apk
```

**Release APK Location:**
```
android/app/release/app-release.apk
```

### 5. Install on Device

**Option A: Via Android Studio**
```
Run → Run 'app'
Select connected device
App installs automatically
```

**Option B: Manual Installation**
```
1. Connect device via USB
2. Enable Developer Mode (tap Build Number 7x in Settings)
3. Enable USB Debugging
4. adb install path/to/app-release.apk
```

**Option C: Direct Share**
```
1. Copy APK to device via USB
2. Enable Unknown Sources in Settings
3. Open with file manager
4. Tap to install
5. Grant permissions
```

## First Run

1. App opens to Setup Screen
2. Enter your name
3. Enter initial cash balance (₹0 default)
4. Enter initial bank balance (₹0 default)
5. Tap "Save"
6. You're ready to use!

## Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Gradle sync fails | File → Invalidate Caches → Restart |
| SDK not found | File → Project Structure → Set SDK path |
| APK won't install | Uninstall old version first |
| App crashes | Check Android version (min 8.0) |
| Charts don't show | Add transactions first |
| Bank detection fails | Grant notification listener permission |

## Feature Verification Checklist

After installing, test:

- [ ] Can add income transaction
- [ ] Can add expense transaction
- [ ] Balance updates correctly
- [ ] Can view transaction history
- [ ] Can see cash/bank balance separately
- [ ] Charts display data
- [ ] Wallets screen shows balances
- [ ] Alerts show for marked transactions

## Enable Bank Detection (Optional)

1. Open Settings → Accessibility
2. Find "Notification Listener"
3. Enable "Expense Tracker"
4. Grant SMS permission in app

## Distribute Your APK

### Option 1: Google Play Store
1. Create Play Store account (~$25 one-time)
2. Upload APK via Play Console
3. Set pricing (free/paid)
4. Publish

### Option 2: Direct Share
1. Upload `app-release.apk` to cloud storage
2. Share download link
3. Users install directly

### Option 3: GitHub
1. Create release in repository
2. Attach APK file
3. Users download from releases page

## Version Updates

When updating:
1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // increment
   versionName "1.1.0"  // new version
   ```
2. Make your changes
3. Build new APK
4. Upload/distribute

## Performance Tips

- Remove old APK builds to save space
- Clear Gradle cache if sync is slow
- Use physical device for testing (faster than emulator)
- Enable hardware acceleration in emulator settings

## Key Files to Know

```
android/
├── app/build.gradle          ← Change version here
├── app/src/main/
│   └── AndroidManifest.xml   ← Permissions
├── app/src/main/res/
│   ├── values/colors.xml     ← Change theme colors
│   ├── values/strings.xml    ← Change app name
│   └── mipmap/               ← App icon
└── README.md                 ← Full documentation
```

## Customization (2 minutes)

### Change App Name
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">My Expense Tracker</string>
```

### Change Theme Color
Edit `android/app/src/main/res/values/colors.xml`:
```xml
<color name="emerald_500">#10B981</color>  <!-- Primary color -->
```

### Add App Icon
Replace images in:
```
android/app/src/main/res/mipmap-*/ic_launcher.png
```

Then rebuild APK.

## Support Resources

- **Android Studio Help**: Help → Android Studio Help
- **Project README**: `android/README.md`
- **Build Guide**: `ANDROID_BUILD_GUIDE.md`
- **Android Docs**: https://developer.android.com/docs

## Success! 🎉

Your native Android app is ready!

Next:
- Test on multiple devices
- Share with friends
- Upload to Play Store
- Gather feedback
- Plan updates

**Happy building!**
