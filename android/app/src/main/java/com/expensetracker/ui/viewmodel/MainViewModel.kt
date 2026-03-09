package com.expensetracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.asLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import com.expensetracker.data.entities.AppSettings
import com.expensetracker.data.entities.Transaction
import com.expensetracker.data.repository.SettingsRepository
import com.expensetracker.data.repository.TransactionRepository

class MainViewModel(
    private val transactionRepository: TransactionRepository,
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    val transactions = transactionRepository.getAllTransactions().asLiveData()
    val settings = settingsRepository.getSettings().asLiveData()

    private val _currentBalance = MutableStateFlow(0.0)
    val currentBalance: StateFlow<Double> = _currentBalance

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                settingsRepository.initializeSettings()
                updateBalance()
                _isLoading.value = false
            } catch (e: Exception) {
                _isLoading.value = false
                e.printStackTrace()
            }
        }
    }

    fun updateBalance() {
        viewModelScope.launch {
            try {
                val txList = transactions.value ?: emptyList()
                val settings = settingsRepository.getSettingsDirect() ?: return@launch

                var balance = settings.initialCashBalance + settings.initialBankBalance

                for (tx in txList) {
                    balance += if (tx.type == "income") tx.amount else -tx.amount
                }

                _currentBalance.value = balance
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun addTransaction(transaction: Transaction) {
        viewModelScope.launch {
            try {
                transactionRepository.addTransaction(transaction)
                updateBalance()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun updateTransaction(transaction: Transaction) {
        viewModelScope.launch {
            try {
                transactionRepository.updateTransaction(transaction)
                updateBalance()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun deleteTransaction(transaction: Transaction) {
        viewModelScope.launch {
            try {
                transactionRepository.deleteTransaction(transaction)
                updateBalance()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun updateSettings(settings: AppSettings) {
        viewModelScope.launch {
            try {
                settingsRepository.updateSettings(settings)
                updateBalance()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}

class MainViewModelFactory(
    private val transactionRepository: TransactionRepository,
    private val settingsRepository: SettingsRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MainViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MainViewModel(transactionRepository, settingsRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
