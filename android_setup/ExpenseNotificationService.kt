package com.yourdomain.expensetracker

import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class ExpenseNotificationService : NotificationListenerService() {

    companion object {
        const val ACTION_TRANSACTION_RECEIVED = "com.yourdomain.expensetracker.TRANSACTION_RECEIVED"
        private const val TAG = "ExpenseNotificationSvc"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName ?: return
        val extras = sbn.notification.extras
        val text = extras.getCharSequence(android.app.Notification.EXTRA_TEXT)?.toString() ?: return
        val title = extras.getCharSequence(android.app.Notification.EXTRA_TITLE)?.toString() ?: ""

        val lowerPackage = packageName.lowercase()
        val lowerText = text.lowercase()
        val lowerTitle = title.lowercase()

        // Filter out non-transaction notifications
        val bankKeywords = listOf("bank", "hdfc", "sbi", "icici", "kotak", "axis")
        val isBankApp = bankKeywords.any { lowerPackage.contains(it) }

        val hasCurrency = listOf("rs", "inr", "₹").any { lowerText.contains(it) || lowerTitle.contains(it) }
        val hasTransaction = listOf("debited", "credited", "debit", "credit").any { lowerText.contains(it) || lowerTitle.contains(it) }

        // Only process if it's from a bank app OR contains both currency and transaction keywords
        if (!isBankApp && !(hasCurrency && hasTransaction)) {
            return
        }

        parseAndBroadcast(text)
    }

    private fun parseAndBroadcast(text: String) {
        var type = ""
        var amount = ""
        var last4 = ""

        // Regex patterns for Indian banks
        
        // 1. Kotak Regex: Highest priority. Matches "INR 500.00 has been debited from your Kotak Bank" and "credited to your Kotak Bank"
        val kotakRegex = Regex("INR\\s*([\\d,]+(?:\\.\\d+)?)\\s+(?:has\\s+been\\s+)?(debited|credited)\\s+(?:from|to)\\s+your\\s+Kotak", RegexOption.IGNORE_CASE)
        val kotakMatch = kotakRegex.find(text)

        // 2. HDFC Regex: Matches "Rs.500.00 debited from a/c XX1234" and "Rs.500.00 credited to a/c XX1234"
        val hdfcRegex = Regex("Rs\\.?\\s*([\\d,]+(?:\\.\\d+)?)\\s+(debited|credited)\\s+(?:from|to)\\s+a/c\\s+X*(\\d{4})", RegexOption.IGNORE_CASE)
        val hdfcMatch = hdfcRegex.find(text)

        // 3. SBI Regex: Matches "Your A/c XXXXXX debited by INR 500" and "credited by INR 500"
        val sbiRegex = Regex("A/c\\s+([X\\d]+)\\s+(debited|credited)\\s+by\\s+INR\\s*([\\d,]+(?:\\.\\d+)?)", RegexOption.IGNORE_CASE)
        val sbiMatch = sbiRegex.find(text)

        // 4. ICICI Regex: Matches "ICICI Bank Acct XX1234 debited with INR 500" and "credited with INR 500"
        val iciciRegex = Regex("Acct\\s+X*(\\d{4})\\s+(debited|credited)\\s+with\\s+INR\\s*([\\d,]+(?:\\.\\d+)?)", RegexOption.IGNORE_CASE)
        val iciciMatch = iciciRegex.find(text)

        // 5. Axis Regex: Matches "Rs.500 debited from Axis Bank A/c XX1234" and "credited to Axis Bank A/c"
        val axisRegex = Regex("Rs\\.?\\s*([\\d,]+(?:\\.\\d+)?)\\s+(debited|credited)\\s+(?:from|to)\\s+Axis\\s+Bank\\s+A/c(?:\\s+X*(\\d{4}))?", RegexOption.IGNORE_CASE)
        val axisMatch = axisRegex.find(text)

        // Evaluate matches in priority order
        if (kotakMatch != null && text.contains("Kotak", ignoreCase = true)) {
            amount = kotakMatch.groupValues[1].replace(",", "")
            type = if (kotakMatch.groupValues[2].lowercase().contains("debit")) "debit" else "credit"
        } else if (hdfcMatch != null) {
            amount = hdfcMatch.groupValues[1].replace(",", "")
            type = if (hdfcMatch.groupValues[2].lowercase().contains("debit")) "debit" else "credit"
            last4 = hdfcMatch.groupValues[3]
        } else if (sbiMatch != null) {
            val acc = sbiMatch.groupValues[1]
            val digits = acc.filter { it.isDigit() }
            last4 = if (digits.length >= 4) digits.takeLast(4) else digits
            type = if (sbiMatch.groupValues[2].lowercase().contains("debit")) "debit" else "credit"
            amount = sbiMatch.groupValues[3].replace(",", "")
        } else if (iciciMatch != null) {
            last4 = iciciMatch.groupValues[1]
            type = if (iciciMatch.groupValues[2].lowercase().contains("debit")) "debit" else "credit"
            amount = iciciMatch.groupValues[3].replace(",", "")
        } else if (axisMatch != null) {
            amount = axisMatch.groupValues[1].replace(",", "")
            type = if (axisMatch.groupValues[2].lowercase().contains("debit")) "debit" else "credit"
            last4 = axisMatch.groupValues.getOrNull(3) ?: ""
        } else {
            // Generic fallback pattern
            val genericRegex = Regex("(?:Rs\\.?|INR|₹)\\s*([\\d,]+(?:\\.\\d+)?).*?(debited|credited).*?(?:[A]/[cC]|Acct|Account).*?([X*\\d]+)?", RegexOption.IGNORE_CASE)
            val genericMatch = genericRegex.find(text)
            if (genericMatch != null) {
                amount = genericMatch.groupValues[1].replace(",", "")
                type = if (genericMatch.groupValues[2].lowercase().contains("debit")) "debit" else "credit"
                
                val accParam = genericMatch.groupValues.getOrNull(3) ?: ""
                val digits = accParam.filter { it.isDigit() }
                last4 = if (digits.length >= 4) digits.takeLast(4) else digits
            }
        }

        if (amount.isNotEmpty() && type.isNotEmpty()) {
            Log.d(TAG, "Parsed Transaction - Type: ${"$"}{type}, Amount: ${"$"}{amount}, Last4: ${"$"}{last4}")
            val broadcastIntent = Intent(ACTION_TRANSACTION_RECEIVED)
            broadcastIntent.putExtra("type", type)
            broadcastIntent.putExtra("amount", amount)
            broadcastIntent.putExtra("last4", last4)
            sendBroadcast(broadcastIntent)
        }
    }
}
