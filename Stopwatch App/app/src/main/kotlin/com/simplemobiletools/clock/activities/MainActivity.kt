package com.simplemobiletools.clock.activities

import android.content.Intent
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.WindowManager
import com.simplemobiletools.clock.BuildConfig
import com.simplemobiletools.clock.R
import com.simplemobiletools.clock.adapters.ViewPagerAdapter
import com.simplemobiletools.clock.extensions.config
import com.simplemobiletools.clock.extensions.getNextAlarm
import com.simplemobiletools.clock.extensions.rescheduleEnabledAlarms
import com.simplemobiletools.clock.extensions.updateWidgets
import com.simplemobiletools.clock.helpers.*
import com.simplemobiletools.commons.extensions.*
import com.simplemobiletools.commons.helpers.LICENSE_NUMBER_PICKER
import com.simplemobiletools.commons.helpers.LICENSE_RTL
import com.simplemobiletools.commons.helpers.LICENSE_STETHO
import com.simplemobiletools.commons.helpers.ensureBackgroundThread
import com.simplemobiletools.commons.models.FAQItem
import kotlinx.android.synthetic.main.activity_main.*

class MainActivity : SimpleActivity() {
    private var storedTextColor = 0
    private var storedBackgroundColor = 0
    private var storedPrimaryColor = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        appLaunched(BuildConfig.APPLICATION_ID)
        storeStateVariables()
        initFragments()
        updateWidgets()

        if (getNextAlarm().isEmpty()) {
            ensureBackgroundThread {
                rescheduleEnabledAlarms()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        val configTextColor = getProperTextColor()
        if (storedTextColor != configTextColor) {
            getInactiveTabIndexes(view_pager.currentItem).forEach {
                main_tabs_holder.getTabAt(it)?.icon?.applyColorFilter(configTextColor)
            }
        }

        val configBackgroundColor = getProperBackgroundColor()
        if (storedBackgroundColor != configBackgroundColor) {
            main_tabs_holder.background = ColorDrawable(configBackgroundColor)
        }

        val configPrimaryColor = getProperPrimaryColor()
        if (storedPrimaryColor != configPrimaryColor) {
            main_tabs_holder.setSelectedTabIndicatorColor(getProperPrimaryColor())
            main_tabs_holder.getTabAt(view_pager.currentItem)?.icon?.applyColorFilter(getProperPrimaryColor())
        }

        if (config.preventPhoneFromSleeping) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    override fun onPause() {
        super.onPause()
        storeStateVariables()
        if (config.preventPhoneFromSleeping) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        config.lastUsedViewPagerPage = view_pager.currentItem
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu, menu)
        menu.apply {
            findItem(R.id.sort).isVisible = view_pager.currentItem == TAB_ALARM
            updateMenuItemColors(this)
        }

        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.sort -> getViewPagerAdapter()?.showAlarmSortDialog()
            R.id.settings -> launchSettings()
            R.id.about -> launchAbout()
            else -> return super.onOptionsItemSelected(item)
        }
        return true
    }

    override fun onNewIntent(intent: Intent) {
        if (intent.extras?.containsKey(OPEN_TAB) == true) {
            val tabToOpen = intent.getIntExtra(OPEN_TAB, TAB_CLOCK)
            view_pager.setCurrentItem(tabToOpen, false)
            if (tabToOpen == TAB_TIMER) {
                val timerId = intent.getIntExtra(TIMER_ID, INVALID_TIMER_ID)
                (view_pager.adapter as ViewPagerAdapter).updateTimerPosition(timerId)
            }
        }
        super.onNewIntent(intent)
    }

    private fun storeStateVariables() {
        storedTextColor = getProperTextColor()
        storedBackgroundColor = getProperBackgroundColor()
        storedPrimaryColor = getProperPrimaryColor()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, resultData: Intent?) {
        super.onActivityResult(requestCode, resultCode, resultData)
        if (requestCode == PICK_AUDIO_FILE_INTENT_ID && resultCode == RESULT_OK && resultData != null) {
            storeNewAlarmSound(resultData)
        }
    }

    private fun storeNewAlarmSound(resultData: Intent) {
        val newAlarmSound = storeNewYourAlarmSound(resultData)

        when (view_pager.currentItem) {
            TAB_ALARM -> getViewPagerAdapter()?.updateAlarmTabAlarmSound(newAlarmSound)
            TAB_TIMER -> getViewPagerAdapter()?.updateTimerTabAlarmSound(newAlarmSound)
        }
    }

    fun updateClockTabAlarm() {
        getViewPagerAdapter()?.updateClockTabAlarm()
    }

    private fun getViewPagerAdapter() = view_pager.adapter as? ViewPagerAdapter

    private fun initFragments() {
        val viewPagerAdapter = ViewPagerAdapter(supportFragmentManager)
        view_pager.adapter = viewPagerAdapter
        view_pager.onPageChangeListener {
            main_tabs_holder.getTabAt(it)?.select()
            invalidateOptionsMenu()
        }

        val tabToOpen = intent.getIntExtra(OPEN_TAB, config.lastUsedViewPagerPage)
        intent.removeExtra(OPEN_TAB)
        if (tabToOpen == TAB_TIMER) {
            val timerId = intent.getIntExtra(TIMER_ID, INVALID_TIMER_ID)
            viewPagerAdapter.updateTimerPosition(timerId)
        }
        view_pager.currentItem = tabToOpen
        view_pager.offscreenPageLimit = TABS_COUNT - 1
        main_tabs_holder.onTabSelectionChanged(
            tabUnselectedAction = {
                it.icon?.applyColorFilter(getProperTextColor())
            },
            tabSelectedAction = {
                view_pager.currentItem = it.position
                it.icon?.applyColorFilter(getProperPrimaryColor())
            }
        )

        setupTabColors(tabToOpen)
    }

    private fun setupTabColors(lastUsedTab: Int) {
        main_tabs_holder.apply {
            background = ColorDrawable(getProperBackgroundColor())
            setSelectedTabIndicatorColor(getProperPrimaryColor())
            getTabAt(lastUsedTab)?.apply {
                select()
                icon?.applyColorFilter(getProperPrimaryColor())
            }

            getInactiveTabIndexes(lastUsedTab).forEach {
                getTabAt(it)?.icon?.applyColorFilter(getProperTextColor())
            }
        }
    }

    private fun getInactiveTabIndexes(activeIndex: Int) = arrayListOf(0, 1, 2, 3).filter { it != activeIndex }

    private fun launchSettings() {
        startActivity(Intent(applicationContext, SettingsActivity::class.java))
    }

    private fun launchAbout() {
        val licenses = LICENSE_STETHO or LICENSE_NUMBER_PICKER or LICENSE_RTL

        val faqItems = arrayListOf(
            FAQItem(R.string.faq_1_title, R.string.faq_1_text),
            FAQItem(R.string.faq_1_title_commons, R.string.faq_1_text_commons),
            FAQItem(R.string.faq_4_title_commons, R.string.faq_4_text_commons),
            FAQItem(R.string.faq_2_title_commons, R.string.faq_2_text_commons),
            FAQItem(R.string.faq_6_title_commons, R.string.faq_6_text_commons),
            FAQItem(R.string.faq_9_title_commons, R.string.faq_9_text_commons)
        )

        startAboutActivity(R.string.app_name, licenses, BuildConfig.VERSION_NAME, faqItems, true)
    }
}
