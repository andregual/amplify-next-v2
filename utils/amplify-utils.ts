import { Schema } from '@/amplify/data/resource';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import outputs from '@/amplify_outputs.json';
import { cookies } from 'next/headers';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

// Create a server client that uses cookies for auth
export const cookieBasedClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});
