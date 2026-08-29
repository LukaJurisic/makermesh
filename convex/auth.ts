import {ConvexCredentials} from '@convex-dev/auth/providers/ConvexCredentials';
import {convexAuth, createAccount, retrieveAccount} from '@convex-dev/auth/server';
import type {Id} from './_generated/dataModel';
import {internal} from './_generated/api';
import {env} from './_generated/server';
import {verifyOperatorCode} from './model/operatorVerifier';

const PROVIDER_ID = 'operator-code';
const OPERATOR_ACCOUNT_ID = 'primary-operator';

export const {auth, signIn, signOut, store, isAuthenticated} = convexAuth({
  providers: [
    ConvexCredentials({
      id: PROVIDER_ID,
      authorize: async (credentials, ctx) => {
        const code = credentials.code;
        if (typeof code !== 'string' || code.length < 12 || code.length > 256) return null;

        const loginAllowed: boolean = await ctx.runMutation(
          internal.operatorAuth.consumeLoginAttempt,
          {},
        );
        if (!loginAllowed) return null;

        const encodedVerifier = env.OPERATOR_ACCESS_HASH;
        if (!encodedVerifier) throw new Error('Operator access is not configured.');
        if (!(await verifyOperatorCode(code, encodedVerifier))) return null;

        try {
          const {user} = await retrieveAccount(ctx, {
            provider: PROVIDER_ID,
            account: {id: OPERATOR_ACCOUNT_ID},
          });
          return {userId: user._id};
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'InvalidAccountId') throw error;
          const {user} = await createAccount(ctx, {
            provider: PROVIDER_ID,
            account: {id: OPERATOR_ACCOUNT_ID},
            profile: {name: 'MakerMesh operator'},
          });
          return {userId: user._id};
        }
      },
    }),
  ],
  session: {
    totalDurationMs: 30 * 60 * 1000,
    inactiveDurationMs: 15 * 60 * 1000,
  },
  jwt: {
    durationMs: 5 * 60 * 1000,
  },
  signIn: {
    maxFailedAttempsPerHour: 5,
  },
  callbacks: {
    beforeSessionCreation: async (ctx, {userId}) => {
      const profileId: Id<'operatorProfiles'> = await ctx.runMutation(
        internal.operatorAuth.ensureProfile,
        {authUserId: userId},
      );
      if (!profileId) throw new Error('Operator profile could not be established.');
    },
  },
});
