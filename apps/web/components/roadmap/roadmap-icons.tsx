import type { RoadmapTheme } from '@/types/roadmap';

export function SaveIcon() {
  return (
    <svg className="size-4" fill="none" aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M6 4.75h9.2l3.05 3.05V19A1.25 1.25 0 0 1 17 20.25H7A1.25 1.25 0 0 1 5.75 19V6A1.25 1.25 0 0 1 7 4.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M9 4.75v4.5h5.5v-4.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 15.25h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg className="size-4" fill="none" aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 4.75v9.5m0 0 3.5-3.5m-3.5 3.5-3.5-3.5M5.75 16.75v1A1.5 1.5 0 0 0 7.25 19.25h9.5a1.5 1.5 0 0 0 1.5-1.5v-1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg className="size-4" fill="none" aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M8.5 12.25 15.5 8m-7 8.25L15.5 20m0-12.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0 14a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5ZM6.5 14.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg className="size-4" fill="none" aria-hidden="true" viewBox="0 0 24 24">
      <circle fill="none" cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.25v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle fill="currentColor" cx="12" cy="7.75" r="1" />
    </svg>
  );
}

export function IntroMapIcon() {
  return (
    <svg className="size-4" fill="none" aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m4.75 6.25 4-1.5 6.5 2.5 4-1.5v12.5l-4 1.5-6.5-2.5-4 1.5V6.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M8.75 4.75v12.5m6.5-10v12.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IntroCheckIcon({ theme, tone }: { theme: RoadmapTheme; tone: 'green' | 'pink' }) {
  return (
    <svg
      className="size-4"
      style={{ color: tone === 'green' ? theme.icon.introCheck.green : theme.icon.introCheck.pink }}
      fill="none"
      aria-hidden="true"
      viewBox="0 0 24 24"
    >
      <path
        d="m5.75 12.5 4.25 4.25 8.25-9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function RoadmapLinkIcon({
  theme,
  tone,
}: {
  theme: RoadmapTheme;
  tone: 'green' | 'purple';
}) {
  return (
    <svg
      style={{
        color: tone === 'green' ? theme.icon.roadmapLink.green : theme.icon.roadmapLink.purple,
        filter: `drop-shadow(${theme.icon.roadmapLink.shadow})`,
        height: theme.icon.roadmapLink.size,
        width: theme.icon.roadmapLink.size,
      }}
      fill="none"
      aria-hidden="true"
      viewBox="0 0 16.765 16.765"
    >
      <circle fill="currentColor" cx="8.3825" cy="8.3825" r="8.3825" />
      <path
        d="m4.92 8.52 2.05 2.05 4.63-5.08"
        stroke={theme.icon.roadmapLink.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.95"
      />
    </svg>
  );
}
