package expo.modules.quickbubble

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Burbuja flotante para volver a la app con un toque, como las burbujas de chat.
// Aparece cuando la app entera queda en segundo plano y se quita al volver a ella.
class QuickBubbleModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var appContextRef: Context? = null

  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  // ProcessLifecycleOwner avisa cuando ninguna pantalla de la app está visible. A diferencia
  // de onPause, no se dispara con un diálogo de permisos encima de la app.
  private val processObserver = object : DefaultLifecycleObserver {
    override fun onStart(owner: LifecycleOwner) {
      appContextRef?.let { QuickBubbleService.stop(it) }
    }

    override fun onStop(owner: LifecycleOwner) {
      appContextRef?.let { if (QuickBubblePrefs.shouldShow(it)) QuickBubbleService.start(it) }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("QuickBubble")

    OnCreate {
      appContextRef = appContext.reactContext?.applicationContext
      mainHandler.post { ProcessLifecycleOwner.get().lifecycle.addObserver(processObserver) }
    }

    OnDestroy {
      mainHandler.post { ProcessLifecycleOwner.get().lifecycle.removeObserver(processObserver) }
    }

    Function("canDrawOverlays") {
      QuickBubblePrefs.canDrawOverlays(context)
    }

    Function("isEnabled") {
      QuickBubblePrefs.isEnabled(context)
    }

    Function("setEnabled") { enabled: Boolean ->
      appContextRef = context
      QuickBubblePrefs.setEnabled(context, enabled)
      if (!enabled) QuickBubbleService.stop(context)
    }

    // Abre el ajuste "Mostrar sobre otras apps" de esta app.
    Function("openOverlaySettings") {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }
}
