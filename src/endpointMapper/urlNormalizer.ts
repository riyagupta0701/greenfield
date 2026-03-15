export function normalizeUrl(path: string): string {

  let p = path

  // template literal parameters
  p = p.replace(/\$\{[^}]+\}/g, ":param")

  // express style
  p = p.replace(/:[A-Za-z_][A-Za-z0-9_]*/g, ":param")

  // flask style
  p = p.replace(/<[^>]+>/g, ":param")

  // spring style
  p = p.replace(/\{[^}]+\}/g, ":param")

  return p
}
