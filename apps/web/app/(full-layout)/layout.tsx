import { Footer } from '@/components/layouts/footer';
import { Header } from '@/components/layouts/header';

export default function FullLayout(props: LayoutProps<'/'>) {
  return (
    <div className="bg-background relative min-h-screen overflow-x-hidden">
      <Header />
      {props.children}
      <Footer />
    </div>
  );
}
