import SwiftUI
import WebKit

/// Hosts a tab's long-lived WKWebView inside SwiftUI.
struct WebView: UIViewRepresentable {
    let tab: BrowserTab

    func makeUIView(context: Context) -> WKWebView {
        let webView = tab.webView
        // Defer so the first navigation does not mutate observed state mid-view-update.
        DispatchQueue.main.async {
            tab.performInitialLoadIfNeeded()
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
