import { auth } from './firebase.js';
    export async function uploadMediaBlob(n) {
      let e = window.CORIVA_MEDIA_CONFIG?.uploadUrl;
      if (!e) throw new Error("ImageKit is not connected yet. The site owner must set uploadUrl in media-config.js.");
      if (!e.startsWith("https://")) throw new Error("The ImageKit upload service must use HTTPS.");
      let t = auth.currentUser;
      if (!t) throw new Error("Sign in before uploading a photo.");
      let r = await t.getIdToken(), i = new FormData();
      i.set("file", n, "media");
      let s = new AbortController(), o = setTimeout(() => s.abort(), 45e3);
      try {
        let a = await fetch(e, { method: "POST", headers: { Authorization: "Bearer " + r }, body: i, signal: s.signal }), u;
        try {
          u = await a.json();
        } catch {
          throw new Error("The upload service returned an invalid response. Check media-config.js.");
        }
        if (!a.ok) throw new Error(u.error || "Image upload failed.");
        if (typeof u.url != "string" || !u.url.startsWith("https://")) throw new Error("ImageKit did not return an image URL.");
        return u.url;
      } catch (a) {
        throw a.name === "AbortError" ? new Error("Image upload timed out. Check your connection and retry.") : a;
      } finally {
        clearTimeout(o);
      }
    }
