package com.yourdomain.expensetracker

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat

class OnboardingActivity : AppCompatActivity() {

    private lateinit var prefs: SharedPreferences
    private val handler = Handler(Looper.getMainLooper())
    private var isWaitingForNotificationAccess = false

    // Polling task to check for notification access every 2 seconds
    private val checkNotificationAccessRunnable = object : Runnable {
        override fun run() {
            if (hasNotificationAccess()) {
                isWaitingForNotificationAccess = false
                proceedToBatterySetup()
            } else {
                handler.postDelayed(this, 2000) 
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

        // If completed, just finish and let the launcher route to the main TWA Activity
        if (prefs.getBoolean("onboarding_complete", false)) {
            finishAndLaunchMain()
            return
        }

        if (!hasNotificationAccess()) {
            showNotificationAccessScreen()
        } else {
            proceedToBatterySetup()
        }
    }

    private fun hasNotificationAccess(): Boolean {
        val enabledListeners = NotificationManagerCompat.getEnabledListenerPackages(this)
        return enabledListeners.contains(packageName)
    }

    private fun showNotificationAccessScreen() {
        // Step 1: Notification Access UI
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(64, 128, 64, 64)
            gravity = Gravity.CENTER_HORIZONTAL
            setBackgroundColor(Color.WHITE)
        }

        val title = TextView(this).apply {
            text = "Notification Access Required"
            textSize = 24f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.BLACK)
            setPadding(0, 0, 0, 32)
            gravity = Gravity.CENTER
        }

        val description = TextView(this).apply {
            text = "To track expenses automatically, this app needs permission to read notifications from your bank."
            textSize = 16f
            setTextColor(Color.DKGRAY)
            setPadding(0, 0, 0, 64)
            gravity = Gravity.CENTER
        }

        val button = Button(this).apply {
            text = "Grant Access"
            setOnClickListener {
                // Deep-link to notification listener settings
                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
                isWaitingForNotificationAccess = true
                handler.post(checkNotificationAccessRunnable)
            }
        }

        layout.addView(title)
        layout.addView(description)
        layout.addView(button)
        setContentView(layout)
    }

    private fun proceedToBatterySetup() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        val isIgnoringBatteryOptimizations = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            powerManager.isIgnoringBatteryOptimizations(packageName)
        } else {
            true
        }

        // Auto prompt standard battery optimization
        if (!isIgnoringBatteryOptimizations && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                data = android.net.Uri.parse("package:${"$"}{packageName}")
            }
            startActivity(intent)
        }
        
        showBatteryOptimizationScreen()
    }

    private fun showBatteryOptimizationScreen() {
        // Step 2: OnePlus/ColorOS Deep Optimization UI
        val scrollView = ScrollView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.WHITE)
        }
        
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(64, 64, 64, 64)
        }

        val title = TextView(this).apply {
            text = "OnePlus & ColorOS Battery Setup"
            textSize = 22f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.BLACK)
            setPadding(0, 0, 0, 48)
        }

        val instructions1 = TextView(this).apply {
            text = "1. OnePlus devices have an extra battery restriction called Deep Optimization / Background App Management that can still kill this app. Please do the following manually:\n\nGo to Settings → Battery → More Battery Settings → (if present) Deep Optimization → Find this app → Disable."
            textSize = 16f
            setTextColor(Color.DKGRAY)
            setPadding(0, 0, 0, 48)
        }

        val instructions2 = TextView(this).apply {
            text = "2. Go to Settings → Apps → Manage Apps → [This App] → Battery Saver → Set to 'No Restrictions'."
            textSize = 16f
            setTextColor(Color.DKGRAY)
            setPadding(0, 0, 0, 48)
        }

        val checkBox = CheckBox(this).apply {
            text = "I have disabled these restrictions"
            textSize = 16f
            setTextColor(Color.BLACK)
            setPadding(0, 0, 0, 48)
        }

        val finishButton = Button(this).apply {
            text = "Continue to App"
            isEnabled = false
            setOnClickListener {
                prefs.edit().putBoolean("onboarding_complete", true).apply()
                finishAndLaunchMain()
            }
        }

        checkBox.setOnCheckedChangeListener { _, isChecked ->
            finishButton.isEnabled = isChecked
        }

        layout.addView(title)
        layout.addView(instructions1)
        layout.addView(instructions2)
        layout.addView(checkBox)
        layout.addView(finishButton)
        
        scrollView.addView(layout)
        setContentView(scrollView)
    }

    override fun onResume() {
        super.onResume()
        if (isWaitingForNotificationAccess && hasNotificationAccess()) {
            handler.removeCallbacks(checkNotificationAccessRunnable)
            isWaitingForNotificationAccess = false
            proceedToBatterySetup()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(checkNotificationAccessRunnable)
    }

    private fun finishAndLaunchMain() {
        startActivity(Intent(this, com.google.androidbrowserhelper.trusted.LauncherActivity::class.java))
        finish()
    }
}
