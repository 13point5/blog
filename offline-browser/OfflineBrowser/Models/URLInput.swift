import Foundation

/// Turns whatever the user typed in the address bar into a URL,
/// falling back to a web search when it does not look like an address.
enum URLInput {
    static let searchBase = "https://www.google.com/search?q="

    static func url(from raw: String) -> URL? {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }

        // Already a full URL with a scheme we can load.
        if let url = URL(string: text),
           let scheme = url.scheme?.lowercased(),
           ["http", "https"].contains(scheme),
           url.host != nil {
            return url
        }

        // Looks like a bare host or host/path, e.g. "example.com/post" or "localhost:3000".
        if !text.contains(" ") {
            let hostPart = text.split(separator: "/", maxSplits: 1).first.map(String.init) ?? text
            let hostOnly = hostPart.split(separator: ":").first.map(String.init) ?? hostPart
            let looksLikeHost = hostOnly.contains(".") || hostOnly == "localhost"
            if looksLikeHost, let url = URL(string: "https://" + text), url.host != nil {
                return url
            }
        }

        // Otherwise treat it as a search query.
        var allowed = CharacterSet.alphanumerics
        allowed.insert(charactersIn: "-._~")
        let query = text.addingPercentEncoding(withAllowedCharacters: allowed) ?? text
        return URL(string: searchBase + query)
    }

    /// Short label shown in the address bar when not editing, e.g. "example.com".
    static func displayHost(for url: URL?) -> String {
        guard let url else { return "" }
        guard var host = url.host else { return url.absoluteString }
        if host.hasPrefix("www.") { host.removeFirst(4) }
        return host
    }
}
