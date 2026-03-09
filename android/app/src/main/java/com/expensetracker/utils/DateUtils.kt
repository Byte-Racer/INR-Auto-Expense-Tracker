package com.expensetracker.utils

import java.text.SimpleDateFormat
import java.util.*

object DateUtils {
    fun getCurrentDate(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
        return sdf.format(Date())
    }

    fun formatDate(dateString: String): String {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val date = sdf.parse(dateString) ?: return dateString
            val displayFormat = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
            displayFormat.format(date)
        } catch (e: Exception) {
            dateString
        }
    }

    fun formatDateWithTime(dateString: String): String {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val date = sdf.parse(dateString) ?: return dateString
            val displayFormat = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())
            displayFormat.format(date)
        } catch (e: Exception) {
            dateString
        }
    }

    fun getDateFromString(dateString: String): Date? {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            sdf.parse(dateString)
        } catch (e: Exception) {
            null
        }
    }

    fun formatDateForDisplay(dateString: String): String {
        return try {
            val parts = dateString.split("T")[0].split("-")
            if (parts.size == 3) {
                val year = parts[0]
                val month = parts[1]
                val day = parts[2]
                val monthNames = arrayOf(
                    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                )
                val monthName = if (month.toIntOrNull() in 1..12) {
                    monthNames[month.toInt()]
                } else {
                    month
                }
                "$day $monthName $year"
            } else {
                dateString
            }
        } catch (e: Exception) {
            dateString
        }
    }
}
