import SwiftUI

/// What an empty tab shows before the user types anything.
struct StartPage: View {
    let isOnline: Bool
    let onTapSearch: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "arrow.down.circle")
                .font(.system(size: 56, weight: .thin))
                .foregroundStyle(.secondary)
            Text("Pages you open stay on this phone")
                .font(.headline)
                .multilineTextAlignment(.center)
            Text("Read them later on the subway, in the air, or anywhere the signal is bad.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button(action: onTapSearch) {
                Label("Search or type URL", systemImage: "magnifyingglass")
            }
            .buttonStyle(.bordered)
            .padding(.top, 4)
            if !isOnline {
                Label("You're offline", systemImage: "wifi.slash")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Spacer()
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}

/// Shown over the web view when a page could not be loaded and no saved copy exists.
struct ErrorPage: View {
    let error: BrowserTab.LoadError
    let isOnline: Bool
    let onRetry: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Spacer()
            Image(systemName: isOnline ? "exclamationmark.triangle" : "wifi.slash")
                .font(.system(size: 44, weight: .light))
                .foregroundStyle(.secondary)
            Text(error.title)
                .font(.title3.weight(.semibold))
            Text(error.message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            HStack(spacing: 12) {
                Button("Try Again", action: onRetry)
                    .buttonStyle(.borderedProminent)
                Button("Dismiss", action: onDismiss)
                    .buttonStyle(.bordered)
            }
            .padding(.top, 6)
            Spacer()
            Spacer()
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
    }
}
