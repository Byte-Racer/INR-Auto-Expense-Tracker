package com.expensetracker.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.expensetracker.data.database.AppDatabase
import com.expensetracker.data.repository.TransactionRepository
import com.expensetracker.data.repository.SettingsRepository
import com.expensetracker.databinding.FragmentWalletsBinding
import com.expensetracker.ui.viewmodel.MainViewModel
import com.expensetracker.ui.viewmodel.MainViewModelFactory
import com.expensetracker.utils.CurrencyFormatter

class WalletsFragment : Fragment() {
    private var _binding: FragmentWalletsBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: MainViewModel

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWalletsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val database = AppDatabase.getDatabase(requireContext())
        val transactionRepository = TransactionRepository(database.transactionDao())
        val settingsRepository = SettingsRepository(database.appSettingsDao())
        val factory = MainViewModelFactory(transactionRepository, settingsRepository)
        viewModel = ViewModelProvider(this, factory).get(MainViewModel::class.java)

        viewModel.transactions.observe(viewLifecycleOwner) {
            updateBalances()
        }

        viewModel.settings.observe(viewLifecycleOwner) {
            updateBalances()
        }
    }

    private fun updateBalances() {
        val transactions = viewModel.transactions.value ?: emptyList()
        val settings = viewModel.settings.value ?: return

        var cashBalance = settings.initialCashBalance
        var bankBalance = settings.initialBankBalance

        transactions.forEach { tx ->
            val amount = if (tx.type == "income") tx.amount else -tx.amount
            when (tx.wallet) {
                "Cash" -> cashBalance += amount
                "Bank" -> bankBalance += amount
            }
        }

        binding.cashAmount.text = CurrencyFormatter.formatCurrencyFull(cashBalance)
        binding.bankAmount.text = CurrencyFormatter.formatCurrencyFull(bankBalance)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
