import { Bricolage_Grotesque } from 'next/font/google';
import localFont from 'next/font/local';

import { cn } from './utils';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-bricolage',
  display: 'swap',
});

const mackinac = localFont({
  src: [
    {
      path: '../fonts/P22MackinacPro-Book_25.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/P22MackinacPro-BookItalic_15.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/P22MackinacPro-Medium_26.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/P22MackinacPro-MedItalic_18.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../fonts/P22MackinacPro-Bold_16.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/P22MackinacPro-BoldItalic_11.otf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../fonts/P22MackinacPro-ExtraBold_12.otf',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../fonts/P22MackinacPro-ExBoldItalic_17.otf',
      weight: '800',
      style: 'italic',
    },
  ],
  variable: '--font-mackinac',
  display: 'swap',
});

export const fonts = cn(
  bricolage.variable,
  mackinac.variable,
  'touch-manipulation font-sans antialiased',
);
