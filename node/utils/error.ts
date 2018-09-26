export const errorResponse = (err) => {
  const {code, message, stack} = err
  return {
    code,
    message,
    stack,
    url: err.response ? err.response.config.url : null,
    method: err.response ? err.response.config.method : null,
    data: err.response ? err.response.data : null,
  }
}
