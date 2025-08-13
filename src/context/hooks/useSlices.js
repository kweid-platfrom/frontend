import { useAuth as useAuthSlice } from '../slices/authSlice';
import { useSuites } from '../slices/suiteSlice';
import { useTestCases } from '../slices/testCaseSlice';
import { useBugReducer } from '../slices/bugReducer';
import { useRecordings } from '../slices/recordingSlice';
import { useSprints } from '../slices/sprintSlice';
import { useSubscription } from '../slices/subscriptionSlice';
import { useTeam } from '../slices/teamSlice';
import { useAutomation } from '../slices/automationSlice';
import { useUI } from '../slices/uiSlice';
import { useAI } from '../slices/aiSlice';
import { useTheme } from '../slices/themeSlice';
import { useReports } from '../slices/reportSlice';

export const useSlices = () => ({
    auth: useAuthSlice(),
    suites: useSuites(),
    testCases: useTestCases(),
    bugs: useBugReducer(),
    recordings: useRecordings(),
    sprints: useSprints(),
    subscription: useSubscription(),
    team: useTeam(),
    automation: useAutomation(),
    ui: useUI(),
    ai: useAI(),
    reports: useReports(),
    theme: useTheme(),
});

export const getAppState = (slices) => ({
    auth: slices.auth.state,
    suites: slices.suites.state,
    testCases: slices.testCases.state,
    bugs: slices.bugs.state,
    recordings: slices.recordings.state,
    sprints: slices.sprints.state,
    subscription: slices.subscription.state,
    team: slices.team.state,
    automation: slices.automation.state,
    ui: slices.ui.state,
    ai: slices.ai.state,
    reports: slices.reports.state,
    theme: slices.theme.state,
});

export const getAppActions = (slices) => ({
    auth: slices.auth.actions,
    suites: slices.suites.actions,
    testCases: slices.testCases.actions,
    bugs: slices.bugs.actions,
    recordings: slices.recordings.actions,
    sprints: slices.sprints.actions,
    subscription: slices.subscription.actions,
    team: slices.team.actions,
    automation: slices.automation.actions,
    ui: slices.ui.actions,
    ai: slices.ai.actions,
    reports: slices.reports.actions,
    theme: slices.theme.actions,
});