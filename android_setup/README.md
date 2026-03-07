# PWA Android Integration Module

This folder contains the native Android code to integrate the Notification Listener module for your expense tracker.

## Files Included

- `ExpenseNotificationService.kt`: Native Android Service to listen for notifications and parse transactions using Regex.
- `OnboardingActivity.kt`: A one-time setup Activity asking for Notification Access and Battery optimizations (OxygenOS/ColorOS API 35).
- `WebAppInterface.kt`: A bridge between the native code and your PWA JavaScript.
- `AndroidManifest_snippet.xml`: Required permissions and component registrations for your AndroidManifest.xml.
- `pwa_integration.js`: The JS stub function you need to mount into your PWA codebase.

## How to use

Since your app is packaged with PWABuilder (TWA), you likely have an Android project folder (e.g., `android/app/src/main/java/...`). Drop the Kotlin files into that directory and merge the XML snippet into your `AndroidManifest.xml`.

In the Activity where you initialize your WebView or TWA, you'll need to hook up the `WebAppInterface`:

```kotlin
// 1. Initialize the interface on your WebView
val webAppInterface = WebAppInterface(this, webView)
webView.addJavascriptInterface(webAppInterface, "Android")

// 2. Register a local broadcast receiver to listen for transactions parsed by ExpenseNotificationService
val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent?.action == ExpenseNotificationService.ACTION_TRANSACTION_RECEIVED) {
            val type = intent.getStringExtra("type") ?: return
            val amount = intent.getStringExtra("amount") ?: return
            val last4 = intent.getStringExtra("last4") ?: return

            // Pass it to JS by calling our bridge method
            webAppInterface.onTransactionReceived(type, amount, last4)
        }
    }
}

// 3. Register the receiver
val filter = IntentFilter(ExpenseNotificationService.ACTION_TRANSACTION_RECEIVED)
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
} else {
    registerReceiver(receiver, filter)
}
```

Then simply include `pwa_integration.js` in your frontend and implement your logic!
