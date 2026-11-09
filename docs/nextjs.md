# Next.js guide for this project

This file is the local stand-in for indexing <https://nextjs.org/docs>. Read it before creating or changing the frontend. When a Next.js API detail is not covered here, open the matching page on <https://nextjs.org/docs> and follow that page.

## What this app is

The frontend is a chat page for the FastAPI backend in `api/index.py`. The model and the OpenAI key stay on the server. The browser only sends the user's message and shows the reply.

Put the Next.js app in `frontend/`. Leave `api/index.py` where it is. A Next.js app at the repository root would collide with that Python API.

Use the App Router (`frontend/app`), which current `create-next-app` generates by default. A page is a Server Component unless the file starts with `"use client"`. The chat box needs click and typing handlers, so the form lives in a Client Component. The page can stay a Server Component and render that form.

## Talking to the backend

`POST /api/chat` expects JSON and returns JSON:

```json
{ "message": "I keep putting this off" }
```

```json
{ "reply": "..." }
```

`GET /` on the backend returns `{ "status": "ok" }`. Use that to check that the API process is up.

Locally, run the API and the site as two processes:

```bash
uv run uvicorn api.index:app --reload
```

```bash
cd frontend && npm run dev
```

The API listens on port 8000. Next.js listens on port 3000. From the browser, call `http://127.0.0.1:8000/api/chat`. Read that base URL from `NEXT_PUBLIC_API_URL` in `frontend/.env.local`, and default it to `http://127.0.0.1:8000` so the page still works if the file is missing.

```tsx
"use client";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export function ChatForm() {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = new FormData(event.currentTarget).get("message");
    const response = await fetch(`${apiBase}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail ?? "Request failed");
    }
    return data.reply as string;
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
```

On Vercel, `docs/vercel.md` routes `/api/*` to FastAPI on the same domain. For that deployment, call `/api/chat` with no host, so the page you opened is the page that receives the request. Keep `NEXT_PUBLIC_API_URL` unset in production when that rewrite is in place. An empty string is a same-origin request: `` `${apiBase}/api/chat` `` becomes `/api/chat`.

Show the backend error `detail` when the response is not ok. The API uses HTTP 500 with `{ "detail": "..." }` when the key is missing or OpenAI fails.

## Secrets and data

`OPENAI_API_KEY` belongs to the Python process. Do not prefix it with `NEXT_PUBLIC_`, do not import it into a Client Component, and do not put it in the page. Anything with the `NEXT_PUBLIC_` prefix is shipped to the browser.

Do not add a second chat implementation inside `frontend/app/api`. That path is for Next.js Route Handlers and would shadow or duplicate `POST /api/chat`.

## After you generate the app

Write the install and run commands into `frontend/README.md`. From `frontend/`, that is `npm install` once, then `npm run dev`. Say that the API must already be running on port 8000.
