import SwiftUI

@main
struct OfflineBrowserApp: App {
    @State private var store = BrowserStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            BrowserView(store: store)
                .onChange(of: scenePhase) { _, phase in
                    if phase == .background || phase == .inactive {
                        store.save()
                    }
                }
        }
    }
}
