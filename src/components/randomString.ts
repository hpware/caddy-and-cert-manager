const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export default function randomString() {
  let slug = "";
  const length = 20;
  for (let times = 0; times < length; times++) {
    slug += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return slug;
}
