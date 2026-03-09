package com.expensetracker.ui.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.expensetracker.data.entities.Transaction
import com.expensetracker.databinding.ItemAlertBinding
import com.expensetracker.utils.CurrencyFormatter
import com.expensetracker.utils.DateUtils

class AlertAdapter : ListAdapter<Transaction, AlertAdapter.ViewHolder>(AlertDiffUtil) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        return ViewHolder(
            ItemAlertBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        )
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemAlertBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(transaction: Transaction) {
            binding.apply {
                categoryText.text = transaction.category
                amountText.text = CurrencyFormatter.formatCurrencyFull(transaction.amount)
                dateText.text = DateUtils.formatDate(transaction.date)

                if (transaction.isLocked) {
                    alertType.text = "Locked"
                    alertType.setTextColor(Color.parseColor("#EF4444"))
                    alertCard.setCardBackgroundColor(Color.parseColor("#7C2D12"))
                } else if (transaction.isWarning) {
                    alertType.text = "Warning"
                    alertType.setTextColor(Color.parseColor("#F59E0B"))
                    alertCard.setCardBackgroundColor(Color.parseColor("#78350F"))
                }
            }
        }
    }

    object AlertDiffUtil : DiffUtil.ItemCallback<Transaction>() {
        override fun areItemsTheSame(oldItem: Transaction, newItem: Transaction) =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Transaction, newItem: Transaction) =
            oldItem == newItem
    }
}
