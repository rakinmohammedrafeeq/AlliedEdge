// Centralized API client for a Spring Security session (JSESSIONID cookie).
//
// Cross-origin local dev (Vite :5173 -> Spring Boot :8080):
// - Every request MUST use `credentials: 'include'` so the browser sends JSESSIONID.
// - Backend must set proper CORS headers (allow credentials + explicit origin).
// - Cross-site cookies commonly require `SameSite=None; Secure`.
// Allow overriding in local dev: set VITE_API_BASE_URL in frontend/.env
// Example: VITE_API_BASE_URL=http://localhost:8080/api
// Prefer the Vite dev proxy by default (same-origin) to avoid CORS/cookie issues.
// In production, we MUST call the real backend origin (Render) unless the app is
// deployed behind a same-origin reverse proxy. If you deploy a proxy, set
// VITE_API_BASE_URL=/api in that environment.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://alliededge-backend.onrender.com/api');

// Dev-time guard: if we're using the relative proxy base but the dev server isn't proxying,
// requests can incorrectly hit :5173 and fail with 403/404.
if (import.meta.env.DEV) {
  const isRelativeApi = !/^https?:\/\//i.test(API_BASE_URL);
  if (isRelativeApi && location.port === '5173') {
    // eslint-disable-next-line no-console
    console.debug('[api] Using Vite proxy via API_BASE_URL=', API_BASE_URL);
  }
}

// Required UI message for any 401/403 from the backend.
export const UNAUTHENTICATED_MESSAGE = 'Please log in to continue.';
export const FORBIDDEN_MESSAGE = 'You do not have permission to perform this action.';

export function isUnauthenticatedStatus(status: number | undefined): boolean {
  return status === 401 || status === 403;
}


