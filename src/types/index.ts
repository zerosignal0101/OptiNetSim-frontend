export interface UserModule {
  install: (ctx: { router: any, isClient: boolean, app: any }) => void | Promise<void>
}
