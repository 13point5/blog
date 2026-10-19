# Offline Browser

A deliberately tiny iPhone browser. It looks and works like Chrome, with one
twist: every page you open is kept on the phone as a web archive, so your
tabs open instantly and still read fine on the subway, on the T, or anywhere
the connection is slow or gone.

No accounts, no sync, no reading-list UI. Your open tabs *are* your saved pages.

## How it behaves

- **Open a link while online** → it loads from the web and is saved to the
  phone a moment after it finishes (so late-loading images are included).
- **Reopen the app** → each tab shows its saved copy immediately, no network
  round trip. A small banner says when it was saved; tap **Refresh** (or the
  reload button) to fetch a fresh version.
- **Offline** → tapping a link to a page you have already visited shows the
  saved copy. A page you have never opened shows a short "You're offline"
  message instead of spinning forever.
- **Close a tab** → its saved copy is deleted. Nothing accumulates behind
  your back.
- The address bar accepts URLs, bare domains (`example.com/post`), or plain
  words, which go to a web search.
- Links that open in a new window (`target="_blank"`) open in a new tab.

Saved pages live in the app's Application Support folder as `.webarchive`
files and are included in iPhone backups.

## Build and install

You need a Mac with **Xcode 16 or newer** and an iPhone running **iOS 17 or
newer**. A free Apple ID is enough; no paid developer account is required.

1. Open `OfflineBrowser.xcodeproj` in Xcode.
2. Select the **OfflineBrowser** target → **Signing & Capabilities** → pick
   your **Team** (add your Apple ID under Xcode → Settings → Accounts if it
   is not listed). If Xcode complains the bundle identifier is taken, change
   `com.sriraam.OfflineBrowser` to anything unique.
3. Plug in your iPhone, choose it as the run destination, and press **Run**.
4. First time only: on the phone, go to Settings → General → VPN & Device
   Management and trust your developer certificate, then launch the app.

With a free Apple ID the install expires after 7 days; just press Run again
to reinstall. Your tabs and saved pages survive reinstalls from Xcode.

## Project layout

```
OfflineBrowser/
├── OfflineBrowserApp.swift      App entry; saves tab state when backgrounded
├── Models/
│   ├── BrowserTab.swift         One tab: owns a WKWebView, saves/loads archives
│   ├── BrowserStore.swift       Open tabs, selection, persistence to tabs.json
│   ├── ArchiveStore.swift       .webarchive files, redirect aliases, thumbnails
│   ├── NetworkMonitor.swift     Online/offline via NWPathMonitor
│   └── URLInput.swift           Address-bar text → URL or search
├── Views/
│   ├── BrowserView.swift        Address bar, page area, bottom toolbar, menu
│   ├── TabSwitcherView.swift    Tab grid with thumbnails
│   └── Pages.swift              Start page and error page
├── Web/
│   ├── WebView.swift            SwiftUI wrapper around the tab's WKWebView
│   └── AddressTextField.swift   UIKit text field that focuses + selects all
├── Assets.xcassets
└── Info.plist                   Allows http:// sites inside the web view
```

The Xcode project uses a synchronized folder, so any new `.swift` file you
drop into `OfflineBrowser/` is picked up automatically.

## Known limits

- A saved copy is a snapshot of the page as rendered. Content a site fetches
  with JavaScript after load may be missing, and web apps (mail, docs) are
  not meant to work offline here. Articles, docs, and blogs work well.
- Only the page currently shown in each tab is kept. Earlier pages in a
  tab's history are not restored after the app is closed.
