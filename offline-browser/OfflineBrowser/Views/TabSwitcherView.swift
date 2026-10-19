import SwiftUI

/// Grid of open tabs, Chrome style. Tap to switch, X to close.
struct TabSwitcherView: View {
    var store: BrowserStore

    @Environment(\.dismiss) private var dismiss
    @State private var isConfirmingCloseAll = false

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(store.tabs) { tab in
                        TabCard(tab: tab, isSelected: tab.id == store.selectedTabID) {
                            store.select(tab)
                            dismiss()
                        } onClose: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                store.close(tab)
                            }
                        }
                    }
                }
                .padding(12)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(store.tabs.count == 1 ? "1 Tab" : "\(store.tabs.count) Tabs")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close All") { isConfirmingCloseAll = true }
                        .disabled(store.tabs.allSatisfy(\.isEmpty))
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
                ToolbarItem(placement: .bottomBar) {
                    Button {
                        store.newTab()
                        dismiss()
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 18, weight: .medium))
                            .frame(width: 44, height: 44)
                    }
                    .accessibilityLabel("New Tab")
                }
            }
            .confirmationDialog("Close all tabs?", isPresented: $isConfirmingCloseAll, titleVisibility: .visible) {
                Button("Close All Tabs", role: .destructive) {
                    store.closeAllTabs()
                    dismiss()
                }
            } message: {
                Text("Their saved copies will be removed from this phone.")
            }
        }
    }
}

private struct TabCard: View {
    let tab: BrowserTab
    let isSelected: Bool
    let onSelect: () -> Void
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                Image(systemName: tab.hasSavedCopy ? "arrow.down.circle.fill" : "globe")
                    .font(.caption)
                    .foregroundStyle(tab.hasSavedCopy ? Color.accentColor : Color.secondary)
                Text(tab.displayTitle)
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
                Spacer(minLength: 4)
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(width: 28, height: 28)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Close \(tab.displayTitle)")
            }
            .padding(.leading, 10)
            .padding(.trailing, 2)
            .frame(height: 36)
            .background(Color(.secondarySystemGroupedBackground))

            Color(.systemBackground)
                .frame(height: 190)
                .overlay(alignment: .top) {
                    if let image = tab.thumbnail {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                    } else {
                        Image(systemName: tab.isEmpty ? "magnifyingglass" : "doc.text")
                            .font(.system(size: 36, weight: .light))
                            .foregroundStyle(.quaternary)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
                .frame(height: 190)
                .clipped()
                .overlay(alignment: .bottomLeading) {
                    if !tab.isEmpty {
                        Text(URLInput.displayHost(for: tab.url))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.regularMaterial, in: Capsule())
                            .padding(8)
                    }
                }
        }
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(isSelected ? Color.accentColor : Color.clear, lineWidth: 2.5)
        )
        .shadow(color: .black.opacity(0.08), radius: 6, y: 2)
        .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .onTapGesture(perform: onSelect)
    }
}
