package com.expensetracker.ui

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.expensetracker.databinding.ActivitySetupBinding
import com.expensetracker.data.database.AppDatabase
import com.expensetracker.data.entities.AppSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SetupActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySetupBinding
    private val scope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySetupBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
    }

    private fun setupUI() {
        binding.continueButton.setOnClickListener {
            val username = binding.usernameInput.text.toString()
            val cashBalance = binding.cashBalanceInput.text.toString().toDoubleOrNull() ?: 0.0
            val bankBalance = binding.bankBalanceInput.text.toString().toDoubleOrNull() ?: 0.0

            if (username.isNotEmpty()) {
                saveSettings(username, cashBalance, bankBalance)
            }
        }
    }

    private fun saveSettings(username: String, cashBalance: Double, bankBalance: Double) {
        scope.launch {
            try {
                val database = AppDatabase.getDatabase(applicationContext)
                val settingsDao = database.appSettingsDao()

                val settings = AppSettings(
                    username = username,
                    initialCashBalance = cashBalance,
                    initialBankBalance = bankBalance
                )

                settingsDao.insert(settings)

                startActivity(Intent(this@SetupActivity, MainActivity::class.java))
                finish()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
