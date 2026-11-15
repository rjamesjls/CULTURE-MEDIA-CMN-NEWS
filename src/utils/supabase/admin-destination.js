// Only known admin destinations can be used after signing in.
export function adminDestination(value) {
  return ['/admin/webradio','/admin/interviews/video'].includes(value) ? value : '/admin';
}
