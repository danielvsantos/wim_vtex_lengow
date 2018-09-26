export function getUserAgent(): string {
  return `VTEX Avalara ` + process.env.VTEX_APP_VERSION
}

export function getUseSandbox(productionMode): boolean {
  return productionMode == 'NO'
}
