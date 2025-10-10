export const ERRORS = {
  EMAIL_HAS_BEEN_USED: 'This email has already been used',
  CHALLENGE_NOT_FOUND: 'Challenge is not found',
  CHALLENGE_CONSUMED: 'Challenge is already consumed',
  CHALLENGE_EXPIRED: 'Challenge expired',
  CHALLENGE_MISMATCH: 'Wrong challenge type',
  VERIFICATION_FAILED: 'Verification failed',
  WRONG_CREDENTIAL: 'Credential is not registered',
  REQUEST_TIMEOUT:
    'Looks like the server is taking too long to respond, this can be caused by either poor connectivity or an error with our servers. Please try again in a while',
} as const
