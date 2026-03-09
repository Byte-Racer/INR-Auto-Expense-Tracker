package com.expensetracker.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.expensetracker.data.database.AppDatabase
import com.expensetracker.data.repository.TransactionRepository
import com.expensetracker.data.repository.SettingsRepository
import com.expensetracker.databinding.FragmentAlertsBinding
import com.expensetracker.ui.viewmodel.MainViewModel
import com.expensetracker.ui.viewmodel.MainViewModelFactory
import com.expensetracker.ui.adapters.AlertAdapter

class AlertsFragment : Fragment() {
    private var _binding: FragmentAlertsBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: MainViewModel
    private lateinit var adapter: AlertAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAlertsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val database = AppDatabase.getDatabase(requireContext())
        val transactionRepository = TransactionRepository(database.transactionDao())
        val settingsRepository = SettingsRepository(database.appSettingsDao())
        val factory = MainViewModelFactory(transactionRepository, settingsRepository)
        viewModel = ViewModelProvider(this, factory).get(MainViewModel::class.java)

        adapter = AlertAdapter()

        binding.recyclerView.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@AlertsFragment.adapter
        }

        viewModel.transactions.observe(viewLifecycleOwner) { transactions ->
            val alerts = transactions.filter { it.isWarning || it.isLocked }
            if (alerts.isEmpty()) {
                binding.emptyText.visibility = View.VISIBLE
                binding.recyclerView.visibility = View.GONE
            } else {
                binding.emptyText.visibility = View.GONE
                binding.recyclerView.visibility = View.VISIBLE
                adapter.submitList(alerts.sortedByDescending { it.timestamp })
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
