import { Footer } from '@/components/layouts/footer';
import { Header } from '@/components/layouts/header';

export default function Home(props: LayoutProps<'/'>) {
  return (
    <div className="bg-background relative flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      {props.children}
      <Footer />
    </div>
  );
}
