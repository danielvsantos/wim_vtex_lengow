export const notFound = (fallback = {}) => (error) => {
  if (error.response && error.response.status === 404) {
    return fallback
  }
  throw error
}
