package expo.modules.quickbubble

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.provider.Settings

// Lo que se recuerda entre aperturas: si la burbuja está activada y dónde la dejó el usuario.
internal object QuickBubblePrefs {
  private const val NAME = "quick_bubble"
  private const val ENABLED = "enabled"
  private const val X = "x"
  private const val Y = "y"

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(NAME, Context.MODE_PRIVATE)

  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(ENABLED, false)

  fun setEnabled(context: Context, enabled: Boolean) {
    prefs(context).edit().putBoolean(ENABLED, enabled).apply()
  }

  // -1: todavía no se ha movido; el servicio la pone en el borde derecho.
  fun position(context: Context): Pair<Int, Int> =
    prefs(context).getInt(X, -1) to prefs(context).getInt(Y, -1)

  fun savePosition(context: Context, x: Int, y: Int) {
    prefs(context).edit().putInt(X, x).putInt(Y, y).apply()
  }

  fun canDrawOverlays(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)

  // Se muestra solo si el usuario la activó y Android le dio el permiso.
  fun shouldShow(context: Context): Boolean = isEnabled(context) && canDrawOverlays(context)
}
