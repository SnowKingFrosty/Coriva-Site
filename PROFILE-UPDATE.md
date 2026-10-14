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

## Signed-out profile links

Initial shared profile URLs now open in a dedicated public view without starting sign-in or loading private features. The view makes unauthenticated HTTPS requests only for public profile and storefront records. It works without local browser storage, includes a retry button after loading failures, and can show legacy creators from their already-public storefront data. Back and storefront buttons navigate to their normal pages. Owners can continue customizing their profile from View profile on the main page.

Deploy the updated website files, especially index.html, app.bundle.js, and styles.css. The main-page layout is unchanged. Existing NFC links and QR codes keep the same URLs. No APK rebuild or new Firestore rules are required for this fix when the previously supplied publicProfiles rules are deployed.

Validation: production public-profile and storefront endpoints allow unauthenticated reads; built-app tests cover guest access with storage blocked and an iPhone viewport/user agent, public storefronts, QR sharing, failed-request retries, legacy storefront fallback, and normal main-page startup. Real Safari and physical iPhone testing were not available.

## First-visit welcome after public profiles

Back to Coriva opens the normal homepage. Visitors who have not seen onboarding get the welcome choices and can sign up or switch to sign in. The welcome is remembered as soon as it appears, using local browser storage and a first-party cookie fallback. Subsequent returns skip onboarding. Existing welcome markers are respected. Public profiles continue to open without signing in.

Validated first-time back navigation, both authentication choices, and repeat back navigation with local storage blocked.

## Profile discovery and chat links

Select Profiles in the Discover feed to browse and search public profiles. Search supports partial usernames, @usernames, case-insensitive matching, and specialties. Results show profile pictures, public usernames, specialties, and storefront counts when available. Both creator and shopper public profiles are included. Refresh retries a failed load and retrieves new profiles. The directory reads paginated public records without requiring sign-in and never reads private account documents.

Click a message sender's username in a chat room to open their public profile. Links use the sender's account ID, so a username change does not break them. Legacy messages with no sender account ID retain a text label.

Upload the updated index.html, styles.css, app.bundle.js and source files. Existing publicProfiles Firestore rules already permit discovery; no rules change is required.

Validation covers the built app's public directory, pagination, signed-out search, partial/case/@ and specialty matching, empty results, clear, retry, guest profile navigation, the production chat-message renderer's account-ID links, renamed users, and mobile layout.

## Android Share profile

In the Coriva Android app, Share profile on your own profile opens the native Digital Business Card after publishing your public profile. The screen provides NFC, QR and Copy link. Regular browsers and other people's public profiles retain website sharing. Install Coriva-App-v1.5.apk to get the native Copy link button, and upload the updated website files including app.bundle.js and index.html.
