import type { RoadmapPageContentData } from '@/types/roadmap';

export const mockRoadmapPageContentBySlug: Record<string, RoadmapPageContentData> = {
  frontend: {
    graph: {
      illustrationAlt: 'Frontend roadmap visual accent',
      illustrationSrc: 'https://www.figma.com/api/mcp/asset/321a7f38-8b35-4b87-b70d-37a26045c973',
      title: 'Front-end',
    },
    hero: {
      allRoadmapsLabel: '← All Roadmaps',
      backHref: '/',
      downloadLabel: 'Download',
      progressHint: 'Click nodes to track your progress',
      trackProgressLabel: 'Track Progress',
    },
    introCard: {
      ctaHref: '/roadmaps/frontend',
      ctaLabel: 'Explore now',
      description:
        'Use the roadmap to identify the exact topics you need next, instead of guessing what to learn in what order.',
      items: [
        { id: 'road-to-devops', label: 'Road to DevOps Engineer', tone: 'neutral', variant: 'map' },
        {
          id: 'learn-language',
          label: 'Learn a Programming Language',
          tone: 'green',
          variant: 'check',
        },
        { id: 'operating-system', label: 'Operating System', tone: 'green', variant: 'check' },
        { id: 'terminal-knowledge', label: 'Terminal Knowledge', tone: 'pink', variant: 'check' },
        {
          id: 'version-control-systems',
          label: 'Version Control Systems',
          tone: 'pink',
          variant: 'check',
        },
      ],
      title: 'Know Exactly What You\nNeed to Learn',
    },
    nodePanel: {
      aiTutorTabLabel: 'AI Tutor',
      detailsByNodeId: {
        '550e8400-e29b-41d4-a716-446655440100': {
          description:
            'Understand how requests move from the browser to servers, how content is delivered, and where frontend applications fit into the network stack.',
          resources: {
            emptyLabel: 'No resources yet.',
            sections: [
              {
                id: 'free-resources',
                label: 'Free Resources',
                links: [
                  {
                    id: 'internet-mdn-http-overview',
                    label: 'Overview of HTTP',
                    typeLabel: 'Article',
                    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview',
                  },
                  {
                    id: 'internet-cloudflare-dns',
                    label: 'What is DNS?',
                    typeLabel: 'Article',
                    url: 'https://www.cloudflare.com/learning/dns/what-is-dns/',
                  },
                ],
                tone: 'green',
              },
            ],
          },
          tutor: {
            emptyLabel: 'Your AI tutor suggestions will appear here.',
            sections: [
              {
                id: 'tutor-prompts',
                label: 'Your personalized AI tutor',
                links: [
                  {
                    id: 'internet-ai-tutor',
                    label: 'Ask for an explanation of request lifecycle in simple terms',
                    typeLabel: 'Prompt',
                    url: '#',
                  },
                ],
                tone: 'blue',
              },
            ],
          },
        },
        '550e8400-e29b-41d4-a716-446655440101': {
          description:
            'Break down browsers, servers, IP addresses, packets, and the request-response cycle into a mental model you can reuse later.',
          resources: {
            emptyLabel: 'No resources yet.',
            sections: [
              {
                id: 'internet-how-it-works',
                label: 'Free Resources',
                links: [
                  {
                    id: 'how-internet-works-mdn',
                    label: 'How the web works',
                    typeLabel: 'Article',
                    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works',
                  },
                ],
                tone: 'green',
              },
            ],
          },
          tutor: { emptyLabel: 'Your AI tutor suggestions will appear here.', sections: [] },
        },
        '550e8400-e29b-41d4-a716-446655440200': {
          description:
            'Build a correct HTML foundation first: document structure, semantic tags, accessible forms, and content hierarchy.',
          resources: {
            emptyLabel: 'No resources yet.',
            sections: [
              {
                id: 'html-resources',
                label: 'Free Resources',
                links: [
                  {
                    id: 'html-mdn-overview',
                    label: 'HTML basics',
                    typeLabel: 'Article',
                    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax',
                  },
                ],
                tone: 'green',
              },
            ],
          },
          tutor: { emptyLabel: 'Your AI tutor suggestions will appear here.', sections: [] },
        },
        '550e8400-e29b-41d4-a716-446655440300': {
          description:
            'Learn layout systems, responsive rules, and styling constraints that make interfaces predictable across devices.',
          resources: {
            emptyLabel: 'No resources yet.',
            sections: [
              {
                id: 'css-resources',
                label: 'Free Resources',
                links: [
                  {
                    id: 'css-mdn-layout',
                    label: 'CSS layout',
                    typeLabel: 'Article',
                    url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout',
                  },
                ],
                tone: 'green',
              },
            ],
          },
          tutor: { emptyLabel: 'Your AI tutor suggestions will appear here.', sections: [] },
        },
        '550e8400-e29b-41d4-a716-446655440400': {
          description:
            'JavaScript is the control layer of modern frontend applications. Focus on syntax, the DOM, async requests, and state changes in the browser.',
          resources: {
            emptyLabel: 'No resources yet.',
            sections: [
              {
                id: 'javascript-resources',
                label: 'Free Resources',
                links: [
                  {
                    id: 'javascript-mdn-guide',
                    label: 'JavaScript Guide',
                    typeLabel: 'Article',
                    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
                  },
                ],
                tone: 'green',
              },
            ],
          },
          tutor: { emptyLabel: 'Your AI tutor suggestions will appear here.', sections: [] },
        },
      },
      resourcesTabLabel: 'Resources',
      statusLabels: {
        completed: 'Completed',
        in_progress: 'In progress',
        locked: 'Pending',
      },
    },
    promoCard: {
      ctaHref: '/',
      ctaLabel: 'Try now',
      description:
        'Turn the static roadmap into a guided plan. Use the same frontend graph as your baseline, then personalize it for your current skill level, preferred framework, and target role.',
      imageAlt: 'AI assistant illustration',
      imageSrc: '/ai-bird-laptop.png',
      title: 'Personalized Roadmaps Powered by AI',
    },
  },
};
