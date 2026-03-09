package com.expensetracker.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.expensetracker.data.database.AppDatabase
import com.expensetracker.data.entities.Transaction
import com.expensetracker.utils.BankTransactionParser
import com.expensetracker.utils.DateUtils

class SMSReceiver : BroadcastReceiver() {
    private val scope = CoroutineScope(Dispatchers.Default)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

            for (message in messages) {
                val messageBody = message.displayMessageBody
                val sender = message.displayOriginatingAddress

                if (isBankSender(sender)) {
                    scope.launch {
                        processTransaction(context, messageBody)
                    }
                }
            }
        }
    }

    private fun isBankSender(sender: String?): Boolean {
        sender ?: return false
        val bankSenders = listOf(
            "HDFC", "ICICI", "SBI", "KOTAK", "AXIS", "BANK",
            "5267", "5676", "8008", "8009", "8050"
        )
        return bankSenders.any { sender.contains(it, ignoreCase = true) }
    }

    private suspend fun processTransaction(context: Context, messageBody: String) {
        val parsedTx = BankTransactionParser.parseTransaction(messageBody) ?: return

        try {
            val database = AppDatabase.getDatabase(context)
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
                description = "${parsedTx.bank} - Auto-detected from SMS",
                autoDetected = true
            )

            transactionDao.insert(transaction)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
