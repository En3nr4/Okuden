// API and struct names ARE the URL slugs. Validation happens at the schema
// layer (regex enforces URL-safe characters).
export function apiPath(name: string): string {
  return `/api/${name}/`;
}
export function structPath(name: string): string {
  return `/struct/${name}/`;
}
export function dllPath(dll: string): string {
  return `/${dll}/`;
}
export function categoryPath(dll: string, category: string): string {
  return `/${dll}/${category}/`;
}
