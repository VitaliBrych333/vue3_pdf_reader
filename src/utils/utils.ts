export function getId() {
  return Math.ceil(Math.random() * 100000000).toString()
}

export function getDocName(name: string) {
  return name?.match(/([^\/]+)(?=\.\w+$)/)?.[0]
}

// export function getDocName() {
//   return (name: string) => name.match(/([^\/]+)(?=\.\w+$)/)?.[0];
// }