export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function escapeRegexLiteral(value: string): string {
  // Escape characters that have special meaning in RegExp source.
  // Reference: used widely in cookie/header parsing.
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCookie(name: string): string | undefined {
  const escapedName = escapeRegexLiteral(name);
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

// In a cross-site deployment (Vercel -> Render), some browsers partition or hide
// backend cookies from `document.cookie`. We still can obtain the CSRF token
// via the JSON body returned by GET /api/csrf, so cache it here.
let cachedCsrfToken: string | undefined;

/**
 * Single API client for the entire app.
 * - Always sends cookies (session-based auth).
 * - Throws ApiError on non-2xx.
 */
export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (isUnsafeMethod(init.method)) {
    await ensureCsrfToken();
  }

  const csrf = cachedCsrfToken || getCookie('XSRF-TOKEN');

  const headers: Record<string, string> = {};
  // Only set JSON content-type when sending JSON. Never for FormData.
  if (init.body && !isFormData(init.body)) {
    headers['Content-Type'] = 'application/json';
  }
  if (csrf) {
    // Spring may advertise either X-XSRF-TOKEN (common default) or X-CSRF-TOKEN.
    // Send both for maximum compatibility.
    headers['X-XSRF-TOKEN'] = csrf;
    headers['X-CSRF-TOKEN'] = csrf;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...headers,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';

    // Prefer structured JSON error messages when provided by the API.
    if (ct.includes('application/json')) {
      try {
        const data = (await res.json()) as any;
        const msgFromJson =
          (typeof data?.message === 'string' && data.message) ||
          (typeof data?.errorMessage === 'string' && data.errorMessage) ||
          (typeof data?.error === 'string' && data.error) ||
          '';

        const message = msgFromJson
          ? msgFromJson
          : (isUnauthenticatedStatus(res.status)
              ? UNAUTHENTICATED_MESSAGE
              : `Request failed (HTTP ${res.status})`);

        throw new ApiError(res.status, message);
      } catch {
        // fall through to text parsing
      }
    }

    const text = await res.text().catch(() => '');
    // Never mention providers or any non-session auth in UI errors.
    const message = isUnauthenticatedStatus(res.status)
      ? UNAUTHENTICATED_MESSAGE
      : text || `Request failed (HTTP ${res.status})`;
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as unknown as T;

  const ct = res.headers.get('content-type') || '';

  // Some Spring handlers can return 200/201 with an empty body.
  const contentLength = res.headers.get('content-length');
  const isEmptyBody = contentLength === '0' || res.status === 205;

  if (ct.includes('application/json')) {
    return (await res.json()) as T;
  }

  // If it's a successful response but not JSON, try to consume text.
  // If body is empty, return undefined (callers that don't need the body will be fine).
  if (ct.startsWith('text/') || ct === '' || isEmptyBody) {
    const text = await res.text().catch(() => '');
    if (!text) return undefined as unknown as T;
    // If caller expects a string, this will work; otherwise it's still safer than throwing.
    return text as unknown as T;
  }

  // Keep this generic; backend might return HTML on success in some edge cases.
  // Don't hard-fail the UI for a successful status.
  const fallbackText = await res.text().catch(() => '');
  return (fallbackText || undefined) as unknown as T;
}

async function ensureCsrfToken(): Promise<void> {
  if (cachedCsrfToken) return;

  // Always hit the backend CSRF bootstrap endpoint. It returns JSON:
  // { token, headerName, parameterName }
  const res = await fetch(`${API_BASE_URL}/csrf`, { credentials: 'include' });
  if (!res.ok) {
    throw new ApiError(res.status, UNAUTHENTICATED_MESSAGE);
  }

  try {
    const data = (await res.json()) as any;
    if (data && typeof data.token === 'string' && data.token) {
      cachedCsrfToken = data.token;
      return;
    }
  } catch {
    // ignore; fall back to cookie-based token
  }

  // Fallback: try cookie (works in same-site environments / local dev).
  const cookieToken = getCookie('XSRF-TOKEN');
  if (cookieToken) {
    cachedCsrfToken = cookieToken;
    return;
  }

  throw new ApiError(
    403,
    'Security token not set (CSRF). Please refresh and try again. If the problem persists, allow third‑party cookies for this site.',
  );
}

// Backward-compatible alias
async function ensureCsrfCookie(): Promise<void> {
  return ensureCsrfToken();
}

function isUnsafeMethod(method: string | undefined): boolean {
  const m = (method || 'GET').toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

// ---- API wrappers (thin helpers) ----

export const authApi = {
  status: () => apiClient<{ authenticated: boolean; name?: string; user?: User; message?: string }>('/auth/status'),
  logout: () => apiClient<void>('/auth/logout', { method: 'POST' }),
};

export const postsApi = {
  fetchPosts: async (
    params: { page?: number; size?: number; sortBy?: string; keyword?: string; signal?: AbortSignal } = {},
  ) => {
    const { items } = await postsApi.fetchPostsPaged(params);
    return items;
  },

  fetchPostsPaged: async (
    params: { page?: number; size?: number; sortBy?: string; keyword?: string; signal?: AbortSignal } = {},
  ): Promise<{ items: Post[]; pageInfo?: { pageNumber: number; pageSize: number; totalPages: number; totalElements: number; last: boolean } }> => {
    const q = new URLSearchParams();
    if (params.page != null) q.set('page', String(params.page));
    if (params.size != null) q.set('size', String(params.size));
    if (params.sortBy) q.set('sortBy', params.sortBy);
    if (params.keyword) q.set('keyword', params.keyword);
    const suffix = q.toString() ? `?${q.toString()}` : '';

    const raw = await apiClient<unknown>(
      `/posts${suffix}`,
      params.signal ? { signal: params.signal } : undefined,
    );

    const rawObj = raw as Record<string, unknown> | unknown[] | null;
    const postPageRaw =
      rawObj && !Array.isArray(rawObj)
        ? ((rawObj as Record<string, unknown>)?.postPage as Record<string, unknown> | undefined)
        : undefined;

    // Backend may provide either per-item likedByMe or a set of likedPostIds.
    const likedPostIdsRaw =
      postPageRaw && rawObj && !Array.isArray(rawObj)
        ? (rawObj as Record<string, unknown>).likedPostIds
        : undefined;
    const likedPostIds = new Set<number>(
      Array.isArray(likedPostIdsRaw)
        ? likedPostIdsRaw.map((v) => Number(v)).filter((n) => Number.isFinite(n))
        : likedPostIdsRaw && typeof likedPostIdsRaw === 'object'
          ? Object.keys(likedPostIdsRaw as Record<string, unknown>).map((k) => Number(k)).filter((n) => Number.isFinite(n))
          : []
    );

    const maybeContent = postPageRaw?.content;
    const itemsRaw: unknown[] = Array.isArray(maybeContent)
      ? maybeContent
      : Array.isArray(raw)
        ? (raw as unknown[])
        : [];

    const pageInfo = postPageRaw
      ? {
          pageNumber: Number(postPageRaw.pageNumber ?? 0),
          pageSize: Number(postPageRaw.pageSize ?? params.size ?? 0),
          totalPages: Number(postPageRaw.totalPages ?? 0),
          totalElements: Number(postPageRaw.totalElements ?? 0),
          last: Boolean(postPageRaw.last ?? false),
        }
      : undefined;

    const items = itemsRaw
      .map((pUnknown: unknown) => {
        const p = (pUnknown ?? {}) as Record<string, unknown>;

        const authorName =
          (p.authorDisplayName as string | undefined) ||
          (p.authorName as string | undefined) ||
          (p.authorUsername as string | undefined) ||
          'Unknown';

        const authorIsAdmin =
          typeof p.authorIsAdmin === 'boolean'
            ? (p.authorIsAdmin as boolean)
            : typeof (p as any).author_is_admin === 'boolean'
              ? ((p as any).author_is_admin as boolean)
              : undefined;

        const imageUrlsRaw = p.imageUrls;
        const imageUrls = Array.isArray(imageUrlsRaw)
          ? imageUrlsRaw.filter((u): u is string => typeof u === 'string')
          : undefined;

        const videoUrl = typeof p.videoUrl === 'string' ? p.videoUrl : undefined;

        return {
          id: Number(p.id ?? 0),
          title: typeof p.title === 'string' ? p.title : undefined,
          content: String(p.content ?? ''),
          createdAt: String(p.createdAt ?? ''),
          likes: Number(p.likes ?? 0),
          views: Number(p.views ?? 0),
          likedByMe:
            typeof p.likedByMe === 'boolean'
              ? (p.likedByMe as boolean)
              : (likedPostIds.has(Number(p.id)) ? true : undefined),
          imageUrls,
          videoUrl,
          updatedAt: p.updatedAt != null ? String(p.updatedAt as unknown) : undefined,
          commentCount: Number(p.commentCount ?? 0),
          comments: undefined,
          author: {
            id: Number(p.authorId ?? 0),
            name: String(authorName),
            avatar:
              p.authorProfileImageUrl != null
                ? String(p.authorProfileImageUrl)
                : undefined,
            role: authorIsAdmin ? 'ROLE_ADMIN' : undefined,
          },
        } as Post;
      })
      .filter((p) => p.id);

    return { items, pageInfo };
  },
  // Convenience for legacy callers that expect an "all posts" list.
  getAll: () => postsApi.fetchPosts({ page: 0, size: 100 }),

  /** Admin paged listing (scalable). Mirrors backend GET /api/admin/posts. */
  fetchAdminPaged: async (
    params: { page?: number; size?: number; sortBy?: string; keyword?: string; signal?: AbortSignal } = {},
  ): Promise<{ items: Post[]; pageInfo?: { pageNumber: number; pageSize: number; totalPages: number; totalElements: number; last: boolean } }> => {
    const q = new URLSearchParams();
    if (params.page != null) q.set('page', String(params.page));
    if (params.size != null) q.set('size', String(params.size));
    if (params.sortBy) q.set('sortBy', params.sortBy);
    if (params.keyword) q.set('keyword', params.keyword);
    const suffix = q.toString() ? `?${q.toString()}` : '';

    const raw = await apiClient<unknown>(
      `/admin/posts${suffix}`,
      params.signal ? { signal: params.signal } : undefined,
    );

    const rawObj = (raw ?? {}) as Record<string, unknown>;
    const postPageRaw = (rawObj.postPage ?? rawObj.posts ?? rawObj.page) as any;

    const contentRaw: unknown[] = Array.isArray(postPageRaw?.content)
      ? (postPageRaw.content as unknown[])
      : [];

    // Minimal admin mapping: accept entity-like Post from backend and coerce into our Post type.
    const adminItems: Post[] = contentRaw
      .map((pUnknown: unknown) => {
        const p = (pUnknown ?? {}) as Record<string, unknown>;
        const authorRaw = (p.user ?? p.author ?? {}) as Record<string, unknown>;
        const authorName =
          (authorRaw.displayName as string | undefined) ||
          (authorRaw.username as string | undefined) ||
          (p.authorDisplayName as string | undefined) ||
          (p.authorName as string | undefined) ||
          'Unknown';

        const imageUrlsRaw = p.imageUrls;
        const imageUrls = Array.isArray(imageUrlsRaw)
          ? imageUrlsRaw.filter((u): u is string => typeof u === 'string')
          : undefined;

        const videoUrl = typeof p.videoUrl === 'string' ? p.videoUrl : undefined;

        return {
          id: Number(p.id ?? 0),
          title: typeof p.title === 'string' ? p.title : undefined,
          content: String(p.content ?? ''),
          createdAt: String(p.createdAt ?? ''),
          updatedAt: p.updatedAt != null ? String(p.updatedAt as unknown) : undefined,
          likes: Number(p.likes ?? 0),
          views: Number(p.views ?? 0),
          likedByMe: typeof p.likedByMe === 'boolean' ? (p.likedByMe as boolean) : undefined,
          imageUrls,
          videoUrl,
          comments: undefined,
          author: {
            id: Number(authorRaw.id ?? p.authorId ?? 0),
            name: String(authorName),
            avatar:
              authorRaw.profileImageUrl != null
                ? String(authorRaw.profileImageUrl)
                : (p.authorProfileImageUrl != null ? String(p.authorProfileImageUrl) : undefined),
          },
        } as Post;
      })
      .filter((p) => p.id);

    const adminPageInfo = postPageRaw
      ? {
          pageNumber: Number(postPageRaw.number ?? params.page ?? 0),
          pageSize: Number(postPageRaw.size ?? params.size ?? 0),
          totalPages: Number(postPageRaw.totalPages ?? 0),
          totalElements: Number(postPageRaw.totalElements ?? 0),
          last: Boolean(postPageRaw.last ?? false),
        }
      : undefined;

    return { items: adminItems, pageInfo: adminPageInfo };
  },

  getById: async (id: number, opts: { sortComments?: 'newest' | 'oldest' | 'mostReplied' } = {}) => {
    const q = new URLSearchParams();
    if (opts.sortComments) q.set('sortComments', opts.sortComments);
    const suffix = q.toString() ? `?${q.toString()}` : '';

    const raw = await apiClient<unknown>(`/posts/${id}${suffix}`);
    const rawObj = (raw ?? {}) as Record<string, unknown>;

    // Backend returns { post: <PostDetailDto>, liked: boolean, ... }
    const postRaw = (rawObj.post ?? rawObj) as Record<string, unknown>;

    const imageUrlsRaw = postRaw.imageUrls;
    const imageUrls = Array.isArray(imageUrlsRaw)
      ? imageUrlsRaw.filter((u): u is string => typeof u === 'string')
      : undefined;

    const videoUrl = typeof postRaw.videoUrl === 'string' ? postRaw.videoUrl : undefined;

    const likedByMe = typeof rawObj.liked === 'boolean' ? (rawObj.liked as boolean) : undefined;

    const authorRaw = (postRaw.author ?? {}) as Record<string, unknown>;
    const authorName =
      (authorRaw.displayName as string | undefined) ||
      (authorRaw.username as string | undefined) ||
      'Unknown';

    const authorIsAdmin = typeof (authorRaw as any).admin === 'boolean' ? ((authorRaw as any).admin as boolean) : undefined;

    const commentsRaw = Array.isArray(postRaw.comments) ? (postRaw.comments as unknown[]) : [];
    const comments: Comment[] = commentsRaw
      .map((cUnknown) => {
        const c = (cUnknown ?? {}) as Record<string, unknown>;
        const ca = (c.author ?? {}) as Record<string, unknown>;

        const caName =
          (ca.displayName as string | undefined) ||
          (ca.username as string | undefined) ||
          'Unknown';

        const repliesRaw = Array.isArray(c.replies) ? (c.replies as unknown[]) : [];
        const replies: Reply[] = repliesRaw
          .map((rUnknown) => {
            const r = (rUnknown ?? {}) as Record<string, unknown>;
            const ra = (r.author ?? {}) as Record<string, unknown>;

            const raName =
              (ra.displayName as string | undefined) ||
              (ra.username as string | undefined) ||
              'Unknown';

            return {
              id: Number(r.id ?? 0),
              content: String(r.content ?? ''),
              createdAt: String(r.createdAt ?? ''),
              likes: Number(r.likes ?? 0),
              likedByMe: typeof r.likedByMe === 'boolean' ? (r.likedByMe as boolean) : undefined,
              author: {
                id: Number(ra.id ?? 0),
                name: String(raName),
                avatar: ra.profileImageUrl != null ? String(ra.profileImageUrl) : undefined,
              },
            } as Reply;
          })
          .filter((r) => r.id);

        return {
          id: Number(c.id ?? 0),
          content: String(c.content ?? ''),
          createdAt: String(c.createdAt ?? ''),
          updatedAt: undefined,
          likes: Number(c.likes ?? 0),
          likedByMe: typeof c.likedByMe === 'boolean' ? (c.likedByMe as boolean) : undefined,
          author: {
            id: Number(ca.id ?? 0),
            name: String(caName),
            avatar:
              ca.profileImageUrl != null
                ? String(ca.profileImageUrl)
                : undefined,
          },
          replies,
        } as Comment;
      })
      .filter((c) => c.id);

    return {
      id: Number(postRaw.id ?? id),
      title: typeof postRaw.title === 'string' ? (postRaw.title as string) : undefined,
      content: String(postRaw.content ?? ''),
      createdAt: String(postRaw.createdAt ?? ''),
      updatedAt: postRaw.updatedAt != null ? String(postRaw.updatedAt as unknown) : undefined,
      likes: Number(postRaw.likes ?? 0),
      views: Number(postRaw.views ?? 0),
      likedByMe,
      imageUrls,
      videoUrl,
      comments,
      author: {
        id: Number(authorRaw.id ?? 0),
        name: String(authorName),
        avatar:
          authorRaw.profileImageUrl != null
            ? String(authorRaw.profileImageUrl)
            : undefined,
      },
    } as Post;
  },
  // Prefer multipart endpoints because backend expects @ModelAttribute for /posts POST/PUT.
  create: (data: { content: string; title?: string }) => {
    const form = new FormData();
    if (data.title != null) form.append('title', data.title);
    form.append('content', data.content);
    return postsApi.createMultipart(form);
  },
  update: (id: number, data: { content: string; title?: string }) => {
    const form = new FormData();
    if (data.title != null) form.append('title', data.title);
    form.append('content', data.content);
    return postsApi.updateMultipart(id, form);
  },
  delete: (id: number) => apiClient<void>(`/posts/${id}`, { method: 'DELETE' }),
  like: (id: number) => apiClient<{ id: number; likes: number; liked: boolean }>(`/posts/${id}/like`, { method: 'POST' }),
  getPublic: () => postsApi.fetchPosts({ page: 0, size: 20 }),
  createMultipart: (form: FormData) => apiClient<Post>('/posts', { method: 'POST', body: form }),
  updateMultipart: (id: number, form: FormData) => apiClient<Post>(`/posts/${id}`, { method: 'PUT', body: form }),
  mine: () => apiClient<unknown>("/posts/mine?page=0&size=50"),
};

export const commentsApi = {
  create: (postId: number, data: { content: string }) =>
    apiClient<void>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { content: string }) =>
    apiClient<{ comment: Comment; postId: number | null }>(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createReply: (commentId: number, data: { content: string }) =>
    apiClient<{ reply: Reply; commentId: number }>(`/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  like: (commentId: number) =>
    apiClient<{ id: number; likes: number; liked: boolean }>(`/comments/${commentId}/like`, { method: 'POST' }),
  likeReply: (replyId: number) =>
    apiClient<{ id: number; likes: number; liked: boolean }>(`/replies/${replyId}/like`, { method: 'POST' }),
};

export const announcementsApi = {
  listPublic: () => apiClient<Announcement[]>('/announcements'),
  listAdmin: () => apiClient<Announcement[]>('/admin/announcements'),
  getAdmin: (id: number) => apiClient<Announcement>(`/admin/announcements/${id}`),

  /** Admin paged listing (scalable). Backend must support ?page=&size= (Spring Data). */
  listAdminPaged: async (
    params: { page?: number; size?: number; signal?: AbortSignal } = {},
  ): Promise<{ items: Announcement[]; pageInfo?: { pageNumber: number; pageSize: number; totalPages: number; totalElements: number; last: boolean } }> => {
    const q = new URLSearchParams();
    if (params.page != null) q.set('page', String(params.page));
    if (params.size != null) q.set('size', String(params.size));
    const suffix = q.toString() ? `?${q.toString()}` : '';

    const raw = await apiClient<unknown>(
      `/admin/announcements${suffix}`,
      params.signal ? { signal: params.signal } : undefined,
    );

    // Support both old (array) and new (paged) backend responses.
    if (Array.isArray(raw)) {
      return {
        items: raw as Announcement[],
        pageInfo: {
          pageNumber: params.page ?? 0,
          pageSize: params.size ?? (raw as unknown[]).length,
          totalPages: 1,
          totalElements: (raw as unknown[]).length,
          last: true,
        },
      };
    }

    const obj = (raw ?? {}) as Record<string, unknown>;
    const page = (obj.announcementsPage ?? obj.page ?? obj.announcementPage ?? obj) as any;
    const content: Announcement[] = Array.isArray(page?.content) ? (page.content as Announcement[]) : [];

    const pageInfo = page
      ? {
          pageNumber: Number(page.number ?? page.pageNumber ?? params.page ?? 0),
          pageSize: Number(page.size ?? page.pageSize ?? params.size ?? 0),
          totalPages: Number(page.totalPages ?? 0),
          totalElements: Number(page.totalElements ?? 0),
          last: Boolean(page.last ?? false),
        }
      : undefined;

    return { items: content, pageInfo };
  },

  create: (data: {
    title: string;
    message: string;
    visible?: boolean;
    imageFiles?: File[];
    videoFile?: File | null;
  }) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('message', data.message);
    if (data.visible != null) form.append('visible', String(data.visible));
    if (data.imageFiles && data.imageFiles.length > 0) {
      data.imageFiles.forEach((f) => {
        // Some servers bind repeated fields better when using [] notation.
        form.append('imageFiles', f);
        form.append('imageFiles[]', f);
      });
    }
    if (data.videoFile) form.append('videoFile', data.videoFile);

    return apiClient<Announcement>('/admin/announcements', { method: 'POST', body: form });
  },

  update: (id: number, data: {
    title?: string;
    message?: string;
    visible?: boolean;
    removeImages?: boolean;
    imageFiles?: File[];
    removeVideo?: boolean;
    videoFile?: File | null;
  }) => {
    const form = new FormData();
    if (data.title != null) form.append('title', data.title);
    if (data.message != null) form.append('message', data.message);
    if (data.visible != null) form.append('visible', String(data.visible));
    if (data.removeImages != null) form.append('removeImages', String(data.removeImages));
    if (data.imageFiles && data.imageFiles.length > 0) {
      data.imageFiles.forEach((f) => {
        form.append('imageFiles', f);
        form.append('imageFiles[]', f);
      });
    }
    if (data.removeVideo != null) form.append('removeVideo', String(data.removeVideo));
    if (data.videoFile) form.append('videoFile', data.videoFile);

    return apiClient<Announcement>(`/admin/announcements/${id}`, { method: 'PUT', body: form });
  },

  delete: (id: number) => apiClient<void>(`/admin/announcements/${id}`, { method: 'DELETE' }),
  toggleVisible: (id: number) => apiClient<{ message: string }>(`/admin/announcements/${id}/toggle`, { method: 'POST' }),
  deleteVideo: (id: number) => apiClient<Announcement>(`/admin/announcements/${id}/delete-video`, { method: 'POST' }),
};

export const profileApi = {
  get: async () => {
    const raw = await apiClient<unknown>("/profile");
    const rawObj = (raw ?? {}) as Record<string, unknown>;
    const u = (rawObj.user as Record<string, unknown> | undefined) ?? rawObj;

    const parseJsonArray = <T,>(value: unknown): T[] | undefined => {
      if (value == null) return undefined;
      if (Array.isArray(value)) return value as T[];
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? (parsed as T[]) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const parseJsonObject = <T extends object>(value: unknown): T | undefined => {
      if (value == null) return undefined;
      if (typeof value === 'object') return value as T;
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return (parsed && typeof parsed === 'object') ? (parsed as T) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const experience =
      parseJsonArray<Experience>(rawObj?.experience ?? u?.experience ?? (u as any)?.experienceJson) ??
      parseJsonArray<Experience>((u as any)?.experienceJson);

    const languages =
      parseJsonArray<Language>(rawObj?.languages ?? u?.languages ?? (u as any)?.languagesJson) ??
      parseJsonArray<Language>((u as any)?.languagesJson);

    const education =
      parseJsonArray<Education>(rawObj?.education ?? u?.education ?? (u as any)?.educationJson) ??
      parseJsonArray<Education>((u as any)?.educationJson);

    const availability =
      (rawObj?.availability as Availability | undefined) ||
      (u?.availability as Availability | undefined) ||
      parseJsonObject<Availability>((u as any)?.availabilityJson);

    // NOTE: /profile is the owner-only endpoint. We should show email & resume regardless of the
    // public visibility flags; those flags are for public/shareable profile pages.

    // Owner endpoint still returns the flags; surface them so the edit dialog can stay in sync.
    const showEmailOnProfile = Boolean((u as any)?.showEmailOnProfile);
    const showResumeOnProfile = Boolean((u as any)?.showResumeOnProfile);

    return {
      id: Number(u?.id),
      name: String(u?.displayName || u?.name || u?.username || ""),
      email: String((u as any)?.email || ""),
      role: ((u as any)?.role as any) || undefined,
      username: (u?.username as string | undefined) || undefined,
      avatar: (u?.profileImageUrl as string | undefined) || (u?.avatar as string | undefined) || undefined,
      bannerImage: (u?.bannerImageUrl as string | undefined) || (u?.bannerImage as string | undefined) || undefined,
      resumeUrl: ((u as any)?.resumeUrl as string | undefined) || undefined,
      location: (u?.location as string | undefined) || undefined,
      website: (u?.website as string | undefined) || undefined,
      github: (u?.github as string | undefined) || undefined,
      linkedin: (u?.linkedin as string | undefined) || undefined,
      twitter: (u?.twitter as string | undefined) || undefined,
      followersCount:
        (rawObj?.followersCount as number | undefined) ??
        (rawObj?.followerCount as number | undefined) ??
        (u?.followersCount as number | undefined),
      followingCount: (rawObj?.followingCount as number | undefined) ?? (u?.followingCount as number | undefined),
      bio: (u?.bio as string | undefined) || undefined,
      skills: (rawObj?.skills ?? u?.skills ?? []) as string[],
      projects: (rawObj?.projects ?? u?.projects ?? []) as Project[],
      experience,
      languages,
      education,
      availability,
      showEmailOnProfile,
      showResumeOnProfile,
    } as UserProfile;
  },
  getById: async (userId: number) => {
    const raw = await apiClient<unknown>(`/profile/users/${userId}`);
    const rawObj = (raw ?? {}) as Record<string, unknown>;

    // /profile/users/{id} returns { user, posts, projects, followerCount, ... }
    const u = (rawObj.user as Record<string, unknown> | undefined) ?? rawObj;
    const roleFromPublic = (u as any)?.admin === true ? ('ROLE_ADMIN' as const) : undefined;

    const parseJsonArray = <T,>(value: unknown): T[] | undefined => {
      if (value == null) return undefined;
      if (Array.isArray(value)) return value as T[];
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? (parsed as T[]) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const parseJsonObject = <T extends object>(value: unknown): T | undefined => {
      if (value == null) return undefined;
      if (typeof value === 'object') return value as T;
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return parsed && typeof parsed === 'object' ? (parsed as T) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const experience =
      parseJsonArray<Experience>(rawObj?.experience ?? u?.experience ?? (u as any)?.experienceJson) ??
      parseJsonArray<Experience>((u as any)?.experienceJson);

    const languages =
      parseJsonArray<Language>(rawObj?.languages ?? u?.languages ?? (u as any)?.languagesJson) ??
      parseJsonArray<Language>((u as any)?.languagesJson);

    const education =
      parseJsonArray<Education>(rawObj?.education ?? u?.education ?? (u as any)?.educationJson) ??
      parseJsonArray<Education>((u as any)?.educationJson);

    const availability =
      parseJsonObject<Availability>(rawObj?.availability) ||
      (u?.availability as Availability | undefined) ||
      parseJsonObject<Availability>((u as any)?.availabilityJson);

    const showEmailOnProfile = Boolean((u as any)?.showEmailOnProfile);
    const showResumeOnProfile = Boolean((u as any)?.showResumeOnProfile);

    return {
      id: Number(u?.id),
      name: String(u?.displayName || u?.name || u?.username || ''),
      email: showEmailOnProfile ? String((u as any)?.email || '') : '',
      role: (((u as any)?.role as any) || roleFromPublic) || undefined,
      username: (u?.username as string | undefined) || undefined,
      avatar:
        (u?.profileImageUrl as string | undefined) ||
        (u?.avatar as string | undefined) ||
        undefined,
      bannerImage: (u?.bannerImageUrl as string | undefined) || (u?.bannerImage as string | undefined) || undefined,
      resumeUrl: showResumeOnProfile ? ((u as any)?.resumeUrl as string | undefined) : undefined,
      location: (u?.location as string | undefined) || undefined,
      website: (u?.website as string | undefined) || undefined,
      github: (u?.github as string | undefined) || undefined,
      linkedin: (u?.linkedin as string | undefined) || undefined,
      twitter: (u?.twitter as string | undefined) || undefined,
      followersCount:
        (rawObj?.followersCount as number | undefined) ??
        (rawObj?.followerCount as number | undefined) ??
        (u?.followersCount as number | undefined),
      followingCount: (rawObj?.followingCount as number | undefined) ?? (u?.followingCount as number | undefined),
      bio: (u?.bio as string | undefined) || undefined,
      showEmailOnProfile,
      showResumeOnProfile,
      isFollowing: (rawObj?.isFollowing as boolean | undefined) ?? undefined,
      canMessage: (rawObj?.canMessage as boolean | undefined) ?? undefined,
      skills: (rawObj?.skills ?? u?.skills ?? []) as string[],
      projects: (rawObj?.projects ?? u?.projects ?? []) as Project[],
      experience,
      languages,
      education,
      availability,
    } as UserProfile;
  },

  getByUsername: async (username: string) => {
    const raw = await apiClient<unknown>(`/profile/u/${encodeURIComponent(username)}`);
    const rawObj = (raw ?? {}) as Record<string, unknown>;

    // /profile/u/{username} returns { user, posts, projects, followerCount, ... }
    const u = (rawObj.user as Record<string, unknown> | undefined) ?? rawObj;
    const roleFromPublic = (u as any)?.admin === true ? ('ROLE_ADMIN' as const) : undefined;

    const parseJsonArray = <T,>(value: unknown): T[] | undefined => {
      if (value == null) return undefined;
      if (Array.isArray(value)) return value as T[];
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? (parsed as T[]) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const parseJsonObject = <T extends object>(value: unknown): T | undefined => {
      if (value == null) return undefined;
      if (typeof value === 'object') return value as T;
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return parsed && typeof parsed === 'object' ? (parsed as T) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const experience =
      parseJsonArray<Experience>(rawObj?.experience ?? u?.experience ?? (u as any)?.experienceJson) ??
      parseJsonArray<Experience>((u as any)?.experienceJson);

    const languages =
      parseJsonArray<Language>(rawObj?.languages ?? u?.languages ?? (u as any)?.languagesJson) ??
      parseJsonArray<Language>((u as any)?.languagesJson);

    const education =
      parseJsonArray<Education>(rawObj?.education ?? u?.education ?? (u as any)?.educationJson) ??
      parseJsonArray<Education>((u as any)?.educationJson);

    const availability =
      parseJsonObject<Availability>(rawObj?.availability) ||
      (u?.availability as Availability | undefined) ||
      parseJsonObject<Availability>((u as any)?.availabilityJson);

    const showEmailOnProfile = Boolean((u as any)?.showEmailOnProfile);
    const showResumeOnProfile = Boolean((u as any)?.showResumeOnProfile);

    return {
      id: Number(u?.id),
      name: String(u?.displayName || u?.name || u?.username || ''),
      email: showEmailOnProfile ? String((u as any)?.email || '') : '',
      role: (((u as any)?.role as any) || roleFromPublic) || undefined,
      username: (u?.username as string | undefined) || undefined,
      avatar: (u?.profileImageUrl as string | undefined) || (u?.avatar as string | undefined) || undefined,
      bannerImage: (u?.bannerImageUrl as string | undefined) || (u?.bannerImage as string | undefined) || undefined,
      resumeUrl: showResumeOnProfile ? ((u as any)?.resumeUrl as string | undefined) : undefined,
      location: (u?.location as string | undefined) || undefined,
      website: (u?.website as string | undefined) || undefined,
      github: (u?.github as string | undefined) || undefined,
      linkedin: (u?.linkedin as string | undefined) || undefined,
      twitter: (u?.twitter as string | undefined) || undefined,
      followersCount:
        (rawObj?.followersCount as number | undefined) ??
        (rawObj?.followerCount as number | undefined) ??
        (u?.followersCount as number | undefined),
      followingCount: (rawObj?.followingCount as number | undefined) ?? (u?.followingCount as number | undefined),
      bio: (u?.bio as string | undefined) || undefined,
      showEmailOnProfile,
      showResumeOnProfile,
      isFollowing: (rawObj?.isFollowing as boolean | undefined) ?? undefined,
      canMessage: (rawObj?.canMessage as boolean | undefined) ?? undefined,
      skills: (rawObj?.skills ?? u?.skills ?? []) as string[],
      projects: (rawObj?.projects ?? u?.projects ?? []) as Project[],
      experience,
      languages,
      education,
      availability,
    } as UserProfile;
  },
  uploadResume: async (file: File) => {
    const form = new FormData();
    form.append('resumeFile', file);
    return apiClient<{ message: string }>('/profile/resume', { method: 'POST', body: form });
  },
  deleteResume: async () => {
    return apiClient<{ message: string }>('/profile/resume', { method: 'DELETE' });
  },
  update: async (data: {
    username?: string;
    name?: string;
    bio?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    profileImageFile?: File | null;
    removeProfileImage?: boolean;
    bannerImageFile?: File | null;
    removeBannerImage?: boolean;
    location?: string;
    twitter?: string;
    resumeUrl?: string;
    skills?: string[];
    projects?: Project[];
    experience?: Experience[];
    languages?: Language[];
    education?: Education[];
    availability?: Availability;
    showEmailOnProfile?: boolean;
    showResumeOnProfile?: boolean;
  }) => {
    const form = new FormData();

    if (data.username != null) form.append('username', data.username);
    if (data.name != null) form.append('displayName', data.name);
    if (data.bio != null) form.append('bio', data.bio);
    if (data.linkedin != null) form.append('linkedin', data.linkedin);
    if (data.github != null) form.append('github', data.github);
    if (data.website != null) form.append('website', data.website);

    if (data.location != null) form.append('location', data.location);
    if (data.twitter != null) form.append('twitter', data.twitter);

    if (data.skills != null) form.append('skillsJson', JSON.stringify(data.skills));
    if (data.projects != null) form.append('projectsJson', JSON.stringify(data.projects));
    if (data.experience != null) form.append('experienceJson', JSON.stringify(data.experience));
    if (data.languages != null) form.append('languagesJson', JSON.stringify(data.languages));
    if (data.education != null) form.append('educationJson', JSON.stringify(data.education));
    if (data.availability != null) form.append('availabilityJson', JSON.stringify(data.availability));

    if (data.showEmailOnProfile != null) form.append('showEmailOnProfile', String(Boolean(data.showEmailOnProfile)));
    if (data.showResumeOnProfile != null) form.append('showResumeOnProfile', String(Boolean(data.showResumeOnProfile)));

    form.append('removeProfileImage', String(Boolean(data.removeProfileImage)));
    form.append('removeBannerImage', String(Boolean(data.removeBannerImage)));

    if (data.profileImageFile) form.append('profileImageFile', data.profileImageFile);
    if (data.bannerImageFile) form.append('bannerImageFile', data.bannerImageFile);

    // Backend returns { message, user }
    const resp = await apiClient<unknown>('/profile', { method: 'PUT', body: form });
    const respObj = (resp ?? {}) as Record<string, unknown>;
    const u = (respObj.user as Record<string, unknown> | undefined) ?? (respObj as Record<string, unknown>);

    const parseJsonArray = <T,>(value: unknown): T[] | undefined => {
      if (value == null) return undefined;
      if (Array.isArray(value)) return value as T[];
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? (parsed as T[]) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const parseJsonObject = <T extends object>(value: unknown): T | undefined => {
      if (value == null) return undefined;
      if (typeof value === 'object') return value as T;
      if (typeof value === 'string' && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          return (parsed && typeof parsed === 'object') ? (parsed as T) : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const experience = parseJsonArray<Experience>((u as any)?.experienceJson) ?? data.experience;
    const languages = parseJsonArray<Language>((u as any)?.languagesJson) ?? data.languages;
    const education = parseJsonArray<Education>((u as any)?.educationJson) ?? data.education;
    const availability = parseJsonObject<Availability>((u as any)?.availabilityJson) ?? data.availability;

    const showEmailOnProfile = Boolean((u as any)?.showEmailOnProfile);
    const showResumeOnProfile = Boolean((u as any)?.showResumeOnProfile);

    // Map backend user DTO to UI UserProfile shape.
    return {
      id: Number(u?.id ?? 0),
      name: String(u?.displayName || u?.name || u?.username || data.name || ''),
      email: String(u?.email || ''),
      username: (u?.username as string | undefined) ?? data.username,
      avatar: (u?.profileImageUrl as string | undefined) || undefined,
      bannerImage: (u?.bannerImageUrl as string | undefined) || undefined,
      bio: (u?.bio as string | undefined) || data.bio,
      website: (u?.website as string | undefined) || data.website,
      github: (u?.github as string | undefined) || data.github,
      linkedin: (u?.linkedin as string | undefined) || data.linkedin,
      twitter: (u?.twitter as string | undefined) ?? data.twitter,
      location: (u?.location as string | undefined) || data.location,
      resumeUrl: (u?.resumeUrl as string | undefined) || data.resumeUrl,
      followersCount: undefined,
      followingCount: undefined,
      skills: (data.skills ?? []) as string[],
      projects: (data.projects ?? []) as Project[],
      experience,
      languages,
      education,
      availability,
      showEmailOnProfile,
      showResumeOnProfile,
    } as UserProfile;
  },
};

// --- Users / Follow ---

export const usersApi = {
  search: async (keyword: string) => {
    const resp = await apiClient<{ users: any[]; keyword: string }>(
      `/users/search?keyword=${encodeURIComponent(keyword)}`,
    );

    const users = (resp.users || []).map((u: any) => ({
      ...u,
      avatar: (u?.profileImageUrl as string | undefined) || (u?.avatar as string | undefined) || undefined,
    })) as User[];

    return { ...resp, users } as { users: User[]; keyword: string };
  },
};

export const followApi = {
  follow: (userId: number) => apiClient<string>(`/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId: number) => apiClient<string>(`/users/${userId}/unfollow`, { method: 'POST' }),
};

// ---- Chat ---

export type ChatRoomSummary = {
  id: number;
  otherUserId: number;
  otherUserUsername?: string;
  otherUserDisplayName: string;
  otherUserProfileImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
};

export type ChatMessage = {
  roomId: number;
  senderUsername: string;
  senderDisplayName: string;
  content: string;
  timestamp: string;
};

export type ChatMessagesPage = {
  messages: ChatMessage[];
  hasMore?: boolean;
};

export type ChatTargetUser = {
  id: number;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
};

export type OpenChatResponse = {
  canMessage: boolean;
  reason?: 'FOLLOW_REQUIRED' | 'FOLLOW_BACK_REQUIRED' | string;
  message?: string;
  chatRoom?: { id: number };
  targetUser: ChatTargetUser;
  currentUser?: any;
  messages?: ChatMessage[];
};

export const chatApi = {
  list: () => apiClient<{ chatRooms: ChatRoomSummary[]; currentUser: any }>(`/chats`),

  /**
   * Opens a chat thread with a given user.
   * Backend may respond with 403 for locked messaging along with a JSON body.
   */
  openWith: async (userId: number): Promise<OpenChatResponse> => {
    try {
      return await apiClient<OpenChatResponse>(`/chats/with/${userId}`);
    } catch (e) {
      // Special-case locked messaging: backend returns 403 with a useful JSON body.
      if (e instanceof ApiError && e.status === 403) {
        // Re-try without throwing so UI can show the locked state.
        // Use fetch directly to preserve the response body.
        const res = await fetch(`${API_BASE_URL}/chats/with/${userId}`, { credentials: 'include' });
        const data = (await res.json().catch(() => ({}))) as OpenChatResponse;
        return {
          ...data,
          canMessage: Boolean((data as any)?.canMessage),
        };
      }
      throw e;
    }
  },

  /**
   * Infinite scroll page (newest-first from backend).
   */
  listMessages: (roomId: number, opts: { size?: number; before?: string } = {}) => {
    const q = new URLSearchParams();
    if (opts.size != null) q.set('size', String(opts.size));
    if (opts.before) q.set('before', opts.before);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiClient<ChatMessagesPage>(`/chats/${roomId}/messages${suffix}`);
  },

  /**
   * Persisted send fallback (REST). Use when WS is unavailable.
   */
  send: (roomId: number, content: string) =>
    apiClient<ChatMessage>(`/chats/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  /**
   * Fallback refresh: re-open the thread to get updated messages.
   */
  refreshThread: (userId: number) => chatApi.openWith(userId),
};

// Admin: user management
export const adminUsersApi = {
  list: (params: { keyword?: string; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.page != null) q.set('page', String(params.page));
    if (params.size != null) q.set('size', String(params.size));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return apiClient<any>(`/admin/users${suffix}`);
  },

  userPosts: (userId: number) => apiClient<any>(`/admin/users/${userId}/posts`),

  ban: (userId: number) => apiClient<any>(`/admin/users/${userId}/ban`, { method: 'POST' }),
  unban: (userId: number) => apiClient<any>(`/admin/users/${userId}/unban`, { method: 'POST' }),
};

export const adminStatsApi = {
  postStats: () => apiClient<{ totalUsers: number; activeUsers: number; totalComments: number; totalLikes: number }>(`/admin/post-stats`),
};

// ---- Types used by the UI ----

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: 'ROLE_USER' | 'ROLE_AUTHOR' | 'ROLE_ADMIN';
  username?: string;
  bio?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  twitter?: string;
}

export interface Reply {
  id: number;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes?: number;
  likedByMe?: boolean;
}

export type Comment = {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  replies?: Reply[];
  likes?: number;
  likedByMe?: boolean;
}

export interface Post {
  id: number;
  author: {
    id: number;
    name: string;
    avatar?: string;
    role?: 'ROLE_USER' | 'ROLE_AUTHOR' | 'ROLE_ADMIN';
  };
  title?: string;
  content: string;
  imageUrls?: string[];
  videoUrl?: string;
  likes: number;
  /** Total view count for this post. */
  views?: number;
  likedByMe?: boolean;
  createdAt: string;
  updatedAt?: string;
  /** Present on feed items; avoids having to load the full comments array. */
  commentCount?: number;
  comments?: Comment[];
}

export interface Project {
  id?: number;
  title: string;
  // Backward-compat: older UI used `description`, newer profile UI uses richer fields.
  description?: string;
  link?: string;

  summary?: string;
  status?: 'Building' | 'Shipped' | string;
  problem?: string;
  built?: string;
  role?: string;
  techStack?: string[];
  proofLinks?: {
    github?: string;
    demo?: string;
    video?: string;
    screenshots?: string[];
  };
}

export type ProjectProofLinkKey = keyof NonNullable<Project['proofLinks']>;

export interface Language {
  id?: number;
  language: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native' | string;
}

export interface Education {
  id?: number;
  school: string;
  degree: string;
  field?: string;
  startYear: string;
  endYear?: string;
  cgpa?: string;
}

export interface Experience {
  id?: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Availability {
  openToCollaboration?: boolean;
  openToInternships?: boolean;
  openToFreelance?: boolean;
  justBuilding?: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: 'ROLE_USER' | 'ROLE_AUTHOR' | 'ROLE_ADMIN';

  // Newer profile fields
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  bannerImage?: string;
  resumeUrl?: string;
  followersCount?: number;
  followingCount?: number;

  // Public visibility preferences (used for shareable profile pages)
  showEmailOnProfile?: boolean;
  showResumeOnProfile?: boolean;

  // Relationship flags for viewing someone else's profile
  isFollowing?: boolean;
  canMessage?: boolean;

  skills: string[];
  projects: Project[];
  experience?: Experience[];
  languages?: Language[];
  education?: Education[];
  availability?: Availability;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  visible?: boolean;
  videoUrl?: string;
  imageUrls?: string[];
  createdAt?: string;
}
