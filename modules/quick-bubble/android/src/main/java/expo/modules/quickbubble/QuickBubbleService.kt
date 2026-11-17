package expo.modules.quickbubble

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.Outline
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.ViewOutlineProvider
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import kotlin.math.abs
import kotlin.math.hypot

private const val TAG = "QuickBubble"
private const val CHANNEL_ID = "quick_bubble"
private const val NOTIFICATION_ID = 4107
private const val BUBBLE_DP = 60
private const val TARGET_DP = 64
private const val TARGET_MARGIN_DP = 56
private const val EDGE_MARGIN_DP = 8

// Servicio en primer plano que dibuja la burbuja sobre las demás apps. Android exige
// una notificación mientras está activo; tocarla también abre la app.
class QuickBubbleService : Service() {
  companion object {
    fun start(context: Context) {
      try {
        ContextCompat.startForegroundService(context, Intent(context, QuickBubbleService::class.java))
      } catch (error: Exception) {
        // Android puede negarse a iniciarlo (por ejemplo, si quitaron el permiso): sin burbuja, nada más.
        Log.w(TAG, "No se pudo mostrar la burbuja", error)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, QuickBubbleService::class.java))
    }
  }

  private lateinit var windowManager: WindowManager
  private var bubble: View? = null
  private var bubbleParams: WindowManager.LayoutParams? = null
  private var target: View? = null
  private var snapAnimator: ValueAnimator? = null

  private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

  private val overlayType: Int
    get() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
    } else {
      0
    }
    ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(), type)
    if (QuickBubblePrefs.canDrawOverlays(this)) showBubble() else stopSelf()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_NOT_STICKY

  override fun onDestroy() {
    snapAnimator?.cancel()
    removeView(target)
    removeView(bubble)
    target = null
    bubble = null
    super.onDestroy()
  }

  private fun removeView(view: View?) {
    if (view?.isAttachedToWindow == true) windowManager.removeView(view)
  }

  private fun launchIntent(): Intent? =
    packageManager.getLaunchIntentForPackage(packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
    }

  private fun appName(): String = applicationInfo.loadLabel(packageManager).toString()

  private fun buildNotification(): Notification {
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // Importancia mínima: sin sonido ni ícono en la barra de estado.
      val channel = NotificationChannel(CHANNEL_ID, "Burbuja de acceso rápido", NotificationManager.IMPORTANCE_MIN)
      channel.description = "Aparece mientras la burbuja está visible."
      manager.createNotificationChannel(channel)
    }
    val open = launchIntent()?.let {
      PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    }
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.quick_bubble_notification)
      .setContentTitle("${appName()} está a un toque")
      .setContentText("Toca la burbuja para volver. Arrástrala a la X para ocultarla.")
      .setContentIntent(open)
      .setOngoing(true)
      .setSilent(true)
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .build()
  }

  private fun openApp() {
    launchIntent()?.let {
      try {
        startActivity(it)
      } catch (error: Exception) {
        Log.w(TAG, "No se pudo abrir la app", error)
      }
    }
    // Al volver a la app se quita sola; se detiene ya por si el proceso se había cerrado.
    stopSelf()
  }

  private fun createBubbleView(): View {
    val size = dp(BUBBLE_DP)
    val icon = ImageView(this).apply {
      setImageDrawable(packageManager.getApplicationIcon(packageName))
      scaleType = ImageView.ScaleType.CENTER_CROP
      contentDescription = "Volver a ${appName()}"
    }
    return FrameLayout(this).apply {
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.WHITE)
      }
      elevation = dp(6).toFloat()
      outlineProvider = object : ViewOutlineProvider() {
        override fun getOutline(view: View, outline: Outline) {
          outline.setOval(0, 0, view.width, view.height)
        }
      }
      clipToOutline = true
      addView(icon, FrameLayout.LayoutParams(size, size))
    }
  }

  // La X de abajo: soltar la burbuja encima la oculta hasta la próxima vez que se salga de la app.
  private fun createTargetView(): View =
    TextView(this).apply {
      text = "✕"
      textSize = 24f
      gravity = Gravity.CENTER
      setTextColor(Color.WHITE)
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.argb(200, 31, 31, 30))
      }
    }

  private fun overlayParams(size: Int, touchable: Boolean) =
    WindowManager.LayoutParams(
      size,
      size,
      overlayType,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        (if (touchable) 0 else WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE),
      PixelFormat.TRANSLUCENT,
    )

  private fun showBubble() {
    val metrics = resources.displayMetrics
    val size = dp(BUBBLE_DP)
    val (savedX, savedY) = QuickBubblePrefs.position(this)
    val params = overlayParams(size, touchable = true).apply {
      gravity = Gravity.TOP or Gravity.START
      x = if (savedX >= 0) savedX else metrics.widthPixels - size - dp(EDGE_MARGIN_DP)
      y = if (savedY >= 0) savedY else metrics.heightPixels / 3
    }
    val view = createBubbleView()
    view.setOnTouchListener(BubbleTouchListener(params))
    windowManager.addView(view, params)
    bubble = view
    bubbleParams = params
  }

  private fun showTarget() {
    if (target != null) return
    val view = createTargetView()
    val params = overlayParams(dp(TARGET_DP), touchable = false).apply {
      gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
      y = dp(TARGET_MARGIN_DP)
    }
    windowManager.addView(view, params)
    target = view
  }

  private fun hideTarget() {
    removeView(target)
    target = null
  }

  // Si el centro de la burbuja está cerca del centro de la X.
  private fun isOverTarget(params: WindowManager.LayoutParams): Boolean {
    val metrics = resources.displayMetrics
    val bubbleSize = dp(BUBBLE_DP)
    val bubbleX = params.x + bubbleSize / 2f
    val bubbleY = params.y + bubbleSize / 2f
    val targetX = metrics.widthPixels / 2f
    val targetY = metrics.heightPixels - dp(TARGET_MARGIN_DP) - dp(TARGET_DP) / 2f
    return hypot(bubbleX - targetX, bubbleY - targetY) < dp(TARGET_DP)
  }

  // Al soltarla se pega al borde más cercano, como las burbujas de chat.
  private fun snapToEdge(view: View, params: WindowManager.LayoutParams) {
    val metrics = resources.displayMetrics
    val size = dp(BUBBLE_DP)
    val margin = dp(EDGE_MARGIN_DP)
    val endX = if (params.x + size / 2 < metrics.widthPixels / 2) margin else metrics.widthPixels - size - margin
    params.y = params.y.coerceIn(margin, metrics.heightPixels - size - margin)
    snapAnimator?.cancel()
    snapAnimator = ValueAnimator.ofInt(params.x, endX).apply {
      duration = 200
      addUpdateListener {
        params.x = it.animatedValue as Int
        if (view.isAttachedToWindow) windowManager.updateViewLayout(view, params)
      }
      start()
    }
    QuickBubblePrefs.savePosition(this, endX, params.y)
  }

  private inner class BubbleTouchListener(private val params: WindowManager.LayoutParams) : View.OnTouchListener {
    private val touchSlop = ViewConfiguration.get(this@QuickBubbleService).scaledTouchSlop
    private var startX = 0
    private var startY = 0
    private var downRawX = 0f
    private var downRawY = 0f
    private var dragging = false

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouch(view: View, event: MotionEvent): Boolean {
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          snapAnimator?.cancel()
          startX = params.x
          startY = params.y
          downRawX = event.rawX
          downRawY = event.rawY
          dragging = false
        }
        MotionEvent.ACTION_MOVE -> {
          val dx = event.rawX - downRawX
          val dy = event.rawY - downRawY
          if (!dragging && (abs(dx) > touchSlop || abs(dy) > touchSlop)) {
            dragging = true
            showTarget()
          }
          if (dragging) {
            params.x = startX + dx.toInt()
            params.y = startY + dy.toInt()
            windowManager.updateViewLayout(view, params)
            target?.alpha = if (isOverTarget(params)) 1f else 0.7f
          }
        }
        MotionEvent.ACTION_UP -> {
          if (!dragging) {
            view.performClick()
            openApp()
          } else if (isOverTarget(params)) {
            hideTarget()
            stopSelf()
          } else {
            hideTarget()
            snapToEdge(view, params)
          }
        }
        MotionEvent.ACTION_CANCEL -> {
          if (dragging) {
            hideTarget()
            snapToEdge(view, params)
          }
        }
      }
      return true
    }
  }
}
