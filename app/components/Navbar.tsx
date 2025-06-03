// components/Navbar.tsx
'use client';

import { useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import {
  Button,
  Divider,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  Text,
  View,
} from '@aws-amplify/ui-react';

interface NavbarProps {
  currentUser: any;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (currentUser?.signInDetails?.loginId) {
      return currentUser.signInDetails.loginId.charAt(0).toUpperCase();
    }
    if (currentUser?.username) {
      return currentUser.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    return (
      currentUser?.signInDetails?.loginId || currentUser?.username || 'User'
    );
  };

  return (
    <View as='nav' padding='medium' backgroundColor='#14252D' color='white'>
      <Flex justifyContent='end' alignItems='center'>
        <Menu
          menuAlign='end'
          trigger={
            <Flex
              alignItems='center'
              padding='small'
              style={{ cursor: 'pointer' }}
            >
              <Flex
                width='2rem'
                height='2rem'
                borderRadius='50%'
                alignItems='center'
                backgroundColor='blue.40'
                justifyContent='center'
                fontSize='small'
                fontWeight='semibold'
              >
                {getUserInitials()}
              </Flex>
            </Flex>
          }
        >
          <View padding='small'>
            <Text fontSize='small' fontWeight='medium'>
              {getDisplayName()}
            </Text>
          </View>
          <Divider />
          <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
        </Menu>
      </Flex>
    </View>
  );
}
