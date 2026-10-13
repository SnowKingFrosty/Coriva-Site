# FYP and shop post update

Upload/commit the updated files, including the new `feed-viewer.js` and `post-views.js`.
The ready-to-use `app.bundle.js` is included.

Deploy the included `firestore.rules` using your existing Firebase project:

```sh
firebase deploy --only firestore:rules
```

Shop post cards show likes and views and open the matching post on the For you feed.
Views count after a post is at least 60% visible on the FYP for two seconds,
once per post per browser session. Earlier views were not tracked, so old posts
start at zero unless they already have a saved `views` count.

The full screen feed, expandable captions and full-image sizing are included.

## Likes and notifications

Upload the new `post-likes.js` along with the updated `app.bundle.js` and `index.html`.
Publish the updated Firestore rules before using this feature.

Each signed-in user has their own like state. A first like sends the post owner
“Username has liked your post!” in Notifications. Open on that notification
returns to the post on the FYP. Self-likes do not send alerts, and unliking or
liking the same post again does not create duplicate notifications.

Double-tap a post to like it (desktop users can double-click). An already-liked
post stays liked. Caption controls and shop buttons retain their own actions,
and swipe gestures still scroll posts.

## Double-tap fix

The mobile gesture handler now supports native touch events and a pointer-event
fallback, tolerates feed refreshes between taps, and keeps swipe scrolling.
A successful double-tap like gives a short vibration where the browser supports
it. Upload the updated `post-likes.js`, `index.html`, and `styles.css`.
The same previously supplied Firestore rules are still required; no new rule
changes are needed for this gesture fix.

## Like saving fix

Publish the full current `firestore-rules.txt` in Firebase Console >
Firestore Database > Rules, then upload the updated `index.html`,
`app.bundle.js`, and `post-likes.js` and reload the site.

The notification username now handles accounts with a missing profile or
null/invalid username. The site reports permission, sign-in, and connection
errors separately. Likes, unlikes, notifications, and legacy profile handling
were tested against the Firestore emulator using the included rules.
