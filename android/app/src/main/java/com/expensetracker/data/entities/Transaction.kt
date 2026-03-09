package com.expensetracker.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "transactions")
data class Transaction(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val type: String,
    val amount: Double,
    val category: String,
    val wallet: String,
    val date: String,
    val description: String = "",
    val isWarning: Boolean = false,
    val isLocked: Boolean = false,
    val justification: String = "",
    val autoDetected: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
)
