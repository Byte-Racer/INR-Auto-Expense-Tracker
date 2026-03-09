package com.expensetracker.ui

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.NavigationUI
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.expensetracker.R
import com.expensetracker.data.database.AppDatabase
import com.expensetracker.data.repository.TransactionRepository
import com.expensetracker.data.repository.SettingsRepository
import com.expensetracker.databinding.ActivityMainBinding
import com.expensetracker.ui.viewmodel.MainViewModel
import com.expensetracker.ui.viewmodel.MainViewModelFactory
import androidx.lifecycle.ViewModelProvider

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val database = AppDatabase.getDatabase(applicationContext)
        val transactionRepository = TransactionRepository(database.transactionDao())
        val settingsRepository = SettingsRepository(database.appSettingsDao())
        val factory = MainViewModelFactory(transactionRepository, settingsRepository)
        viewModel = ViewModelProvider(this, factory).get(MainViewModel::class.java)

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController

        val bottomNav = binding.bottomNavigation
        NavigationUI.setupWithNavController(bottomNav, navController)

        checkSetupCompletion()
    }

    private fun checkSetupCompletion() {
        val settings = viewModel.settings.value
        if (settings == null || settings.username.isEmpty()) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
        }
    }
}
