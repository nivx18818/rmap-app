import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';

export default function Home(props: LayoutProps<'/'>) {
  return (
    <div className="bg-background relative min-h-screen overflow-x-hidden">
      <Header />
      {props.children}
      <Footer />
    </div>
  );
}
