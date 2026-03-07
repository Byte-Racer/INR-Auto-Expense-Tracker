# INR — Smart Expense Tracker

A PWA-based personal expense tracker, packaged as a native Android APK, with automatic transaction detection via notification listening, visual spending dashboards, and a two-threshold budget discipline system.

> Built for personal use on **OnePlus (OxygenOS 15/16)**

---

## Overview

INR tracks your bank balance in real-time by intercepting debit and credit notifications from Indian banking apps. It displays your spending visually through charts, warns you when your balance drops below a set threshold, and enforces a mandatory justification step when you spend past a hard limit.

Designed as a **convenient expense tool** — not just a passive tracker.

---

## Features

- **Automatic transaction detection** via `NotificationListenerService` — no manual entry needed for digital transactions
- **Visual dashboard** — pie chart (spending by category) + bar/line chart (daily spend over 30 days)
- **Warning threshold (X%)** — persistent banner when balance drops below a set percentage
- **Lock threshold (Y ₹)** — mandatory justification modal before any new expense below a hard INR limit
- **Justification log** — every expense logged below the lock threshold stores a reason, visible in transaction history
- **Manual balance correction** — override stored balance anytime from Settings
- **Export to JSON** — backup all transaction data manually
- **Dark mode UI** throughout
- **Mobile-first layout**, optimised for 6–6.8" screens

---

## Architecture

```
┌─────────────────────────────────────────┐
│              Android APK Shell          │  ← TWA via PWABuilder
│                                         │
│  ┌─────────────────────────────────┐    │
│  │   NotificationListenerService   │    │  ← Catches OS-level notifications
│  │   (Kotlin/Java)                 │    │
│  └────────────┬────────────────────┘    │
│               │ parsed transaction      │
│  ┌────────────▼────────────────────┐    │
│  │   JavascriptInterface Bridge    │    │  ← WebAppInterface.java
│  │   webView.evaluateJavascript()  │    │
│  └────────────┬────────────────────┘    │
│               │ window.onNativeTransaction(type, amount, last4)
│  ┌────────────▼────────────────────┐    │
│  │        PWA (HTML/JS/CSS)        │    │  ← Hosted on Netlify/GitHub Pages
│  │        Served via TWA           │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Supported Banks

Notification parsing regex is implemented for the following Indian banks:

| Bank | Debit Pattern | Credit Pattern |
|---|---|---|
| HDFC Bank | `Rs.X debited from a/c XXNNNN` | `Rs.X credited to a/c XXNNNN` |
| State Bank of India (SBI) | `A/c debited by INR X` | `A/c credited by INR X` |
| ICICI Bank | `Acct XXNNNN debited with INR X` | `Acct XXNNNN credited with INR X` |
| Kotak Mahindra Bank | `INR X has been debited from your Kotak Bank` | `INR X has been credited to your Kotak Bank` |
| Axis Bank | `Rs.X debited from Axis Bank A/c XXNNNN` | `Rs.X credited to Axis Bank A/c XXNNNN` |

> ⚠️ Bank notification formats can change without notice. If parsing breaks, open an issue with the raw notification text (redact your account number).

---

## Installation

### Prerequisites
- OnePlus Nord CE5 (or any Android 10+ device)
- Chrome installed and up to date
- Notification access must be granted (see [Permissions Required](#permissions-required))

### Steps

1. Download the latest `.apk` 
2. Enable **Install from Unknown Sources** on your device:
   `Settings → Additional Settings → Developer Options → Install via USB` or tap the APK directly and allow when prompted
3. Install the APK
4. On first launch, complete the **onboarding flow** — do not skip it
5. Enter your current bank balance in INR
6. Set your Warning Threshold (%) and Lock Threshold (₹)

---

## Permissions Required

| Permission | Why It's Needed |
|---|---|
| `BIND_NOTIFICATION_LISTENER_SERVICE` | Read incoming bank notifications to auto-detect transactions |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Prevent OxygenOS from killing the background notification service |
| `INTERNET` | Load the hosted PWA inside the TWA shell |

> The app does **not** request SMS permissions. All parsing is done from push notifications only.

---

## Threshold System

Two independent limits control app behaviour:

```
Balance: ████████████████████ 100%
                        ▲
               Warning Threshold X%    → Yellow banner shown on dashboard
                        ▲
               Lock Threshold Y (₹)    → Justification modal required before next expense log
```

**Warning Threshold (X):** Set as a percentage of your initial balance. When your running balance falls at or below this percentage, a persistent warning banner appears on the dashboard. Configurable in Settings.

**Lock Threshold (Y):** Set as an absolute INR value (e.g., ₹500). When your balance falls at or below this amount, the app forces a mandatory reason input before any new expense is accepted. The reason is stored and displayed alongside that transaction in history.

Both thresholds are editable anytime from Settings.

---

## OxygenOS Setup (Important)

> ⚠️ **OnePlus devices running OxygenOS 15/16 (ColorOS base) will kill the notification service in the background unless the following steps are completed.** The onboarding screen walks you through this, but here is the full reference:

### Step 1 — Grant Notification Access
`Settings → Notifications → Special App Access → Notification Access → [App Name] → Allow`

### Step 2 — Disable Standard Battery Optimization
`Settings → Battery → Battery Optimization → [App Name] → Don't Optimize`

### Step 3 — Disable Deep Optimization (ColorOS-specific)
`Settings → Battery → More Battery Settings → Deep Optimization → Find [App Name] → Disable`

### Step 4 — Set Background Permission to No Restrictions
`Settings → Apps → Manage Apps → [App Name] → Battery Saver → No Restrictions`

All four steps are required. Missing any one of them can cause the notification service to stop working after the screen turns off.

> **Note:** Balance updates may be delayed by a few minutes when the screen is off due to OxygenOS Notification Cooldown — this is an OS-level behaviour and cannot be overridden by the app.

---

## Known Limitations

- **Cash and offline transactions are not auto-detected** — these must be logged manually
- **UPI transactions via apps that don't send push notifications** will be missed
- **Balance drift:** If a notification is missed or dismissed before parsing, the stored balance will be inaccurate. Use the manual balance correction in Settings to fix this
- **Notification delays on screen-off:** OxygenOS batches and delays notifications — balance updates are not always instantaneous
- **Bank format changes:** If your bank changes their notification text format, regex parsing will silently fail until patterns are updated
- PWA data (transaction history, settings) is stored in Chrome's local storage. Clearing Chrome's app data will wipe all records. Use **Export to JSON** regularly to back up

---

## Project Structure

```
/
├── pwa/                        # PWA source (HTML/CSS/JS)
│   ├── index.html
│   ├── app.js                  # Core balance logic, chart rendering
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
│
├── android/                    # Native Android module
│   ├── NotificationService.kt  # NotificationListenerService
│   ├── WebAppInterface.java     # JavascriptInterface bridge
│   ├── OnboardingActivity.kt   # First-launch permission flow
│   └── AndroidManifest.xml     # Permissions and service declarations
│
└── README.md
```

## Disclaimer

This app is a personal project built for private use. It does not connect to any banking API, does not store or transmit any financial data externally, and has no backend. All data is stored locally on the device.
