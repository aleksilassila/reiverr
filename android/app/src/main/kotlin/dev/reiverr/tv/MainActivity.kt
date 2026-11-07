package dev.reiverr.tv

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

// The frontend's TV bundle from the assets, at an origin of its own: the sessions in localStorage
// persist. Over http, since a https page has video from a plain http backend blocked as mixed content
private const val APP_URL = "http://appassets.androidplatform.net/"

// The bundle's files, and index.html for the app's routes (no file extension), as the backend serves them
private class AppAssetsHandler(context: Context) : WebViewAssetLoader.PathHandler {
    private val assets = WebViewAssetLoader.AssetsPathHandler(context)

    override fun handle(path: String): WebResourceResponse? {
        val isFile = path.substringAfterLast('/').contains('.')
        return assets.handle(if (isFile) path else "index.html")
    }
}

class MainActivity : Activity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .setHttpAllowed(true)
            .addPathHandler("/", AppAssetsHandler(this))
            .build()

        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            // Fit the width the page asks for (index.html, by the user agent below) to the screen, whatever the TV's density
            useWideViewPort = true
            loadWithOverviewMode = true
            userAgentString = "$userAgentString Reiverr/${BuildConfig.VERSION_NAME} AndroidTV"
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
        }
        webView.keepScreenOn = true
        WebView.setWebContentsDebuggingEnabled(true)

        setContentView(webView)
        webView.requestFocus()
        webView.loadUrl(APP_URL)
    }

    // Android gives Back to the activity, not to the page: hand it over as the key the stack router reads
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode != KeyEvent.KEYCODE_BACK) return super.dispatchKeyEvent(event)
        if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
            webView.evaluateJavascript(
                "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Back', bubbles: true }))",
                null
            )
        }
        return true
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
