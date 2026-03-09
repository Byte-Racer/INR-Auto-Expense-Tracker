package com.expensetracker.ui.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.expensetracker.data.entities.Transaction
import com.expensetracker.databinding.ItemTransactionBinding
import com.expensetracker.utils.CurrencyFormatter
import com.expensetracker.utils.DateUtils

class TransactionAdapter(
    private val onDelete: (Transaction) -> Unit,
    private val onUpdate: (Transaction) -> Unit
) : ListAdapter<Transaction, TransactionAdapter.ViewHolder>(TransactionDiffUtil) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        return ViewHolder(
            ItemTransactionBinding.inflate(LayoutInflater.from(parent.context), parent, false),
            onDelete,
            onUpdate
        )
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemTransactionBinding,
        private val onDelete: (Transaction) -> Unit,
        private val onUpdate: (Transaction) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        fun bind(transaction: Transaction) {
            binding.apply {
                categoryText.text = transaction.category
                amountText.text = CurrencyFormatter.formatCurrencyFull(transaction.amount)
                dateText.text = DateUtils.formatDate(transaction.date)
                walletText.text = transaction.wallet
                descriptionText.text = transaction.description

                if (transaction.type == "expense") {
                    amountText.text = "-${amountText.text}"
                } else {
                    amountText.text = "+${amountText.text}"
                }

                deleteButton.setOnClickListener {
                    onDelete(transaction)
                }
            }
        }
    }

    object TransactionDiffUtil : DiffUtil.ItemCallback<Transaction>() {
        override fun areItemsTheSame(oldItem: Transaction, newItem: Transaction) =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Transaction, newItem: Transaction) =
            oldItem == newItem
    }
}
