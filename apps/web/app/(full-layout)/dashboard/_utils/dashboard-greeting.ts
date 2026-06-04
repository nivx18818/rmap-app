import { Moon02Icon, Sun03Icon, SunCloud01Icon, SunsetIcon } from '@hugeicons/core-free-icons';

export function getDashboardGreetingMeta(name: string) {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return {
      icon: Sun03Icon,
      iconClassName: 'text-orange-500',
      text: `Good morning, ${name}`,
    };
  }

  if (currentHour >= 12 && currentHour < 17) {
    return {
      icon: SunCloud01Icon,
      iconClassName: 'text-blue-500',
      text: `Good afternoon, ${name}`,
    };
  }

  if (currentHour >= 17 && currentHour < 21) {
    return {
      icon: SunsetIcon,
      iconClassName: 'text-rose-500',
      text: `Good evening, ${name}`,
    };
  }

  return {
    icon: Moon02Icon,
    iconClassName: 'text-indigo-500',
    text: `Good evening, ${name}`,
  };
}
