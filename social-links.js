const createElement = (tag, cls = "", text = "") => { const e = document.createElement(tag); e.className = cls; e.textContent = text; return e; };
const socialServices = [
  { domains: ['snapchat.com', 'snap.com'], name: 'Snapchat', iconSrc: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%227%22%20fill%3D%22%23090909%22%2F%3E%3Cpath%20transform%3D%22translate%284%204%29%22%20fill%3D%22%23ffffff%22%20d%3D%22M12.206.793c.99%200%204.347.276%205.93%203.821.529%201.193.403%203.219.299%204.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12%201.033-.301.165-.088.344-.104.464-.104.182%200%20.359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213%201.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136%201.526%203.475%204.791%204.014.255.044.435.27.42.509%200%20.075-.015.149-.045.225-.24.569-1.273.988-3.146%201.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135%200-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3%200-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826%201.288-3.294%201.288-.06%200-.119-.015-.18-.015h-.149c-1.468%200-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54%200-.958.089-1.272.149-.211.043-.391.074-.54.074-.374%200-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509%203.264-.54%204.73-3.879%204.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793%201.168-.793.146%200%20.27.029.383.074.42.194.789.3%201.104.3.234%200%20.384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392%201.077%2010.739.807%2011.727.807l.419-.015h.06z%22%2F%3E%3C%2Fsvg%3E' },
  { domains: ['instagram.com'], name: 'Instagram', icon: 'instagram' },
  { domains: ['linkedin.com'], name: 'LinkedIn', icon: 'linkedin' },
  { domains: ['x.com', 'twitter.com'], name: 'X', iconSrc: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%227%22%20fill%3D%22%23090909%22%2F%3E%3Cpath%20transform%3D%22translate%284%204%29%22%20fill%3D%22%23ffffff%22%20d%3D%22M14.234%2010.162%2022.977%200h-2.072l-7.591%208.824L7.251%200H.258l9.168%2013.343L.258%2024H2.33l8.016-9.318L16.749%2024h6.993zm-2.837%203.299-.929-1.329L3.076%201.56h3.182l5.965%208.532.929%201.329%207.754%2011.09h-3.182z%22%2F%3E%3C%2Fsvg%3E' },
  { domains: ['tiktok.com'], name: 'TikTok', icon: 'tiktok' },
  { domains: ['youtube.com', 'youtu.be'], name: 'YouTube', icon: 'youtube' },
  { domains: ['facebook.com', 'fb.com'], name: 'Facebook', icon: 'facebook' },
  { domains: ['threads.net'], name: 'Threads', icon: 'threads' },
  { domains: ['behance.net'], name: 'Behance', icon: 'behance' },
  { domains: ['dribbble.com'], name: 'Dribbble', icon: 'dribbble' },
  { domains: ['github.com'], name: 'GitHub', icon: 'github' },
  { domains: ['twitch.tv'], name: 'Twitch', icon: 'twitch' },
  { domains: ['discord.com', 'discordapp.com', 'discord.gg'], name: 'Discord', iconSrc: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%227%22%20fill%3D%22%23090909%22%2F%3E%3Cpath%20transform%3D%22translate%284%204%29%22%20fill%3D%22%23ffffff%22%20d%3D%22M20.317%204.3698a19.7913%2019.7913%200%2000-4.8851-1.5152.0741.0741%200%2000-.0785.0371c-.211.3753-.4447.8648-.6083%201.2495-1.8447-.2762-3.68-.2762-5.4868%200-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077%200%2000-.0785-.037%2019.7363%2019.7363%200%2000-4.8852%201.515.0699.0699%200%2000-.0321.0277C.5334%209.0458-.319%2013.5799.0992%2018.0578a.0824.0824%200%2000.0312.0561c2.0528%201.5076%204.0413%202.4228%205.9929%203.0294a.0777.0777%200%2000.0842-.0276c.4616-.6304.8731-1.2952%201.226-1.9942a.076.076%200%2000-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077%200%2001-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743%200%2001.0776-.0105c3.9278%201.7933%208.18%201.7933%2012.0614%200a.0739.0739%200%2001.0785.0095c.1202.099.246.1981.3728.2924a.077.077%200%2001-.0066.1276%2012.2986%2012.2986%200%2001-1.873.8914.0766.0766%200%2000-.0407.1067c.3604.698.7719%201.3628%201.225%201.9932a.076.076%200%2000.0842.0286c1.961-.6067%203.9495-1.5219%206.0023-3.0294a.077.077%200%2000.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061%200%2000-.0312-.0286zM8.02%2015.3312c-1.1825%200-2.1569-1.0857-2.1569-2.419%200-1.3332.9555-2.4189%202.157-2.4189%201.2108%200%202.1757%201.0952%202.1568%202.419%200%201.3332-.9555%202.4189-2.1569%202.4189zm7.9748%200c-1.1825%200-2.1569-1.0857-2.1569-2.419%200-1.3332.9554-2.4189%202.1569-2.4189%201.2108%200%202.1757%201.0952%202.1568%202.419%200%201.3332-.946%202.4189-2.1568%202.4189Z%22%2F%3E%3C%2Fsvg%3E' },
  { domains: ['pinterest.com'], name: 'Pinterest', icon: 'pinterest' }
];

const getSocialService = (value) => {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return socialServices.find((service) => service.domains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )) || { name: hostname, icon: '' };
  } catch {
    return null;
  }
};

const getProfileSocialUrls = (profile) => {
  if (Array.isArray(profile?.socialLinks)) return profile.socialLinks;
  return [profile?.instagram, profile?.linkedin, profile?.xProfile, profile?.portfolio].filter(Boolean);
};

const createSocialAnchor = (value) => {
  const service = getSocialService(value);
  if (!service) return null;

  const url = new URL(value);
  const link = createElement('a', `social-link${service.name === 'Snapchat' ? ' social-link-snapchat' : service.name === 'Discord' ? ' social-link-discord' : service.name === 'X' ? ' social-link-x' : ''}`);
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.title = service.name;
  link.setAttribute('aria-label', `${service.name} profile`);

  if (service.icon || service.iconSrc) {
    const logo = createElement('img');
    logo.src = service.iconSrc || `https://cdn.simpleicons.org/${service.icon}`;
    logo.alt = '';
    logo.addEventListener('error', () => {
      logo.replaceWith(createElement('span', 'social-icon-fallback', service.name.charAt(0).toUpperCase()));
    }, { once: true });
    link.append(logo);
  } else {
    link.append(createElement('span', 'social-icon-fallback', service.name.charAt(0).toUpperCase()));
  }

  link.append(createElement('span', 'visually-hidden', service.name));
  return link;
};

export { getSocialService, getProfileSocialUrls, createSocialAnchor };
