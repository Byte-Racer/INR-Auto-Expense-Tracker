package com.expensetracker.ui.fragments

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.Observer
import com.github.mikephil.charting.charts.BarChart
import com.github.mikephil.charting.charts.PieChart
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.BarData
import com.github.mikephil.charting.data.BarDataSet
import com.github.mikephil.charting.data.BarEntry
import com.github.mikephil.charting.data.PieData
import com.github.mikephil.charting.data.PieDataSet
import com.github.mikephil.charting.data.PieEntry
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import com.expensetracker.R
import com.expensetracker.data.database.AppDatabase
import com.expensetracker.data.repository.TransactionRepository
import com.expensetracker.data.repository.SettingsRepository
import com.expensetracker.databinding.FragmentHomeBinding
import com.expensetracker.ui.viewmodel.MainViewModel
import com.expensetracker.ui.viewmodel.MainViewModelFactory
import com.expensetracker.utils.CurrencyFormatter
import java.text.SimpleDateFormat
import java.util.*

class HomeFragment : Fragment() {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModel: MainViewModel
    private var chartTab = "daily"
    private var categoryTimeRange = "1M"

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val database = AppDatabase.getDatabase(requireContext())
        val transactionRepository = TransactionRepository(database.transactionDao())
        val settingsRepository = SettingsRepository(database.appSettingsDao())
        val factory = MainViewModelFactory(transactionRepository, settingsRepository)
        viewModel = ViewModelProvider(this, factory).get(MainViewModel::class.java)

