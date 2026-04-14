import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | RMap',
  description: 'Sign up for RMap to start mapping your developer skills and master any technology.',
};

export default function SignUpLayout(props: LayoutProps<'/sign-up'>) {
  return props.children;
}
