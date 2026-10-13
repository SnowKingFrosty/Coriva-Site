// Shared profile URLs open without starting authentication or private features.
const profileId = new URL(window.location.href).searchParams.get('profile');
const start = profileId ? import('./guest-profile.js').then(module => module.startGuestProfile(profileId)) : import('./script.js');
start.catch(error => {
  console.error('Coriva startup failed', error);
  const status = document.getElementById('publicProfileStatus');
  if (profileId && status) status.textContent = 'Unable to open this profile. Please reload and try again.';
});
