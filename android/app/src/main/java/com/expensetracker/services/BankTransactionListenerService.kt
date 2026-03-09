package com.expensetracker.services

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.expensetracker.data.database.AppDatabase
import com.expensetracker.data.entities.Transaction
import com.expensetracker.utils.BankTransactionParser
import com.expensetracker.utils.DateUtils
import java.text.SimpleDateFormat
import java.util.*

class BankTransactionListenerService : NotificationListenerService() {
    private val scope = CoroutineScope(Dispatchers.Default)

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        sbn ?: return

        val packageName = sbn.packageName
        val key = sbn.key

        if (isBankNotification(packageName)) {
            val title = sbn.notification.extras.getString("android.title") ?: ""
            val text = sbn.notification.extras.getString("android.text") ?: ""
            val fullMessage = "$title $text"

            scope.launch {
                processTransaction(fullMessage, packageName)
            }
        }
    }

    private fun isBankNotification(packageName: String): Boolean {
        val bankPackages = listOf(
            "com.hdfcbank",
            "com.icicibank.android",
            "com.sbi.sbimobile",
            "com.konylabs.cbp",
            "com.axis.mobile"
        )
        return bankPackages.any { packageName.contains(it) || packageName.contains(it.split(".")[1]) }
    }

    private suspend fun processTransaction(message: String, bankPackage: String) {
        val parsedTx = BankTransactionParser.parseTransaction(message) ?: return

        try {
            val database = AppDatabase.getDatabase(applicationContext)
            val settingsDao = database.appSettingsDao()
            val transactionDao = database.transactionDao()

            val settings = settingsDao.getSettingsDirect() ?: return
            if (!settings.autoDetectEnabled) return

            val category = when {
                parsedTx.type == "expense" -> "Bank Transfer"
                else -> "Bank Deposit"
            }

            val transaction = Transaction(
                type = parsedTx.type,
                amount = parsedTx.amount,
                category = category,
                wallet = "Bank",
                date = DateUtils.getCurrentDate(),
                description = "${parsedTx.bank} - Auto-detected",
                autoDetected = true
            )

            transactionDao.insert(transaction)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
