import SwiftUI
import UIKit

/// The main screen: address bar on top, the page in the middle, Chrome-style toolbar at the bottom.
struct BrowserView: View {
    var store: BrowserStore

    @State private var isEditingAddress = false
    @State private var addressText = ""
    @State private var isShowingTabs = false
    @State private var isBannerVisible = false

    var body: some View {
        VStack(spacing: 0) {
            if let tab = store.selectedTab {
                topBar(for: tab)
                Divider()
                content(for: tab)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                Divider()
                bottomBar(for: tab)
            }
        }
        .background(Color(.systemBackground))
        .ignoresSafeArea(.keyboard)
        .fullScreenCover(isPresented: $isShowingTabs) {
            TabSwitcherView(store: store)
        }
        .onChange(of: store.selectedTabID, initial: true) { _, _ in
            isEditingAddress = false
            focusAddressBarIfTabIsEmpty()
        }
        .onChange(of: isShowingTabs) { _, showing in
            if !showing {
                focusAddressBarIfTabIsEmpty()
            }
        }
    }

    // MARK: - Top bar

    private func topBar(for tab: BrowserTab) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                addressBar(for: tab)
                if isEditingAddress {
                    Button("Cancel") { endEditingAddress() }
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .animation(.easeInOut(duration: 0.2), value: isEditingAddress)

            GeometryReader { geometry in
                Rectangle()
                    .fill(Color.accentColor)
                    .frame(width: geometry.size.width * tab.progress)
                    .animation(.linear(duration: 0.15), value: tab.progress)
            }
            .frame(height: 2)
            .opacity(tab.isLoading ? 1 : 0)
            .animation(.easeOut(duration: 0.25), value: tab.isLoading)
        }
        .background(Color(.systemBackground))
    }

    private func addressBar(for tab: BrowserTab) -> some View {
        HStack(spacing: 8) {
            if isEditingAddress {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 14))
                    .foregroundStyle(.secondary)
                AddressTextField(text: $addressText, onSubmit: submitAddress, onEndEditing: endEditingAddress)
                    .frame(height: 24)
                    .padding(.trailing, 6)
            } else {
                Button {
                    beginEditingAddress()
                } label: {
                    HStack(spacing: 6) {
                        statusIcon(for: tab)
                        Text(tab.isEmpty ? "Search or type URL" : URLInput.displayHost(for: tab.url))
                            .font(.system(size: 16))
                            .foregroundStyle(tab.isEmpty ? .secondary : .primary)
                            .lineLimit(1)
                            .truncationMode(.tail)
                        Spacer(minLength: 0)
                    }
                    .frame(maxWidth: .infinity)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if !tab.isEmpty {
                    Button {
                        if tab.isLoading { tab.stopLoading() } else { tab.reload() }
                    } label: {
                        Image(systemName: tab.isLoading ? "xmark" : "arrow.clockwise")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(.secondary)
                            .frame(width: 32, height: 32)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(tab.isLoading ? "Stop" : "Reload")
                }
            }
        }
        .padding(.leading, 12)
        .padding(.trailing, 4)
        .frame(height: 42)
        .background(Color(.tertiarySystemFill), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    @ViewBuilder
    private func statusIcon(for tab: BrowserTab) -> some View {
        Group {
            if tab.isShowingSavedCopy {
                Image(systemName: "arrow.down.circle.fill").foregroundStyle(Color.accentColor)
            } else if tab.url?.scheme?.lowercased() == "https" {
                Image(systemName: "lock.fill").foregroundStyle(.secondary)
            } else {
                Image(systemName: "globe").foregroundStyle(.secondary)
            }
        }
        .font(.system(size: 13))
    }

    // MARK: - Content

    private func content(for tab: BrowserTab) -> some View {
        ZStack(alignment: .bottom) {
            if tab.isEmpty && tab.loadError == nil {
                StartPage(isOnline: store.network.isOnline, onTapSearch: beginEditingAddress)
            } else {
                WebView(tab: tab)
                    .id(tab.id)
            }

            if let error = tab.loadError {
                ErrorPage(error: error,
                          isOnline: store.network.isOnline,
                          onRetry: { tab.reload() },
                          onDismiss: { tab.dismissError() })
            }

            if isBannerVisible, !tab.isEmpty, tab.loadError == nil, tab.isShowingSavedCopy || !store.network.isOnline {
                statusBanner(for: tab)
            }
        }
        .overlay {
            if isEditingAddress {
                Color.black.opacity(0.25)
                    .ignoresSafeArea()
                    .onTapGesture { endEditingAddress() }
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isEditingAddress)
        .animation(.easeInOut(duration: 0.25), value: isBannerVisible)
        .task(id: bannerKey(for: tab)) {
            isBannerVisible = true
            try? await Task.sleep(for: .seconds(4))
            isBannerVisible = false
        }
    }

    private func bannerKey(for tab: BrowserTab) -> String {
        "\(tab.id)|\(tab.isShowingSavedCopy)|\(store.network.isOnline)|\(tab.url?.absoluteString ?? "")"
    }

    private func statusBanner(for tab: BrowserTab) -> some View {
        HStack(spacing: 6) {
            Image(systemName: store.network.isOnline ? "arrow.down.circle.fill" : "wifi.slash")
            Text(bannerText(for: tab))
                .lineLimit(1)
            if store.network.isOnline, tab.isShowingSavedCopy {
                Button("Refresh") { tab.reload() }
                    .fontWeight(.semibold)
            }
        }
        .font(.footnote)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(.regularMaterial, in: Capsule())
        .padding(.bottom, 12)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private func bannerText(for tab: BrowserTab) -> String {
        let when = tab.savedAt.map { $0.formatted(.relative(presentation: .named)) } ?? "earlier"
        switch (store.network.isOnline, tab.isShowingSavedCopy) {
        case (false, true): return "Offline · saved \(when)"
        case (false, false): return "You're offline"
        default: return "Saved copy from \(when)"
        }
    }

    // MARK: - Bottom bar

    private func bottomBar(for tab: BrowserTab) -> some View {
        HStack {
            toolbarButton("chevron.left", label: "Back", enabled: tab.canGoBack) { tab.goBack() }
            Spacer()
            toolbarButton("chevron.right", label: "Forward", enabled: tab.canGoForward) { tab.goForward() }
            Spacer()
            toolbarButton("plus", label: "New Tab", enabled: true) { store.newTab() }
            Spacer()
            Button {
                tab.captureThumbnail()
                isShowingTabs = true
            } label: {
                tabCountBadge
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Tabs")
            Spacer()
            Menu {
                menuItems(for: tab)
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 18, weight: .medium))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .accessibilityLabel("More")
        }
        .foregroundStyle(.primary)
        .padding(.horizontal, 16)
        .frame(height: 50)
        .background(Color(.systemBackground))
    }

    private var tabCountBadge: some View {
        let count = store.tabs.count
        return ZStack {
            RoundedRectangle(cornerRadius: 5, style: .continuous)
                .strokeBorder(lineWidth: 2)
                .frame(width: 22, height: 22)
            Text(count > 99 ? ":D" : "\(count)")
                .font(.system(size: count > 9 ? 10 : 12, weight: .bold, design: .rounded))
                .monospacedDigit()
        }
    }

    private func toolbarButton(_ systemImage: String, label: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .medium))
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.3)
        .accessibilityLabel(label)
    }

    @ViewBuilder
    private func menuItems(for tab: BrowserTab) -> some View {
        Button { store.newTab() } label: { Label("New Tab", systemImage: "plus") }

        if let url = tab.url {
            Button { tab.reload() } label: { Label("Reload from Web", systemImage: "arrow.clockwise") }
            ShareLink(item: url) { Label("Share", systemImage: "square.and.arrow.up") }
            Button {
                UIPasteboard.general.url = url
            } label: { Label("Copy Link", systemImage: "doc.on.doc") }
            Button {
                UIApplication.shared.open(url)
            } label: { Label("Open in Safari", systemImage: "safari") }
        }

        Divider()
        Text(store.savedPagesSummary)
    }

    // MARK: - Address editing

    private func focusAddressBarIfTabIsEmpty() {
        guard !isShowingTabs, store.selectedTab?.isEmpty == true else { return }
        beginEditingAddress()
    }

    private func beginEditingAddress() {
        addressText = store.selectedTab?.url?.absoluteString ?? ""
        isEditingAddress = true
    }

    private func endEditingAddress() {
        isEditingAddress = false
    }

    private func submitAddress() {
        guard let url = URLInput.url(from: addressText) else {
            endEditingAddress()
            return
        }
        store.selectedTab?.open(url)
        endEditingAddress()
    }
}
