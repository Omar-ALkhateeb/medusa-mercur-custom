import jwt from 'jsonwebtoken'

import {
  AbstractAuthModuleProvider,
  AbstractEventBusModuleService,
  MedusaError
} from '@medusajs/framework/utils'
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
  Logger
} from '@medusajs/types'

type InjectedDependencies = {
  logger: Logger
  event_bus: AbstractEventBusModuleService
}

type Options = {
  jwtSecret: string
}

class PhoneAuthService extends AbstractAuthModuleProvider {
  static DISPLAY_NAME = 'Phone Auth'
  static identifier = 'phone-auth'
  private options: Options
  private logger: Logger
  private event_bus: AbstractEventBusModuleService

  constructor(container: InjectedDependencies, options: Options) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    super(...arguments)

    this.options = options
    this.logger = container.logger
    this.event_bus = container.event_bus
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validateOptions(options: Record<any, any>): void | never {
    if (!options.jwtSecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'JWT secret is required'
      )
    }
  }

  async register(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { phone } = data.body || {}

    if (!phone) {
      return {
        success: false,
        error: 'Phone number is required'
      }
    }

    try {
      await authIdentityProviderService.retrieve({
        entity_id: phone
      })

      return {
        success: false,
        error: 'User with phone number already exists'
      }
    } catch (error) {
      console.log(error)
      const user = await authIdentityProviderService.create({
        entity_id: phone
      })

      return {
        success: true,
        authIdentity: user
      }
    }
  }

  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { phone } = data.body || {}

    if (!phone) {
      return {
        success: false,
        error: 'Phone number is required'
      }
    }

    try {
      await authIdentityProviderService.retrieve({
        entity_id: phone
      })
    } catch (error) {
      console.log(error)

      return {
        success: false,
        error: 'User with phone number does not exist'
      }
    }

    const { hashedOTP, otp } = await this.generateOTP()

    await authIdentityProviderService.update(phone, {
      provider_metadata: {
        otp: hashedOTP
      }
    })

    await this.event_bus.emit(
      {
        name: 'phone-auth.otp.generated',
        data: {
          otp,
          phone
        }
      },
      {}
    )

    return {
      success: true,
      location: 'otp'
    }
  }

  async generateOTP(): Promise<{ hashedOTP: string; otp: string }> {
    // Generate a 6-digit OTP
    // const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otp = '123456'

    // for debug
    this.logger.info(`Generated OTP: ${otp}`)

    const hashedOTP = jwt.sign({ otp }, this.options.jwtSecret, {
      expiresIn: '60m'
    })

    return { hashedOTP, otp }
  }

  async validateCallback(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const { phone, otp } = data.query || {}

    if (!phone || !otp) {
      return {
        success: false,
        error: 'Phone number and OTP are required'
      }
    }

    const user = await authIdentityProviderService.retrieve({
      entity_id: phone
    })

    if (!user) {
      return {
        success: false,
        error: 'User with phone number does not exist'
      }
    }

    // verify that OTP is correct
    const userProvider = user.provider_identities?.find(
      (provider) => provider.provider === this.identifier
    )
    if (!userProvider || !userProvider.provider_metadata?.otp) {
      return {
        success: false,
        error: 'User with phone number does not have a phone auth provider'
      }
    }

    try {
      const decodedOTP = jwt.verify(
        userProvider.provider_metadata.otp as string,
        this.options.jwtSecret
      ) as { otp: string }

      if (decodedOTP.otp !== otp) {
        throw new Error('Invalid OTP')
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Invalid OTP'
      }
    }

    const updatedUser = await authIdentityProviderService.update(phone, {
      provider_metadata: {
        otp: null
      }
    })

    return {
      success: true,
      authIdentity: updatedUser
    }
  }
}

export default PhoneAuthService
