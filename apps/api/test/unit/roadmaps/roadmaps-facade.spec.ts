import { NodeStatus, RoleCategory } from '@repo/db/prisma/client';

import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';

const createService = () => {
  const generation = {
    generate: jest.fn(),
  };
  const query = {
    deleteByIdForOwner: jest.fn(),
    getByIdForOwner: jest.fn(),
    getNodeDetail: jest.fn(),
    listNodes: jest.fn(),
    listUserRoadmaps: jest.fn(),
  };
  const progress = {
    getProgressSummary: jest.fn(),
    startLearning: jest.fn(),
    updateNodeProgress: jest.fn(),
  };
  const quiz = {
    getNodeQuiz: jest.fn(),
    submitNodeQuiz: jest.fn(),
  };
  const milestone = {
    getLatestMilestoneSubmission: jest.fn(),
    submitMilestoneSubmission: jest.fn(),
  };

  return {
    generation,
    milestone,
    progress,
    query,
    quiz,
    service: new RoadmapsService(
      generation as never,
      query as never,
      progress as never,
      quiz as never,
      milestone as never,
    ),
  };
};

describe('RoadmapsService facade', () => {
  it('should delegate read methods to query/progress providers', async () => {
    const { progress, query, service } = createService();

    await service.listUserRoadmaps('user-1', { page: 1, perPage: 20 });
    await service.listNodes('user-1', 'roadmap-1', {});
    await service.getNodeDetail('user-1', 'roadmap-1', 'node-1');
    await service.getByIdForOwner('user-1', 'roadmap-1');
    await service.getProgressSummary('user-1', 'roadmap-1');
    await service.deleteByIdForOwner('user-1', 'roadmap-1');

    expect(query.listUserRoadmaps).toHaveBeenCalledWith('user-1', { page: 1, perPage: 20 });
    expect(query.listNodes).toHaveBeenCalledWith('user-1', 'roadmap-1', {});
    expect(query.getNodeDetail).toHaveBeenCalledWith('user-1', 'roadmap-1', 'node-1');
    expect(query.getByIdForOwner).toHaveBeenCalledWith('user-1', 'roadmap-1');
    expect(progress.getProgressSummary).toHaveBeenCalledWith('user-1', 'roadmap-1');
    expect(query.deleteByIdForOwner).toHaveBeenCalledWith('user-1', 'roadmap-1');
  });

  it('should delegate write/workflow methods to focused providers', async () => {
    const { generation, milestone, progress, quiz, service } = createService();
    const progressDto = { status: NodeStatus.COMPLETED };
    const quizDto = {
      answers: [
        { questionId: 'q1', selectedOption: 'A' as const },
        { questionId: 'q2', selectedOption: 'B' as const },
        { questionId: 'q3', selectedOption: 'C' as const },
        { questionId: 'q4', selectedOption: 'D' as const },
        { questionId: 'q5', selectedOption: 'A' as const },
      ],
    };
    const milestoneDto = { repoUrl: 'https://github.com/acme/project' };
    const generationDto = {
      deadlineDate: '2026-12-31',
      goal: 'Backend developer',
      hoursPerDay: 2,
      quizAnswers: [],
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    };

    await service.generate('user-1', generationDto);
    await service.startLearning('user-1', 'roadmap-1');
    await service.updateNodeProgress('user-1', 'roadmap-1', 'node-1', progressDto);
    await service.getNodeQuiz('user-1', 'roadmap-1', 'node-1');
    await service.submitNodeQuiz('user-1', 'roadmap-1', 'node-1', quizDto);
    await service.submitMilestoneSubmission('user-1', 'roadmap-1', 'node-1', milestoneDto);
    await service.getLatestMilestoneSubmission('user-1', 'roadmap-1', 'node-1');

    expect(generation.generate).toHaveBeenCalledWith('user-1', generationDto);
    expect(progress.startLearning).toHaveBeenCalledWith('user-1', 'roadmap-1');
    expect(progress.updateNodeProgress).toHaveBeenCalledWith(
      'user-1',
      'roadmap-1',
      'node-1',
      progressDto,
    );
    expect(quiz.getNodeQuiz).toHaveBeenCalledWith('user-1', 'roadmap-1', 'node-1');
    expect(quiz.submitNodeQuiz).toHaveBeenCalledWith('user-1', 'roadmap-1', 'node-1', quizDto);
    expect(milestone.submitMilestoneSubmission).toHaveBeenCalledWith(
      'user-1',
      'roadmap-1',
      'node-1',
      milestoneDto,
    );
    expect(milestone.getLatestMilestoneSubmission).toHaveBeenCalledWith(
      'user-1',
      'roadmap-1',
      'node-1',
    );
  });
});
