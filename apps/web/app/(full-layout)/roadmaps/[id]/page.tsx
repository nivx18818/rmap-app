export default async function RoadmapDetailPage(props: PageProps<'/roadmaps/[id]'>) {
  const { id } = await props.params;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Roadmap Detail</h1>
      <p className="mt-4">Roadmap ID: {id}</p>
    </main>
  );
}
