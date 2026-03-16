const API_BASE = '/api/truth/api/v1';

// Trump's Truth Social account ID (realDonaldTrump)
const TRUMP_ACCOUNT_ID = '107780257626128497';

/**
 * Fetch Trump's latest Truth Social posts.
 * Uses the Mastodon-compatible API that Truth Social exposes.
 * Returns array of { id, content, createdAt, url }.
 */
export async function fetchTrumpPosts(sinceId = null, limit = 5) {
  let url = `${API_BASE}/accounts/${TRUMP_ACCOUNT_ID}/statuses?limit=${limit}&exclude_replies=true`;
  if (sinceId) {
    url += `&since_id=${sinceId}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Truth Social API ${res.status}`);

  const posts = await res.json();
  return posts.map((post) => ({
    id: post.id,
    content: stripHtml(post.content || ''),
    createdAt: post.created_at,
    url: post.url || `https://truthsocial.com/@realDonaldTrump/posts/${post.id}`,
  }));
}

/** Strip HTML tags from post content to get plain text. */
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
