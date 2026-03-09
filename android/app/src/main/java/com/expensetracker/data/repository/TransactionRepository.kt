package com.expensetracker.data.repository

import kotlinx.coroutines.flow.Flow
import com.expensetracker.data.dao.TransactionDao
import com.expensetracker.data.entities.Transaction

class TransactionRepository(private val transactionDao: TransactionDao) {
    fun getAllTransactions(): Flow<List<Transaction>> = transactionDao.getAllTransactions()

    fun getTransactionsByType(type: String): Flow<List<Transaction>> =
        transactionDao.getTransactionsByType(type)

    fun getTransactionsByWallet(wallet: String): Flow<List<Transaction>> =
        transactionDao.getTransactionsByWallet(wallet)

    suspend fun addTransaction(transaction: Transaction): Long =
        transactionDao.insert(transaction)

    suspend fun updateTransaction(transaction: Transaction) =
        transactionDao.update(transaction)

    suspend fun deleteTransaction(transaction: Transaction) =
        transactionDao.delete(transaction)

    suspend fun getTransactionById(id: Int): Transaction? =
        transactionDao.getTransactionById(id)

    suspend fun deleteAll() = transactionDao.deleteAll()
}
