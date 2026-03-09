package com.expensetracker.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "app_settings")
data class AppSettings(
    @PrimaryKey
    val id: Int = 1,
    val username: String = "",
    val initialCashBalance: Double = 0.0,
    val initialBankBalance: Double = 0.0,
    val warningThresholdType: String = "percentage",
    val warningThresholdValue: Double = 20.0,
    val lockThresholdValue: Double = 0.0,
    val expenseCategories: String = "Food,Transport,Shopping,Entertainment,Utilities,Healthcare,Other",
    val incomeCategories: String = "Salary,Bonus,Freelance,Investment,Other",
    val autoDetectEnabled: Boolean = true
)
