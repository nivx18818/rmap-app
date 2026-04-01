interface RoadmapDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RoadmapDetailPage({ params }: RoadmapDetailPageProps) {
  const { id } = await params;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Roadmap Detail</h1>
      <p className="mt-4">Roadmap ID: {id}</p>
    </main>
  );
}
