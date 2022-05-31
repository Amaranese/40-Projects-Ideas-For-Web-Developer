package com.simplemobiletools.clock.activities

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.widget.SeekBar
import com.simplemobiletools.clock.R
import com.simplemobiletools.clock.extensions.config
import com.simplemobiletools.clock.helpers.MyAnalogueTimeWidgetProvider
import com.simplemobiletools.commons.dialogs.ColorPickerDialog
import com.simplemobiletools.commons.dialogs.WidgetLockedDialog
import com.simplemobiletools.commons.extensions.*
import com.simplemobiletools.commons.helpers.IS_CUSTOMIZING_COLORS
import kotlinx.android.synthetic.main.widget_config_analogue.*

class WidgetAnalogueConfigureActivity : SimpleActivity() {
    private var mBgAlpha = 0f
    private var mWidgetId = 0
    private var mBgColor = 0
    private var mBgColorWithoutTransparency = 0
    private var mWidgetLockedDialog: WidgetLockedDialog? = null

    public override fun onCreate(savedInstanceState: Bundle?) {
        useDynamicTheme = false
        super.onCreate(savedInstanceState)
        setResult(Activity.RESULT_CANCELED)
        setContentView(R.layout.widget_config_analogue)
        initVariables()

        val isCustomizingColors = intent.extras?.getBoolean(IS_CUSTOMIZING_COLORS) ?: false
        mWidgetId = intent.extras?.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (mWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID && !isCustomizingColors) {
            finish()
        }

        config_analogue_save.setOnClickListener { saveConfig() }
        config_analogue_bg_color.setOnClickListener { pickBackgroundColor() }

        val primaryColor = getProperPrimaryColor()
        config_analogue_bg_seekbar.setColors(getProperTextColor(), primaryColor, primaryColor)

        if (!isCustomizingColors && !isOrWasThankYouInstalled()) {
            mWidgetLockedDialog = WidgetLockedDialog(this) {
                if (!isOrWasThankYouInstalled()) {
                    finish()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        window.decorView.setBackgroundColor(0)

        if (mWidgetLockedDialog != null && isOrWasThankYouInstalled()) {
            mWidgetLockedDialog?.dismissDialog()
        }
    }

    private fun initVariables() {
        mBgColor = config.widgetBgColor
        mBgAlpha = Color.alpha(mBgColor) / 255.toFloat()
        mBgColorWithoutTransparency = Color.rgb(Color.red(mBgColor), Color.green(mBgColor), Color.blue(mBgColor))

        config_analogue_bg_seekbar.setOnSeekBarChangeListener(bgSeekbarChangeListener)
        config_analogue_bg_seekbar.progress = (mBgAlpha * 100).toInt()
        updateBackgroundColor()
    }

    private fun saveConfig() {
        storeWidgetColors()
        requestWidgetUpdate()

        Intent().apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, mWidgetId)
            setResult(Activity.RESULT_OK, this)
        }
        finish()
    }

    private fun storeWidgetColors() {
        config.apply {
            widgetBgColor = mBgColor
        }
    }

    private fun pickBackgroundColor() {
        ColorPickerDialog(this, mBgColorWithoutTransparency) { wasPositivePressed, color ->
            if (wasPositivePressed) {
                mBgColorWithoutTransparency = color
                updateBackgroundColor()
            }
        }
    }

    private fun requestWidgetUpdate() {
        Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE, null, this, MyAnalogueTimeWidgetProvider::class.java).apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(mWidgetId))
            sendBroadcast(this)
        }
    }

    private fun updateBackgroundColor() {
        mBgColor = mBgColorWithoutTransparency.adjustAlpha(mBgAlpha)
        config_analogue_bg_color.setFillWithStroke(mBgColor, mBgColor)
        config_analogue_background.applyColorFilter(mBgColor)
    }

    private val bgSeekbarChangeListener = object : SeekBar.OnSeekBarChangeListener {
        override fun onProgressChanged(seekBar: SeekBar, progress: Int, fromUser: Boolean) {
            mBgAlpha = progress.toFloat() / 100.toFloat()
            updateBackgroundColor()
        }

        override fun onStartTrackingTouch(seekBar: SeekBar) {}

        override fun onStopTrackingTouch(seekBar: SeekBar) {}
    }
}
