export const runEnvironments = ['dev', 'prod'] as const;
export const services = ['events'] as const;
export type RunEnvironment = (typeof runEnvironments)[number];
export type ValidServices = (typeof services)[number];
export type ValidService = ValidServices;

export type ConfigType = {
  AadValidClientId: string;
  ServiceConfiguration: Record<ValidServices, ServiceConfiguration>;
};

export type ServiceConfiguration = {
  friendlyName: string;
  baseEndpoint: string;
  authCheckRoute?: string;
  loginScope?: string;
  apiId?: string;
};

// type GenericConfigType = {};

type EnvironmentConfigType = {
  [env in RunEnvironment]: ConfigType;
};

const environmentConfig: EnvironmentConfigType = {
  dev: {
    AadValidClientId: 'd1978c23-6455-426a-be4d-528b2d2e4026',
    ServiceConfiguration: {
      events: {
        friendlyName: 'Events Management API (NonProd)',
        baseEndpoint: 'https://infra-events-api.aws.qa.acmuiuc.org',
        authCheckRoute: '/api/v1/protected',
        loginScope: 'api://39c28870-94e4-47ee-b4fb-affe0bf96c9f/ACM.Events.Login',
        apiId: 'api://39c28870-94e4-47ee-b4fb-affe0bf96c9f',
      },
    },
  },
  prod: {
    AadValidClientId: '43fee67e-e383-4071-9233-ef33110e9386',
    ServiceConfiguration: {
      events: {
        friendlyName: 'Events Management API',
        baseEndpoint: 'https://infra-events-api.aws.acmuiuc.org',
        authCheckRoute: '/api/v1/protected',
        loginScope: 'api://5e08cf0f-53bb-4e09-9df2-e9bdc3467296/ACM.Events.Login',
        apiId: 'api://5e08cf0f-53bb-4e09-9df2-e9bdc3467296',
      },
    },
  },
} as const;

const getRunEnvironmentConfig = () => environmentConfig[(import.meta.env.VITE_RUN_ENVIRONMENT || 'dev') as RunEnvironment];

export { getRunEnvironmentConfig };
