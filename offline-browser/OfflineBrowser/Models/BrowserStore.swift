import Foundation
import Observation

/// Owns the open tabs, remembers them between launches, and keeps the
/// on-disk archive in step with what is still open.
@Observable
final class BrowserStore {
    private struct PersistedState: Codable {
        struct TabRecord: Codable {
            var id: UUID
            var url: URL?
            var title: String
        }
        var tabs: [TabRecord]
        var selectedTabID: UUID?
    }

    private(set) var tabs: [BrowserTab] = []
    private(set) var selectedTabID: UUID?
    let network = NetworkMonitor()

    let archives = ArchiveStore.shared
    private let stateFileURL: URL

    var selectedTab: BrowserTab? {
        tabs.first { $0.id == selectedTabID }
    }

    init() {
        stateFileURL = archives.rootDirectory.appendingPathComponent("tabs.json")
        restore()
        if tabs.isEmpty {
            newTab()
        }
    }

    // MARK: - Tabs

    @discardableResult
    func newTab(url: URL? = nil) -> BrowserTab {
        let tab = makeTab(id: UUID(), url: nil, title: "")
        tabs.append(tab)
        selectedTabID = tab.id
        if let url {
            tab.open(url)
        }
        save()
        return tab
    }

    func select(_ tab: BrowserTab) {
        guard tab.id != selectedTabID else { return }
        selectedTab?.captureThumbnail()
        selectedTabID = tab.id
        save()
    }

    func close(_ tab: BrowserTab) {
        guard let index = tabs.firstIndex(where: { $0.id == tab.id }) else { return }
        tabs.remove(at: index)
        archives.deleteThumbnail(for: tab.id)
        if selectedTabID == tab.id {
            selectedTabID = tabs.isEmpty ? nil : tabs[min(index, tabs.count - 1)].id
        }
        if tabs.isEmpty {
            newTab()
        }
        pruneArchives()
        save()
    }

    func closeAllTabs() {
        for tab in tabs {
            archives.deleteThumbnail(for: tab.id)
        }
        tabs.removeAll()
        selectedTabID = nil
        newTab()
        pruneArchives()
    }

    // MARK: - Storage info

    var savedPagesSummary: String {
        let count = archives.archiveCount()
        let size = ByteCountFormatter.string(fromByteCount: archives.totalArchiveBytes(), countStyle: .file)
        return "\(count) saved page\(count == 1 ? "" : "s") · \(size)"
    }

    /// Deletes saved pages that no open tab is showing any more.
    func pruneArchives() {
        archives.pruneArchives(keeping: Set(tabs.compactMap(\.url)))
    }

    // MARK: - Persistence

    func save() {
        let state = PersistedState(
            tabs: tabs.map { PersistedState.TabRecord(id: $0.id, url: $0.url, title: $0.title) },
            selectedTabID: selectedTabID
        )
        guard let data = try? JSONEncoder().encode(state) else { return }
        try? data.write(to: stateFileURL, options: .atomic)
    }

    private func restore() {
        guard let data = try? Data(contentsOf: stateFileURL),
              let state = try? JSONDecoder().decode(PersistedState.self, from: data) else { return }
        tabs = state.tabs.map { makeTab(id: $0.id, url: $0.url, title: $0.title) }
        if let selected = state.selectedTabID, tabs.contains(where: { $0.id == selected }) {
            selectedTabID = selected
        } else {
            selectedTabID = tabs.last?.id
        }
    }

    private func makeTab(id: UUID, url: URL?, title: String) -> BrowserTab {
        let tab = BrowserTab(id: id, url: url, title: title, archives: archives, network: network)
        tab.onDidFinish = { [weak self] _ in
            self?.save()
        }
        tab.onRequestNewTab = { [weak self] url in
            self?.newTab(url: url)
        }
        return tab
    }
}
