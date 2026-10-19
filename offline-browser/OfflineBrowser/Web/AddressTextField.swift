import SwiftUI
import UIKit

/// The editable address field. UIKit-backed so it can take focus and
/// select its whole contents the moment it appears, like Chrome's omnibox.
struct AddressTextField: UIViewRepresentable {
    @Binding var text: String
    var onSubmit: () -> Void
    var onEndEditing: () -> Void

    func makeUIView(context: Context) -> UITextField {
        let field = UITextField()
        field.delegate = context.coordinator
        field.keyboardType = .webSearch
        field.returnKeyType = .go
        field.autocorrectionType = .no
        field.autocapitalizationType = .none
        field.spellCheckingType = .no
        field.smartDashesType = .no
        field.smartQuotesType = .no
        field.smartInsertDeleteType = .no
        field.textContentType = .URL
        field.clearButtonMode = .whileEditing
        field.enablesReturnKeyAutomatically = true
        field.font = .systemFont(ofSize: 16)
        field.placeholder = "Search or type URL"
        field.text = text
        field.setContentHuggingPriority(.defaultLow, for: .horizontal)
        field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        field.addTarget(context.coordinator, action: #selector(Coordinator.textChanged(_:)), for: .editingChanged)
        DispatchQueue.main.async {
            field.becomeFirstResponder()
            field.selectAll(nil)
        }
        return field
    }

    func updateUIView(_ field: UITextField, context: Context) {
        context.coordinator.parent = self
        if field.text != text {
            field.text = text
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    final class Coordinator: NSObject, UITextFieldDelegate {
        var parent: AddressTextField

        init(parent: AddressTextField) {
            self.parent = parent
        }

        @objc func textChanged(_ field: UITextField) {
            parent.text = field.text ?? ""
        }

        func textFieldShouldReturn(_ field: UITextField) -> Bool {
            parent.onSubmit()
            return true
        }

        func textFieldDidEndEditing(_ field: UITextField) {
            // May fire while SwiftUI is mid-update (the field being removed), so defer.
            let callback = parent.onEndEditing
            DispatchQueue.main.async(execute: callback)
        }
    }
}
