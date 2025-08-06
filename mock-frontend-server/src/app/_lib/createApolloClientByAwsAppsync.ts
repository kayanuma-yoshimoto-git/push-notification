import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { createAuthLink } from 'aws-appsync-auth-link';
import { createSubscriptionHandshakeLink } from 'aws-appsync-subscription-link';

const url = 'https://xxxxxxxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql';

// AuthLinkを作成する関数
const createAuthLinkWithToken = (token: string) => {
  return createAuthLink({
    url,
    region: 'ap-northeast-1',
    auth: {
      type: 'AWS_LAMBDA',
      token,
    },
  });
};

// SubscriptionLinkを作成する関数
const createSubscriptionLinkWithToken = (token: string) => {
  return createSubscriptionHandshakeLink(
    {
      url,
      region: 'ap-northeast-1',
      auth: {
        type: 'AWS_LAMBDA',
        token,
      },
    },
    createHttpLink({ uri: url })
  );
};

// ApolloClientを作成する関数
export const createApolloClient = (token: string) => {
  const authLink = createAuthLinkWithToken(token);
  const subscriptionLink = createSubscriptionLinkWithToken(token);

  const link = authLink.concat(subscriptionLink)

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
};