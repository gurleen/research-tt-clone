import { UPDATE_PASSWORD_PATH } from "./password.ts";

export function shouldRedirectToUpdatePassword(
  isPasswordRecovery: boolean,
  pathname: string,
): boolean {
  return isPasswordRecovery && pathname !== UPDATE_PASSWORD_PATH;
}
