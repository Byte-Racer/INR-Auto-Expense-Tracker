package com.expensetracker.data.repository

import kotlinx.coroutines.flow.Flow
import com.expensetracker.data.dao.AppSettingsDao
import com.expensetracker.data.entities.AppSettings

class SettingsRepository(private val settingsDao: AppSettingsDao) {
    fun getSettings(): Flow<AppSettings?> = settingsDao.getSettings()

    suspend fun getSettingsDirect(): AppSettings? = settingsDao.getSettingsDirect()

    suspend fun updateSettings(settings: AppSettings) = settingsDao.update(settings)

    suspend fun initializeSettings() {
        if (settingsDao.getSettingsDirect() == null) {
            settingsDao.insert(AppSettings())
        }
    }
}
