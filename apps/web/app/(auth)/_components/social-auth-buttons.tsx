import { Button } from '@repo/design-system/components/ui/button';

import { GoogleIcon } from '@/components/shared/oauth-icon';
import { buildOAuthLoginUrl } from '@/utils/auth-callback';

function GithubIcon() {
  return (
    <svg className="size-5 shrink-0" fill="currentColor" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.833 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222v3.293c0 .32.192.694.801.576C20.566 21.797 24 16.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function SocialAuthButtons() {
  const handleOAuthLogin = (provider: 'github' | 'google') => {
    window.location.href = buildOAuthLoginUrl(provider);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-sm">or continue with</span>
        <div className="bg-border h-px flex-1" />
      </div>

      {/* Social Buttons */}
      <div className="flex flex-col gap-4">
        <Button
          size="lg"
          variant="outline"
          className="w-full gap-2"
          type="button"
          onClick={() => handleOAuthLogin('google')}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full gap-2"
          type="button"
          onClick={() => handleOAuthLogin('github')}
        >
          <GithubIcon />
          Continue with GitHub
        </Button>
      </div>
    </div>
  );
}
