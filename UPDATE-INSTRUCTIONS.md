# Coriva mobile, inbox and room chat update

This ZIP is an update for your existing Coriva project. Extract it into the project root and commit the included files. Keep your existing media-config.js with its working ImageKit upload URL; this update does not contain or change that file.

## Included changes

- Buyers can take down their own requests from the listing, application details or Tasks. Taken-down requests stop accepting applications, leave the public listing and retain their Tasks history. An assigned creator receives a notification when an active request is taken down.
- Buyer posting validates trimmed titles/descriptions, budgets and currencies before saving. A permission denial explains how to publish the required rules. Posting and taking down requests require the included rules; publishing only frontend files is insufficient.


- Share beside Manage storefront opens a direct link with Copy link. Shared URLs open the correct storefront automatically for signed-in users and guests, including after refresh. Links use the current host and the storefront’s permanent ID, so renaming a store does not break the link. This addition needs no backend changes.

- Buyer requests tab beside Stores: buyers post a title, requirements, budget and currency. Creators apply using a storefront they own. Every application sends the buyer a notification; the buyer reviews storefronts and selects one. A project can be awarded once.
- Tasks page beside Notifications tracks your posted requests and projects awarded to your store. Only the selected creator can click Complete Job. The buyer receives: “Your project is done, Please contact 'shop' for further details.” Completed projects remain in Tasks.
- Applications and project completion use atomic Firestore transactions, with matching rules for ownership and state transitions. Application details are visible only to the buyer and the applying store owner.

## Activate Buyer requests and Tasks

Publish the included firestore.rules using Firebase Console → Firestore Database → Rules → Publish, then publish index.html, styles.css and app.bundle.js. The new feature does not require a new Cloud Functions deployment or Blaze upgrade. Include firebase.js and buyer-requests.js when committing the source files. The frontend is already bundled.

Project descriptions and budgets are public. Buyers must select a store before a task becomes active; creators cannot claim projects directly. Applications are limited to one per storefront for each request.


- Snapchat links now display a bundled yellow ghost logo on profiles, storefronts, and link previews, including snapchat.com and snap.com links.

- Stores tab beside For you and Rooms lists all storefronts in a responsive grid with banners, logos, names, handles, and categories. Search by name, category, or @handle; select a card to open its storefront. New storefronts appear live.

- Notifications show a red unread-count badge, hidden when there are no unread updates. Counts above 99 display as 99+, with the full count available to screen readers.

- Search the Rooms tab by room name, description, or creator.
- Search within a room by message text, code, GIF description, or sender name. Use `@username` to filter by sender or `@username invoice` to search that sender’s messages for “invoice”. Use `@"Full Name" invoice` for usernames containing spaces. The Rooms tab also supports `@creator` filtering. Matching words are highlighted in result previews; choosing a result jumps to that message in the full conversation. Results update live, and Show more exposes older matches.

- Storefront and creator editor layouts adapt to small screens. Notifications are now reachable in the mobile navigation.
- Storefront cards show their banner behind their logo. Bios remain on the storefront page.
- Chat rooms use larger banner-backed cards in a vertically scrollable list, retaining their letter logos.
- Notifications include buyer/creator chat threads and pending estimate requests. Creators reply in the original buyer conversation.
- Rooms have profile pictures (with letter fallbacks), mention suggestions, and typing indicators that expire after inactivity.
- Mention alerts show the room name. Opening one scrolls to and highlights the specific message, including messages earlier in the conversation. Deleted messages show a clear explanation.
- Code fences and common pasted code are rendered in outlined, horizontally scrollable code blocks with Copy buttons. Inline code and mentions are styled. Messages support multiple lines and up to 10,000 characters. Enter sends; Shift+Enter adds a new line. Enter selects a highlighted mention while suggestions are open.

## Apply the update

1. Extract the ZIP into your existing project root and commit the files. Upload the updated index.html, styles.css, and app.bundle.js to your current website host. The bundle is already built; a frontend rebuild is not required.
2. If you already deployed the backend from the previous Mobile Chat Update, message search needs no additional backend deployment. If this is your first installation of the combined update, run the following from the project root:

   ```bash
   npm --prefix functions ci
   firebase deploy --only firestore:rules,functions --project aethel-30d56
   ```

   The backend deploy is required for typing/profile/mention fields, persistent read states, storefront message alerts, and room mention alerts. Existing estimate requests use the included corivaWorkflow function. Updating only index.html will not activate these features.
3. Refresh the website after publishing. Styles and bundle references now use version 16 to avoid old cached files.

If you modify the frontend source later, run `npm install` then `npm run build` and publish the rebuilt app.bundle.js. Preserve your current ImageKit worker and upload configuration.

## Validation

The production bundle builds successfully. Posting validation and takedown checks passed for buyer ownership, listing removal, assigned-creator notifications, duplicate withdrawal handling, and withdrawn requests rejecting new applications/completion. These used simulated services; publishing the included rules to the live project is required. Storefront sharing checks passed for link generation, clipboard copying and fallback, mobile dialog layout, guest access, refreshing shared links, closing the page, and missing storefronts. Local simulated-service checks cover posting and searching buyer requests, selecting a storefront to apply, buyer application review/selection, Tasks navigation/completion, exact notification text, duplicate application prevention, competing selection attempts, unauthorized ownership checks, and phone/desktop layouts. Firestore rules were reviewed but could not be executed against an emulator in this environment. Stores grid checks passed at 320, 390, 860, and 1280 px, including card navigation, banner/logo rendering, name/category/@handle searches, empty results, and live collection updates. Browser tests with simulated Firebase data passed at widths 320, 360, 390, 620, 860 and 1280 px for storefront viewing/editing and room chat. Tests also covered buyer inbox and replies, pending request visibility, mention selection, typing, safe code rendering, scrollable cards, a mention notification jumping to a message among 80 historical messages, room directory search, @username sender filters combined with message text, empty results, older result pagination, and search layout at phone widths. Backend tests verified alert recipients, trigger retry deduplication, read-state preservation, and room membership checks.

These checks used local simulated services. No live Firebase deployment was performed, and Firestore rules were not tested against a live project. After deployment, use two accounts to confirm buyer requests/replies, typing, profile pictures, and a mention notification opening the correct historical message.
