import {
  Authenticator,
  Flex,
  Loader,
  useAuthenticator,
} from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthContent() {
  const router = useRouter();
  const { route, user } = useAuthenticator((context) => [
    context.route,
    context.user,
  ]);

  useEffect(() => {
    if (route === 'authenticated' && user) {
      router.push('/reservations');
    }
  }, [route, user, router]);

  if (route === 'authenticated') {
    return (
      <Flex
        height={'100dvh'}
        padding='large'
        justifyContent='center'
        alignItems='center'
      >
        <Loader size='large' />
      </Flex>
    );
  }

  return (
    <Flex
      height={'100dvh'}
      padding='large'
      justifyContent='center'
      alignItems='center'
    >
      <Authenticator variation='modal' />
    </Flex>
  );
}
