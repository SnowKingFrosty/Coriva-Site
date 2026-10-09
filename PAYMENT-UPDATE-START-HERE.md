# Payment and Messages update — start here

This is an update for your existing Coriva project.

1. Extract these files into the existing project root, replacing files with the same names. Commit the changes.
2. Publish index.html, styles.css and app.bundle.js together. Publishing index.html alone does not update the app. The production bundle is already built. Keep your existing media-config.js and working ImageKit upload configuration.
3. Publish firestore.rules in Firebase Console → Firestore Database → Rules. The full rules also contain your existing room, buyer request, invoice and notification permissions.
4. Close and reopen the website after publishing. The stylesheet and app now use cache version 23.

Where to find the features:

- Sign in as the creator who owns the storefront, then open that storefront.
- Click Manage storefront. Scroll to Saved payment link & QR code.
- Enter the payment label and HTTPS link, choose Upload your QR code, then click Save storefront. PNG, JPG and WebP images up to 5 MB are accepted. QR images are not generated automatically.
- Click Messages in the storefront header. Select an existing buyer conversation, then click Send saved payment link & QR. Both are sent in that same conversation.
- The saved-payment button also appears in the creator’s existing storefront chat. Buyers see the payment link and uploaded QR image in their conversation.

Messages is available only on storefronts you own. A storefront without buyer conversations shows an empty inbox until a buyer sends a message.
