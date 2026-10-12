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
