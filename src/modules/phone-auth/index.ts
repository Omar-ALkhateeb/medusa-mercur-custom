import { ModuleProvider, Modules } from '@medusajs/framework/utils'

import PhoneAuthService from './service'

export default ModuleProvider(Modules.AUTH, {
  services: [PhoneAuthService]
})
