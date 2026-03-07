package com.yourdomain.expensetracker

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.os.Handler
import android.os.Looper

class WebAppInterface(private val context: Context, private val webView: WebView) {

    /**
     * Receives parsed data from the NotificationListenerService (e.g. via BroadcastReceiver)
     * Calls webView.evaluateJavascript() to pass this data into the PWA.
     * 
     * Note: @JavascriptInterface annotation exposes it to JS, meaning JS could also call "Android.onTransactionReceived(...)"
     * if you wanted to test it backwards.
     */
    @JavascriptInterface
    fun onTransactionReceived(type: String, amount: String, last4: String) {
        val uiHandler = Handler(Looper.getMainLooper())
        uiHandler.post {
            val safeType = type.replace("'", "\\'")
            val safeAmount = amount.replace("'", "\\'")
            val safeLast4 = last4.replace("'", "\\'")

            // Invokes the JS function defined in the PWA window object
            val jsCall = "if (window.onNativeTransaction) { window.onNativeTransaction('$safeType', '$safeAmount', '$safeLast4'); } else { console.warn('Native transaction fired but window.onNativeTransaction is not defined'); }"
            webView.evaluateJavascript(jsCall, null)
        }
    }
}