        setupUI()
        observeData()
    }

    private fun setupUI() {
        binding.dailyButton.setOnClickListener {
            chartTab = "daily"
            updateChartButtons()
            updateChart()
        }

        binding.categoryButton.setOnClickListener {
            chartTab = "category"
            updateChartButtons()
            updateChart()
        }

        binding.timeRange1d.setOnClickListener {
            categoryTimeRange = "1D"
            updateTimeRangeButtons()
            updateChart()
        }

        binding.timeRange1w.setOnClickListener {
            categoryTimeRange = "1W"
            updateTimeRangeButtons()
            updateChart()
        }

        binding.timeRange1m.setOnClickListener {
            categoryTimeRange = "1M"
            updateTimeRangeButtons()
            updateChart()
        }

        binding.timeRange1y.setOnClickListener {
            categoryTimeRange = "1Y"
            updateTimeRangeButtons()
            updateChart()
        }
    }

    private fun observeData() {
        viewModel.currentBalance.observe(viewLifecycleOwner) { balance ->
            binding.balanceAmount.text = CurrencyFormatter.formatCurrency(balance)
            updateBalanceCard(balance)
        }

        viewModel.transactions.observe(viewLifecycleOwner) {
            updateChart()
            updateAlerts()
        }
    }

    private fun updateBalanceCard(balance: Double) {
        viewModel.settings.observe(viewLifecycleOwner) { settings ->
            if (settings != null) {
                val initialTotal = settings.initialCashBalance + settings.initialBankBalance
                val isWarning = if (settings.warningThresholdType == "percentage") {
                    balance <= (initialTotal * settings.warningThresholdValue) / 100
                } else {
                    balance <= settings.warningThresholdValue
                }
                val isLocked = balance <= settings.lockThresholdValue

                when {
                    isLocked -> {
                        binding.balanceCard.setBackgroundColor(Color.parseColor("#7C2D12"))
                        binding.warningText.visibility = View.GONE
                        binding.lockedText.visibility = View.VISIBLE
                    }
                    isWarning -> {
                        binding.balanceCard.setBackgroundColor(Color.parseColor("#78350F"))
                        binding.warningText.visibility = View.VISIBLE
                        binding.lockedText.visibility = View.GONE
                    }
                    else -> {
                        binding.balanceCard.setBackgroundColor(Color.parseColor("#18181B"))
                        binding.warningText.visibility = View.GONE
                        binding.lockedText.visibility = View.GONE
                    }
                }
            }
        }
    }

    private fun updateChart() {
        when (chartTab) {
            "daily" -> showDailyChart()
            "category" -> showCategoryChart()
        }
    }

    private fun showDailyChart() {
        val transactions = viewModel.transactions.value ?: emptyList()
        val last30Days = (0 until 30).map { i ->
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -i)
            Pair(SimpleDateFormat("MMM dd", Locale.getDefault()).format(cal.time), 0.0)
        }.reversed().associate { it.first to it.second }.toMutableMap()

        transactions.filter { it.type == "expense" }.forEach { tx ->
            val date = SimpleDateFormat("MMM dd", Locale.getDefault()).format(Date(tx.timestamp))
            last30Days[date] = (last30Days[date] ?: 0.0) + tx.amount
        }

        val entries = last30Days.entries.mapIndexed { index, entry ->
            BarEntry(index.toFloat(), entry.value.toFloat())
        }

        val dataSet = BarDataSet(entries, "Daily Spending").apply {
            color = Color.parseColor("#10B981")
            valueTextColor = Color.WHITE
        }

        val barChart = binding.barChart
        barChart.data = BarData(dataSet)
        barChart.invalidate()
    }

    private fun showCategoryChart() {
        val transactions = viewModel.transactions.value ?: emptyList()
        val now = Calendar.getInstance()

        val filtered = transactions.filter { tx ->
            if (tx.type != "expense") return@filter false
            val txCal = Calendar.getInstance().apply {
                time = Date(tx.timestamp)
            }
            when (categoryTimeRange) {
                "1D" -> txCal.get(Calendar.DAY_OF_YEAR) == now.get(Calendar.DAY_OF_YEAR)
                "1W" -> txCal.get(Calendar.WEEK_OF_YEAR) == now.get(Calendar.WEEK_OF_YEAR)
                "1M" -> txCal.get(Calendar.MONTH) == now.get(Calendar.MONTH)
                "1Y" -> txCal.get(Calendar.YEAR) == now.get(Calendar.YEAR)
                else -> true
            }
        }

        val grouped = filtered.groupingBy { it.category }
            .fold(0.0) { acc, tx -> acc + tx.amount }

        val entries = grouped.map { (category, amount) ->
            PieEntry(amount.toFloat(), category)
        }

        val colors = listOf(
            Color.parseColor("#10B981"),
            Color.parseColor("#3B82F6"),
            Color.parseColor("#F59E0B"),
            Color.parseColor("#EF4444"),
            Color.parseColor("#8B5CF6"),
            Color.parseColor("#EC4899"),
            Color.parseColor("#6366F1")
        )

        val dataSet = PieDataSet(entries, "").apply {
            setColors(colors)
            valueTextColor = Color.WHITE
        }

        val pieChart = binding.pieChart
        pieChart.data = PieData(dataSet)
        pieChart.invalidate()
    }

    private fun updateAlerts() {
        val transactions = viewModel.transactions.value ?: emptyList()
        val warnings = transactions.count { it.isWarning }
        val locks = transactions.count { it.isLocked }
        binding.alertsText.text = "$warnings Warnings • $locks Locks"
    }

    private fun updateChartButtons() {
        binding.dailyButton.setBackgroundColor(
            if (chartTab == "daily") Color.parseColor("#27272A") else Color.parseColor("#18181B")
        )
        binding.categoryButton.setBackgroundColor(
            if (chartTab == "category") Color.parseColor("#27272A") else Color.parseColor("#18181B")
        )

        binding.timeRangeGroup.visibility = if (chartTab == "category") View.VISIBLE else View.GONE
    }

    private fun updateTimeRangeButtons() {
        binding.timeRange1d.setBackgroundColor(
            if (categoryTimeRange == "1D") Color.parseColor("#27272A") else Color.parseColor("#18181B")
        )
        binding.timeRange1w.setBackgroundColor(
            if (categoryTimeRange == "1W") Color.parseColor("#27272A") else Color.parseColor("#18181B")
        )
        binding.timeRange1m.setBackgroundColor(
            if (categoryTimeRange == "1M") Color.parseColor("#27272A") else Color.parseColor("#18181B")
        )
        binding.timeRange1y.setBackgroundColor(
            if (categoryTimeRange == "1Y") Color.parseColor("#27272A") else Color.parseColor("#18181B")
        )
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
