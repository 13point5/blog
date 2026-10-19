import Foundation
import Observation
import UIKit
import WebKit

/// One browser tab: owns a WKWebView, mirrors its state for SwiftUI, and
/// saves every page it finishes loading from the network so it can be
/// shown again instantly, with or without a connection.
@Observable
final class BrowserTab: NSObject, Identifiable {
    struct LoadError: Equatable {
        var title: String
        var message: String

        static func offline(_ url: URL?) -> LoadError {
            let host = URLInput.displayHost(for: url)
            let subject = host.isEmpty ? "this page" : host
            return LoadError(title: "You're offline",
                             message: "There's no saved copy of \(subject) yet. Open it once while online and it will be kept for later.")
        }
    }

    private enum Source { case live, saved }

    let id: UUID

    private(set) var url: URL?
    private(set) var title: String = ""
    private(set) var isLoading = false
    private(set) var progress: Double = 0
    private(set) var canGoBack = false
    private(set) var canGoForward = false
    /// True when the page on screen came from the on-device copy rather than the network.
    private(set) var isShowingSavedCopy = false
    /// When the on-device copy of the current page was written.
    private(set) var savedAt: Date?
    private(set) var loadError: LoadError?
    private(set) var thumbnail: UIImage?

    /// Called whenever a page finishes loading, so the owner can persist state.
    @ObservationIgnored var onDidFinish: ((BrowserTab) -> Void)?
    /// Called when a page asks to open a link in a new window (target="_blank").
    @ObservationIgnored var onRequestNewTab: ((URL) -> Void)?

    private let archives: ArchiveStore
    private let network: NetworkMonitor
    @ObservationIgnored private var webViewStorage: WKWebView?
    @ObservationIgnored private var observations: [NSKeyValueObservation] = []
    @ObservationIgnored private var source: Source = .live
    @ObservationIgnored private var requestedURL: URL?
    @ObservationIgnored private var hasPerformedInitialLoad = false
    @ObservationIgnored private var archiveWorkItem: DispatchWorkItem?

    init(id: UUID = UUID(), url: URL? = nil, title: String = "", archives: ArchiveStore, network: NetworkMonitor) {
        self.id = id
        self.url = url
        self.title = title
        self.archives = archives
        self.network = network
        super.init()
        if let url {
            savedAt = archives.savedDate(for: url)
        }
        thumbnail = archives.thumbnail(for: id)
    }

    var isEmpty: Bool { url == nil }

    var hasSavedCopy: Bool {
        guard let url else { return false }
        return archives.hasArchive(for: url)
    }

    var displayTitle: String {
        if !title.isEmpty { return title }
        let host = URLInput.displayHost(for: url)
        return host.isEmpty ? "New Tab" : host
    }

    // MARK: - Web view

    var webView: WKWebView {
        if let webViewStorage { return webViewStorage }
        let webView = makeWebView()
        webViewStorage = webView
        return webView
    }

    private func makeWebView() -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.preferredContentMode = .mobile

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsLinkPreview = true

