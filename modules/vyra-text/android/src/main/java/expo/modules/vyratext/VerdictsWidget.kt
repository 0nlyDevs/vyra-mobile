package expo.modules.vyratext

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

/**
 * Home-screen widget: the desk's three latest verdicts and a « Vérifier » button. The app writes
 * what to show (verdicts already signed in the desk, the labels in the interface language) with
 * [save]; the widget never calls the network itself. A verdict is an icon and a word, never a
 * colour alone; a row opens that dossier, « Vérifier » opens the clipboard check.
 */
class VerdictsWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    ids.forEach { manager.updateAppWidget(it, render(context)) }
  }

  companion object {
    private const val PREFS = "vyra.widget"
    private const val KEY = "data"
    private val ROWS = listOf(
      Triple(R.id.vyra_w_row0, R.id.vyra_w_icon0, Pair(R.id.vyra_w_word0, R.id.vyra_w_text0)),
      Triple(R.id.vyra_w_row1, R.id.vyra_w_icon1, Pair(R.id.vyra_w_word1, R.id.vyra_w_text1)),
      Triple(R.id.vyra_w_row2, R.id.vyra_w_icon2, Pair(R.id.vyra_w_word2, R.id.vyra_w_text2)),
    )

    /** Stores what the widget shows and redraws every placed widget. */
    fun save(context: Context, json: String) {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, VerdictsWidget::class.java))
      ids.forEach { manager.updateAppWidget(it, render(context)) }
    }

    fun icon(verdict: String): Int = when (verdict) {
      "true" -> R.drawable.vyra_v_true
      "false" -> R.drawable.vyra_v_false
      "misleading" -> R.drawable.vyra_v_misleading
      else -> R.drawable.vyra_v_unverifiable
    }

    /** The verdict ink on paper (spec tokens, light theme), next to the word. */
    fun ink(verdict: String): Int = when (verdict) {
      "true" -> 0xFF0B6B3A.toInt()
      "false" -> 0xFFB3231A.toInt()
      "misleading" -> 0xFF8A5700.toInt()
      else -> 0xFF1D58C4.toInt()
    }

    fun render(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.vyra_widget)
      val data = try {
        JSONObject(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null) ?: "{}")
      } catch (e: Exception) {
        JSONObject()
      }
      val labels = data.optJSONObject("labels")
      views.setTextViewText(R.id.vyra_w_title, labels?.optString("title")?.ifBlank { null } ?: context.getString(R.string.vyra_widget_title))
      views.setTextViewText(R.id.vyra_w_verify, labels?.optString("verify")?.ifBlank { null } ?: context.getString(R.string.vyra_widget_verify))
      views.setTextViewText(R.id.vyra_w_empty, labels?.optString("empty")?.ifBlank { null } ?: context.getString(R.string.vyra_widget_empty))
      val rows = data.optJSONArray("rows")
      val count = minOf(rows?.length() ?: 0, ROWS.size)
      views.setViewVisibility(R.id.vyra_w_empty, if (count == 0) View.VISIBLE else View.GONE)
      ROWS.forEachIndexed { i, (row, iconId, text) ->
        val item = if (i < count) rows?.optJSONObject(i) else null
        if (item == null) {
          views.setViewVisibility(row, View.GONE)
          return@forEachIndexed
        }
        val verdict = item.optString("verdict")
        views.setViewVisibility(row, View.VISIBLE)
        views.setImageViewResource(iconId, icon(verdict))
        views.setInt(iconId, "setColorFilter", ink(verdict))
        views.setTextViewText(text.first, item.optString("word"))
        views.setTextColor(text.first, ink(verdict))
        views.setTextViewText(text.second, item.optString("title"))
        val open = Intent(Intent.ACTION_VIEW, Uri.parse("${context.getString(R.string.vyra_scheme)}://affirmation/${item.optString("id")}"))
          .setPackage(context.packageName)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        views.setOnClickPendingIntent(row, PendingIntent.getActivity(context, 10 + i, open, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))
      }
      val check = CheckTileService.quickCheck(context)
      views.setOnClickPendingIntent(R.id.vyra_w_verify, PendingIntent.getActivity(context, 20, check, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      if (launch != null) views.setOnClickPendingIntent(R.id.vyra_w_title, PendingIntent.getActivity(context, 21, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT))
      return views
    }
  }
}
