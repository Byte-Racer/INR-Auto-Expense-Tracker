package com.expensetracker.utils

import java.util.regex.Pattern

data class ParsedBankTransaction(
    val amount: Double,
    val type: String,
    val bank: String,
    val accountType: String,
    val balance: Double?
)

object BankTransactionParser {
    private val patterns = listOf(
        BankPattern(
            name = "HDFC",
            amountPattern = "(?:Rs\\.?\\s*|INR\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)",
            typePattern = "(?:debited|credited)",
            balancePattern = "(?:balance[:\\s]+Rs\\.?\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)"
        ),
        BankPattern(
            name = "ICICI",
            amountPattern = "(?:Rs\\.?|INR)\\s*(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)",
            typePattern = "(?:debited|credited)",
            balancePattern = "(?:available balance[:\\s]+Rs\\.?\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)"
        ),
        BankPattern(
            name = "SBI",
            amountPattern = "(?:Rs\\s*|INR\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)",
            typePattern = "(?:debited|credited)",
            balancePattern = "(?:balance[:\\s]+Rs\\.?\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)"
        ),
        BankPattern(
            name = "Kotak",
            amountPattern = "(?:Rs\\.?\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)",
            typePattern = "(?:debited|credited)",
            balancePattern = "(?:balance[:\\s]+Rs\\.?\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)"
        ),
        BankPattern(
            name = "Axis",
            amountPattern = "(?:Rs\\.?\\s*|INR\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)",
            typePattern = "(?:debited|credited)",
            balancePattern = "(?:available balance[:\\s]+Rs\\.?\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)"
        )
    )

    fun parseTransaction(message: String): ParsedBankTransaction? {
        val lowerMessage = message.lowercase()

        for (pattern in patterns) {
            if (lowerMessage.contains(pattern.name.lowercase())) {
                val amountMatcher = Pattern.compile(pattern.amountPattern, Pattern.CASE_INSENSITIVE)
                    .matcher(message)

                if (amountMatcher.find()) {
                    val amountStr = amountMatcher.group(1).replace(",", "")
                    val amount = amountStr.toDoubleOrNull() ?: return null

                    val isDebit = lowerMessage.contains("debit")
                    val isCredit = lowerMessage.contains("credit")
                    val type = when {
                        isDebit -> "expense"
                        isCredit -> "income"
                        else -> return null
                    }

                    val balanceMatcher = Pattern.compile(pattern.balancePattern, Pattern.CASE_INSENSITIVE)
                        .matcher(message)
                    val balance = if (balanceMatcher.find()) {
                        balanceMatcher.group(1).replace(",", "").toDoubleOrNull()
                    } else {
                        null
                    }

                    return ParsedBankTransaction(
                        amount = amount,
                        type = type,
                        bank = pattern.name,
                        accountType = "Bank",
                        balance = balance
                    )
                }
            }
        }
        return null
    }

    private data class BankPattern(
        val name: String,
        val amountPattern: String,
        val typePattern: String,
        val balancePattern: String
    )
}
