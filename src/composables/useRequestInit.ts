
export function useRequestInit(method: string, body: object | null = null, convertToJson = false) {
  // headers: { 'Content-Type': 'application/json' },  //application/x-www-form-urlencoded
  // headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'form-data'},
  // headers: { 'Content-Type': 'multipart/form-data' },
  // headers: { 'Content-Type': 'form-data' },

  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // "include" | "omit" | "same-origin" - to get in response a cookie with token and set in the browser
  };

  if (body) {
    init['body'] = convertToJson
      ? JSON.stringify(body)
      : body as BodyInit
  }

  return init;
}
