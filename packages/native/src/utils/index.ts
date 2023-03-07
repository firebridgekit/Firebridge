const errorCodeMessages: { [key: string]: any } = {
  'auth/invalid-email': {
    email: 'Sorry, that email is invalid.',
  },
  'auth/user-disabled': {
    email: 'Sorry, that account is disabled.',
  },
  'auth/user-not-found': {
    email: "There isn't a user with that email.",
  },
  'auth/wrong-password': {
    password: "You've entered an incorrect password.",
  },
  'auth/email-already-in-use': {
    email: 'There is already an account with this email.',
  },
  unknown: {
    email: 'Sorry, something went wrong.',
  },
}

export const formErrorsForCode = (code: string) =>
  errorCodeMessages[code] || errorCodeMessages.unknown
