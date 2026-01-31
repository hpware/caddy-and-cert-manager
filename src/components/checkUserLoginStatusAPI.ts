import { auth } from "./auth";

export default async function checkUserLoginStatus(userHeaders: Headers) {
  const checkUserLoginStatus = await auth.api.getSession({
    headers: userHeaders,
  });
  if (checkUserLoginStatus !== null) {
    return {
      loggedIn: true,
      user: checkUserLoginStatus.user,
      email: checkUserLoginStatus.user.email,
      id: checkUserLoginStatus.user.id,
      name: checkUserLoginStatus.user.name,
    };
  }
  return {
    loggedIn: false,
    user: null,
    email: null,
    id: null,
    name: null,
  };
}
