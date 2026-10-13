# Coriva profile pages

Click your profile picture, name, or **View profile** on the main page to open your profile.

Your profile includes your username, picture, social links, specialty, an optional bio and banner, and all of your storefronts. Storefront cards open their normal storefront pages. Visitors see your public storefronts; drafts are shown only to you.

Use **Customize profile** to upload or remove a banner and edit your bio. **Edit photo & social links** opens the existing account editor. Use **Share profile** to copy a permanent link or download a Coriva-generated QR code as a PNG. The profile link is kept hidden and **Copy link** copies it directly. Downloaded QR codes include a white border for reliable scanning.

The profile header uses a smaller picture inside the banner, and storefronts appear as compact cards with a dedicated link.

Links use your account ID, so changing your username does not break them.

## Apply this update

1. Commit the updated website files, including `app.bundle.js`, `profile-page.js`, `script.js`, `styles.css`, `index.html`, `imagekit-media.js`, and `vendor/`.
2. Deploy the included `firestore.rules` to the same Firebase project used by Coriva. From a configured Firebase CLI, run `firebase deploy --only firestore:rules`, or publish the complete rules file in the Firebase console.
3. Each existing user should sign in once after the update to create their public profile record. Saving a profile also updates that record.

The rules change is required for profile saves and public links. Private account documents remain owner-only. Public profiles include username, profile images, bio, role/focus, account type, and social links; they exclude email, full name, country, and billing preferences.

Profile banner uploads use the existing ImageKit upload service. Profile QR generation is embedded in `app.bundle.js`; it does not require loading a separate QR script. Public profile update failures are displayed separately and no longer prevent QR generation. QR codes are generated in the browser using QRCode.js and do not send profile links to an external QR service.

Rebuild after editing JavaScript with `npm ci` followed by `npm run build`.

## Branded QR codes

All Coriva-generated profile and invoice payment QR codes use the same embedded generator, with the Coriva logo centered on a small badge. High error correction, a white margin, and crisp full-resolution exports preserve scanning. Profile, payment, and long checkout links were decoded successfully during validation.
