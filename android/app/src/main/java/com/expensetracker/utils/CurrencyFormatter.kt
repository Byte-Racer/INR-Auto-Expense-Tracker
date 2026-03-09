package com.expensetracker.utils

import java.text.DecimalFormat
import kotlin.math.abs

object CurrencyFormatter {
    fun formatCurrency(amount: Double): String {
        val absAmount = abs(amount)
        val sign = if (amount < 0) "-" else ""

        return when {
            absAmount >= 10_000_000 -> {
                val crore = absAmount / 10_000_000
                val formatted = DecimalFormat("0.##").format(crore)
                "${sign}₹$formatted Cr"
            }
            absAmount >= 100_000 -> {
                val lakh = absAmount / 100_000
                val formatted = DecimalFormat("0.##").format(lakh)
                "${sign}₹$formatted L"
            }
            absAmount >= 1_000 -> {
                val thousand = absAmount / 1_000
                val formatted = DecimalFormat("0.##").format(thousand)
                "${sign}₹$formatted K"
            }
            else -> {
                val formatted = DecimalFormat("0.00").format(absAmount)
                "${sign}₹$formatted"
            }
        }
    }

    fun formatCurrencyFull(amount: Double): String {
        return "₹" + DecimalFormat("#,##0.00").format(amount)
    }

    fun parseCurrency(input: String): Double? {
        val cleaned = input.replace("[^0-9.]".toRegex(), "")
        return cleaned.toDoubleOrNull()
    }
}
