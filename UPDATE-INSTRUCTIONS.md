# Coriva mobile, inbox and room chat update

This ZIP is an update for your existing Coriva project. Extract it into the project root and commit the included files. Keep your existing media-config.js with its working ImageKit upload URL; this update does not contain or change that file.

## Included changes

- Search the Rooms tab by room name, description, or creator.
- Search within a room by message text, code, GIF description, or sender name. Use `@username` to filter by sender or `@username invoice` to search that sender’s messages for “invoice”. Use `@"Full Name" invoice` for usernames containing spaces. The Rooms tab also supports `@creator` filtering. Matching words are highlighted in result previews; choosing a result jumps to that message in the full conversation. Results update live, and Show more exposes older matches.

- Storefront and creator editor layouts adapt to small screens. Notifications are now reachable in the mobile navigation.
- Storefront cards show their banner behind their logo. Bios remain on the storefront page.
- Chat rooms use larger banner-backed cards in a vertically scrollable list, retaining their letter logos.
- Notifications include buyer/creator chat threads and pending estimate requests. Creators reply in the original buyer conversation.
- Rooms have profile pictures (with letter fallbacks), mention suggestions, and typing indicators that expire after inactivity.
- Mention alerts show the room name. Opening one scrolls to and highlights the specific message, including messages earlier in the conversation. Deleted messages show a clear explanation.
- Code fences and common pasted code are rendered in outlined, horizontally scrollable code blocks with Copy buttons. Inline code and mentions are styled. Messages support multiple lines and up to 10,000 characters. Ctrl+Enter / Cmd+Enter sends; Enter adds a line.

## Apply the update

1. Extract the ZIP into your existing project root and commit the files. Upload the updated index.html, styles.css, and app.bundle.js to your current website host. The bundle is already built; a frontend rebuild is not required.
2. If you already deployed the backend from the previous Mobile Chat Update, message search needs no additional backend deployment. If this is your first installation of the combined update, run the following from the project root:

   ```bash
   npm --prefix functions ci
   firebase deploy --only firestore:rules,functions --project aethel-30d56
   ```

   The backend deploy is required for typing/profile/mention fields, persistent read states, storefront message alerts, and room mention alerts. Existing estimate requests use the included corivaWorkflow function. Updating only index.html will not activate these features.
3. Refresh the website after publishing. Styles and bundle references now use version 9 to avoid old cached files.

If you modify the frontend source later, run `npm install` then `npm run build` and publish the rebuilt app.bundle.js. Preserve your current ImageKit worker and upload configuration.

## Validation

The production bundle builds successfully. Browser tests with simulated Firebase data passed at widths 320, 360, 390, 620, 860 and 1280 px for storefront viewing/editing and room chat. Tests also covered buyer inbox and replies, pending request visibility, mention selection, typing, safe code rendering, scrollable cards, a mention notification jumping to a message among 80 historical messages, room directory search, @username sender filters combined with message text, empty results, older result pagination, and search layout at phone widths. Backend tests verified alert recipients, trigger retry deduplication, read-state preservation, and room membership checks.

These checks used local simulated services. No live Firebase deployment was performed, and Firestore rules were not tested against a live project. After deployment, use two accounts to confirm buyer requests/replies, typing, profile pictures, and a mention notification opening the correct historical message.
