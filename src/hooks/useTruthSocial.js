import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTrumpPosts } from '../services/truthSocial';

const STORAGE_KEY = 'truthSocialLastSeenId';
const POLL_INTERVAL = 60_000; // check every 60 seconds

function getLastSeenId() {
  return localStorage.getItem(STORAGE_KEY);
}

function setLastSeenId(id) {
  localStorage.setItem(STORAGE_KEY, id);
}

/** Request browser notification permission. Returns true if granted. */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/** Show a browser notification for a new Trump post. */
function showNotification(post) {
  if (Notification.permission !== 'granted') return;

  const body =
    post.content.length > 200
      ? post.content.slice(0, 200) + '...'
      : post.content;

  const notification = new Notification('New Truth Social Post — Trump', {
    body,
    icon: 'https://truthsocial.com/packs/media/icons/apple-touch-icon-180x180-a536a498.png',
    tag: `truth-${post.id}`,
  });

  notification.onclick = () => {
    window.open(post.url, '_blank');
    notification.close();
  };
}

/**
 * Hook that polls Trump's Truth Social feed and sends browser notifications
 * for new posts.
 *
 * Returns { posts, unreadCount, enabled, setEnabled, markAllRead, latestPost }.
 */
export default function useTruthSocial() {
  const [posts, setPosts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem('truthNotificationsEnabled');
    return stored === null ? true : stored === 'true';
  });
  const lastSeenRef = useRef(getLastSeenId());

  // Persist enabled state
  useEffect(() => {
    localStorage.setItem('truthNotificationsEnabled', String(enabled));
  }, [enabled]);

  const poll = useCallback(async () => {
    try {
      const newPosts = await fetchTrumpPosts(null, 10);
      if (newPosts.length === 0) return;

      setPosts(newPosts);

      const lastSeen = lastSeenRef.current;
      if (lastSeen) {
        const unseenPosts = newPosts.filter((p) => p.id > lastSeen);
        setUnreadCount(unseenPosts.length);

        // Send browser notification for the most recent unseen post
        if (unseenPosts.length > 0 && enabled) {
          showNotification(unseenPosts[0]);
        }
      } else {
        // First load — mark everything as seen
        setLastSeenId(newPosts[0].id);
        lastSeenRef.current = newPosts[0].id;
      }
    } catch {
      // Silently fail — will retry on next poll
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll, enabled]);

  const markAllRead = useCallback(() => {
    if (posts.length > 0) {
      setLastSeenId(posts[0].id);
      lastSeenRef.current = posts[0].id;
    }
    setUnreadCount(0);
  }, [posts]);

  return {
    posts,
    unreadCount,
    enabled,
    setEnabled,
    markAllRead,
    latestPost: posts[0] || null,
  };
}
