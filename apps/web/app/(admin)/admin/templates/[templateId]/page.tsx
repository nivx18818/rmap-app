import { AdminTemplateNodesPageContent } from '../_components/admin-template-nodes-page-content';

export default async function AdminTemplateNodesPage(
  props: PageProps<'/admin/templates/[templateId]'>,
) {
  const { templateId } = await props.params;

  return <AdminTemplateNodesPageContent templateId={templateId} />;
}
