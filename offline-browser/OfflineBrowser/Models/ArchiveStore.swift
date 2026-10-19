import CryptoKit
import Foundation
import UIKit

/// On-disk storage for saved pages (.webarchive files) and tab thumbnails.
///
/// Archives are keyed by a hash of the page URL (minus any fragment). When a
/// requested URL redirected somewhere else, a small alias file points the
/// requested URL at the final page so typing the same address offline still works.
final class ArchiveStore {
    static let shared = ArchiveStore()

    let rootDirectory: URL
    private let archivesDirectory: URL
    private let aliasesDirectory: URL
    private let thumbnailsDirectory: URL
    private let fileManager = FileManager.default

    init() {
        let base = (try? fileManager.url(for: .applicationSupportDirectory,
                                         in: .userDomainMask,
                                         appropriateFor: nil,
                                         create: true)) ?? fileManager.temporaryDirectory
        rootDirectory = base.appendingPathComponent("OfflineBrowser", isDirectory: true)
        archivesDirectory = rootDirectory.appendingPathComponent("Archives", isDirectory: true)
        aliasesDirectory = rootDirectory.appendingPathComponent("Aliases", isDirectory: true)
        thumbnailsDirectory = rootDirectory.appendingPathComponent("Thumbnails", isDirectory: true)
        for directory in [archivesDirectory, aliasesDirectory, thumbnailsDirectory] {
            try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        }
    }

    // MARK: - Keys

    /// Two URLs that differ only by fragment are the same page.
    static func normalized(_ url: URL) -> URL {
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return url }
        components.fragment = nil
        return components.url ?? url
    }

    static func samePage(_ a: URL?, _ b: URL?) -> Bool {
        guard let a, let b else { return false }
        return normalized(a).absoluteString == normalized(b).absoluteString
    }

    private func key(for url: URL) -> String {
        let digest = SHA256.hash(data: Data(Self.normalized(url).absoluteString.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    private func aliasFileURL(for url: URL) -> URL {
        aliasesDirectory.appendingPathComponent(key(for: url)).appendingPathExtension("alias")
    }

    /// Follows a redirect alias, if one was recorded for this URL.
    private func resolve(_ url: URL) -> URL {
        guard let data = try? Data(contentsOf: aliasFileURL(for: url)),
              let target = String(data: data, encoding: .utf8),
              let targetURL = URL(string: target) else { return url }
        return targetURL
    }

    private func archiveFileURL(for url: URL) -> URL {
        archivesDirectory.appendingPathComponent(key(for: resolve(url))).appendingPathExtension("webarchive")
    }

    // MARK: - Archives

    func hasArchive(for url: URL) -> Bool {
        fileManager.fileExists(atPath: archiveFileURL(for: url).path)
    }

    func savedDate(for url: URL) -> Date? {
        let attributes = try? fileManager.attributesOfItem(atPath: archiveFileURL(for: url).path)
        return attributes?[.modificationDate] as? Date
    }

    func archiveData(for url: URL) -> Data? {
        try? Data(contentsOf: archiveFileURL(for: url))
    }

    /// Stores a page. `requestedURL` is the address that was asked for before any redirects.
    func saveArchive(_ data: Data, for finalURL: URL, requestedAs requestedURL: URL? = nil) {
        try? data.write(to: archiveFileURL(for: finalURL), options: .atomic)
        if let requestedURL, !Self.samePage(requestedURL, finalURL) {
            let alias = Data(Self.normalized(finalURL).absoluteString.utf8)
            try? alias.write(to: aliasFileURL(for: requestedURL), options: .atomic)
        }
    }

    func deleteArchive(for url: URL) {
        try? fileManager.removeItem(at: archiveFileURL(for: url))
    }

    /// Deletes every saved page that is not the current page of one of the given URLs.
    func pruneArchives(keeping urls: Set<URL>) {
        let keepFiles = Set(urls.map { archiveFileURL(for: $0).lastPathComponent })
        let archives = (try? fileManager.contentsOfDirectory(at: archivesDirectory, includingPropertiesForKeys: nil)) ?? []
        for file in archives where !keepFiles.contains(file.lastPathComponent) {
            try? fileManager.removeItem(at: file)
        }
        // Drop aliases whose target archive no longer exists.
        let aliases = (try? fileManager.contentsOfDirectory(at: aliasesDirectory, includingPropertiesForKeys: nil)) ?? []
        for file in aliases {
            guard let data = try? Data(contentsOf: file),
                  let target = String(data: data, encoding: .utf8),
                  let targetURL = URL(string: target) else {
                try? fileManager.removeItem(at: file)
                continue
            }
            let targetFile = archivesDirectory.appendingPathComponent(key(for: targetURL)).appendingPathExtension("webarchive")
            if !fileManager.fileExists(atPath: targetFile.path) {
                try? fileManager.removeItem(at: file)
            }
        }
    }

    func archiveCount() -> Int {
        ((try? fileManager.contentsOfDirectory(at: archivesDirectory, includingPropertiesForKeys: nil)) ?? []).count
    }

    func totalArchiveBytes() -> Int64 {
        let files = (try? fileManager.contentsOfDirectory(at: archivesDirectory, includingPropertiesForKeys: [.fileSizeKey])) ?? []
        return files.reduce(Int64(0)) { total, file in
            let size = (try? file.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
            return total + Int64(size)
        }
    }

    // MARK: - Thumbnails

    private func thumbnailFileURL(for tabID: UUID) -> URL {
        thumbnailsDirectory.appendingPathComponent(tabID.uuidString).appendingPathExtension("jpg")
    }

    func saveThumbnail(_ image: UIImage, for tabID: UUID) {
        guard let data = image.jpegData(compressionQuality: 0.7) else { return }
        try? data.write(to: thumbnailFileURL(for: tabID), options: .atomic)
    }

    func thumbnail(for tabID: UUID) -> UIImage? {
        guard let data = try? Data(contentsOf: thumbnailFileURL(for: tabID)) else { return nil }
        return UIImage(data: data)
    }

    func deleteThumbnail(for tabID: UUID) {
        try? fileManager.removeItem(at: thumbnailFileURL(for: tabID))
    }
}
