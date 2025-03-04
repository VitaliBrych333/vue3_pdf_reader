
export function useRequestInit(method: string, body: object | null = null) {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // "include" | "omit" | "same-origin" - to get in response a cookie with token and set in the browser
  };

  if (body) {
    init['body'] = JSON.stringify(body);
  }

  return init;
}
