// constants.js
export const TEST_CASE_STATUSES = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PASSED: 'passed',
    FAILED: 'failed',
    BLOCKED: 'blocked'
};

export const PRIORITY_LEVELS = {
    P0: 'P0',
    P1: 'P1',
    P2: 'P2',
    P3: 'P3'
};

export const INITIAL_TEST_CASE = {
    title: '',
    description: '',
    steps: '',
    expectedResult: '',
    tags: '',
    priority: PRIORITY_LEVELS.P1,
    requirementId: '',
    status: TEST_CASE_STATUSES.DRAFT
};