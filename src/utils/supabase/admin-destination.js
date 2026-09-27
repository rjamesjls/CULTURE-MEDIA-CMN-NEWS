// Only known admin destinations can be used after signing in.
export function adminDestination(value) {
  return value === '/admin/webradio' ? '/admin/webradio' : '/admin';
}