        observations = [
            webView.observe(\.estimatedProgress, options: [.new]) { [weak self] webView, _ in
                self?.progress = webView.estimatedProgress
            },
            webView.observe(\.isLoading, options: [.new]) { [weak self] webView, _ in
                self?.isLoading = webView.isLoading
            },
            webView.observe(\.title, options: [.new]) { [weak self] webView, _ in
                if let title = webView.title, !title.isEmpty { self?.title = title }
            },
            webView.observe(\.url, options: [.new]) { [weak self] webView, _ in
                if let url = webView.url { self?.url = url }
            },
            webView.observe(\.canGoBack, options: [.new]) { [weak self] webView, _ in
                self?.canGoBack = webView.canGoBack
            },
            webView.observe(\.canGoForward, options: [.new]) { [weak self] webView, _ in
                self?.canGoForward = webView.canGoForward
            },
        ]
        return webView
    }

    // MARK: - Navigation API

    /// First time the tab appears on screen: show the saved copy instantly when there is one.
    func performInitialLoadIfNeeded() {
        guard !hasPerformedInitialLoad else { return }
        hasPerformedInitialLoad = true
        guard let url else { return }
        if archives.hasArchive(for: url) {
            loadSavedCopy(of: url)
        } else if network.isOnline {
            loadLive(url)
        } else {
            loadError = .offline(url)
        }
    }

    /// The user typed an address or chose a link: fetch fresh when online, else fall back to the saved copy.
    func open(_ url: URL) {
        hasPerformedInitialLoad = true
        loadError = nil
        if network.isOnline {
            loadLive(url)
        } else if archives.hasArchive(for: url) {
            loadSavedCopy(of: url)
        } else {
            self.url = url
            loadError = .offline(url)
        }
    }

    /// Re-fetch the current page from the network and refresh its saved copy.
    func reload() {
        guard let target = url ?? requestedURL else { return }
        open(target)
    }

    func stopLoading() {
        webView.stopLoading()
        isLoading = false
    }

    func goBack() {
        guard webView.canGoBack else { return }
        loadError = nil
        source = .live
        webView.goBack()
    }

    func goForward() {
        guard webView.canGoForward else { return }
        loadError = nil
        source = .live
        webView.goForward()
    }

    /// Hide an error overlay and return to whatever the web view is still showing.
    func dismissError() {
        loadError = nil
        url = webViewStorage?.url
    }

    func captureThumbnail() {
        guard let webView = webViewStorage, webView.window != nil, !webView.isLoading, url != nil else { return }
        let configuration = WKSnapshotConfiguration()
        configuration.snapshotWidth = NSNumber(value: 320)
        webView.takeSnapshot(with: configuration) { [weak self] image, _ in
            guard let self, let image else { return }
            self.thumbnail = image
            self.archives.saveThumbnail(image, for: self.id)
        }
    }

    // MARK: - Loading

    private func loadLive(_ url: URL) {
        requestedURL = url
        source = .live
        isShowingSavedCopy = false
        self.url = url
        loadError = nil
        webView.load(URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30))
    }

    private func loadSavedCopy(of url: URL) {
        guard let data = archives.archiveData(for: url) else {
            self.url = url
            loadError = .offline(url)
            return
        }
        requestedURL = url
        source = .saved
        isShowingSavedCopy = true
        savedAt = archives.savedDate(for: url)
        self.url = url
        loadError = nil
        webView.load(data, mimeType: "application/x-webarchive", characterEncodingName: "utf-8", baseURL: url)
    }

    /// Whether the navigation that just finished (or failed) was our own saved-copy load.
    private func isSavedCopyNavigation(_ navigatedURL: URL?) -> Bool {
        source == .saved && ArchiveStore.samePage(navigatedURL, requestedURL)
    }

    /// Snapshot the page a moment after it finishes so late-loading images are included.
    private func scheduleArchive(of finalURL: URL, requestedAs requested: URL?) {
        archiveWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self, let webView = self.webViewStorage else { return }
            guard !webView.isLoading, ArchiveStore.samePage(webView.url, finalURL) else { return }
            webView.createWebArchiveData { [weak self] result in
                DispatchQueue.main.async {
                    guard let self, case .success(let data) = result else { return }
                    self.archives.saveArchive(data, for: finalURL, requestedAs: requested)
                    if ArchiveStore.samePage(self.url, finalURL) {
                        self.savedAt = Date()
                    }
                }
            }
        }
        archiveWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5, execute: work)
    }

    private func scheduleThumbnail() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { [weak self] in
            self?.captureThumbnail()
        }
    }

    private func handleFailure(_ error: Error) {
        let nsError = error as NSError
        // Cancelled loads and "frame load interrupted" (downloads, app links) are not errors to show.
        if nsError.domain == NSURLErrorDomain, nsError.code == NSURLErrorCancelled { return }
        if nsError.domain == "WebKitErrorDomain", nsError.code == 102 || nsError.code == 204 { return }

        isLoading = false
        let failedURL = (nsError.userInfo[NSURLErrorFailingURLErrorKey] as? URL) ?? requestedURL

        // A network load failed but we have this page on disk: show that instead.
        if let failedURL, !isSavedCopyNavigation(failedURL), archives.hasArchive(for: failedURL) {
            loadSavedCopy(of: failedURL)
            return
        }

        if let failedURL { url = failedURL }
        if !network.isOnline || [NSURLErrorNotConnectedToInternet, NSURLErrorNetworkConnectionLost, NSURLErrorDataNotAllowed].contains(nsError.code) {
            loadError = .offline(failedURL)
        } else {
            loadError = LoadError(title: "Couldn't load page", message: nsError.localizedDescription)
        }
    }
}

// MARK: - WKNavigationDelegate

extension BrowserTab: WKNavigationDelegate {
    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let target = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        let scheme = target.scheme?.lowercased() ?? ""
        let isMainFrame = navigationAction.targetFrame?.isMainFrame ?? true

        // mailto:, tel:, app links and the like belong to the system.
        if !["http", "https", "about", "blob", "data", "file", "javascript"].contains(scheme) {
            if isMainFrame, UIApplication.shared.canOpenURL(target) {
                UIApplication.shared.open(target)
            }
            decisionHandler(.cancel)
            return
        }

        if isMainFrame, scheme == "http" || scheme == "https" {
            switch navigationAction.navigationType {
            case .linkActivated, .formSubmitted, .formResubmitted, .backForward, .reload:
                loadError = nil
                if !network.isOnline, archives.hasArchive(for: target) {
                    decisionHandler(.cancel)
                    loadSavedCopy(of: target)
                    return
                }
                requestedURL = target
                source = .live
                isShowingSavedCopy = false
            case .other:
                // Redirects, script-driven navigations and our own saved-copy loads.
                break
            @unknown default:
                break
            }
        }
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        isLoading = true
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isLoading = false
        progress = 1
        loadError = nil
        if let current = webView.url { url = current }
        let pageTitle = webView.title ?? ""
        title = pageTitle.isEmpty ? URLInput.displayHost(for: url) : pageTitle

        let fromSavedCopy = isSavedCopyNavigation(webView.url)
        isShowingSavedCopy = fromSavedCopy
        if !fromSavedCopy,
           let finalURL = webView.url,
           let scheme = finalURL.scheme?.lowercased(),
           scheme == "http" || scheme == "https" {
            scheduleArchive(of: finalURL, requestedAs: requestedURL)
        }
        scheduleThumbnail()
        onDidFinish?(self)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        handleFailure(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        handleFailure(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        // WebKit killed the content process (usually memory pressure); bring the page back.
        if let url { open(url) }
    }
}

// MARK: - WKUIDelegate

extension BrowserTab: WKUIDelegate {
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        // target="_blank" links: open in a new tab rather than a popup window.
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            if let onRequestNewTab {
                onRequestNewTab(url)
            } else {
                open(url)
            }
        }
        return nil
    }
}
