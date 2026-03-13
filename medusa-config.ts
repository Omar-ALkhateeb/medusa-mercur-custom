import {
  loadEnv,
  defineConfig,
  Modules,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: {
      ssl: { rejectUnauthorized: false }, // For the main app
      extra: {
        ssl: { rejectUnauthorized: false }, // For the underlying pool
      },
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
      authMethodsPerActor: {
        user: ["emailpass"],
        customer: ["emailpass", "phone-auth"],
      },
    },
  },
  admin: {
    vite: (config) => {
      return {
        ...config,
        server: {
          allowedHosts: [
            ".ondigitalocean.app", // Allows all DO subdomains
            ".kiddo-iq.store",
          ],
        },
      };
    },
  },
  plugins: [
    {
      resolve: "@mercurjs/framework",
      options: {},
    },
    {
      resolve: "@mercurjs/b2c-core",
      options: {},
    },
    {
      resolve: "@mercurjs/commission",
      options: {},
    },
    {
      resolve: "@mercurjs/reviews",
      options: {},
    },
    {
      resolve: "@mercurjs/requests",
      options: {},
    },
  ],
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        redisOptions: {
          tls: { rejectUnauthorized: false },
        },
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
        redisOptions: {
          tls: { rejectUnauthorized: false },
        },
      },
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              s3_url: process.env.S3_URL,
              file_url: process.env.S3_URL,
              bucket: process.env.S3_BUCKET,
              region: process.env.S3_REGION,
              endpoint: process.env.S3_ENDPOINT, // e.g., https://nyc3.digitaloceanspaces.com
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              additional_client_config: {
                forcePathStyle: true, // Often required for DigitalOcean
              },
              // For Medusa v2, ensure the provider is configured for public access
              cache_control: "max-age=31536000",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [
        Modules.CACHE,
        ContainerRegistrationKeys.LOGGER,
        Modules.EVENT_BUS,
      ],
      options: {
        providers: [
          // default provider
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "./src/modules/phone-auth",
            id: "phone-auth",
            options: {
              jwtSecret: process.env.JWT_SECRET || "supersecret",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve:
              "@mercurjs/payment-stripe-connect/providers/stripe-connect",
            id: "stripe-connect",
            options: {
              apiKey: process.env.STRIPE_SECRET_API_KEY,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              channels: ["feed", "seller_feed"],
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/strapi",
      options: {
        apiUrl: process.env.STRAPI_API_URL || "http://localhost:1337/api",
        apiToken: process.env.STRAPI_API_TOKEN || "",
      },
    },
  ],
});
