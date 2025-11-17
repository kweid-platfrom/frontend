import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useAIBugGenerator } from '@/context/AIBugGeneratorContext';
import { useApp } from '@/context/AppProvider';
import { Timestamp } from 'firebase/firestore';
import { getPriorityFromSeverity, getBrowserInfo, getDeviceInfo } from '@/utils/bugUtils';

const AIBugGeneratorButton = ({ className = "", onBugCreated }) => {
  const { openGenerator } = useAIBugGenerator();
  const { state, actions, activeSuite, currentUser, isAuthenticated } = useApp();

  const canCreateBugs = state.subscription?.planLimits?.canCreateBugs !== false;
  const hasActiveSubscription = state.subscription?.isTrialActive || state.subscription?.isSubscriptionActive;

  const userDisplayName = () => {
    return state.auth.profile?.displayName ||
      state.auth.profile?.name ||
      currentUser?.displayName ||
      currentUser?.email ||
      'Unknown User';
  };

  const safeToLowerCase = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value.toLowerCase();
    if (typeof value === 'object' && value.toString) return value.toString().toLowerCase();
    return String(value).toLowerCase();
  };

  const handleClick = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!isAuthenticated) {
      actions.ui.showNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to use AI bug generation'
      });
      return;
    }

    if (!activeSuite) {
      actions.ui.showNotification({
        type: 'error',
        title: 'Test Suite Required',
        message: 'Please select a test suite first'
      });
      return;
    }

    if (!canCreateBugs) {
      actions.ui.showNotification({
        type: 'error',
        title: 'Permission Denied',
        message: 'Bug creation requires a higher subscription plan'
      });
      return;
    }

    if (!hasActiveSubscription) {
      actions.ui.showNotification({
        type: 'error',
        title: 'Subscription Required',
        message: 'Please activate your subscription to create bugs'
      });
      return;
    }

    // Open the AI Bug Generator with a callback for when a bug is created
    openGenerator(async (aiBugData) => {
      try {
        // Follow the same pattern as manual bug creation
        const hasAttachments = aiBugData.attachments?.length > 0;
        const priority = getPriorityFromSeverity(aiBugData.severity);
        const currentTimestamp = Timestamp.fromDate(new Date());

        if (!currentUser?.uid) {
          throw new Error('User authentication required');
        }

        if (!activeSuite?.id) {
          throw new Error('Active suite required');
        }

        // Handle module - use custom module if "other" is selected
        const moduleId = aiBugData.module_id || aiBugData.moduleId || null;
        const finalModule = moduleId === 'other'
          ? (aiBugData.customModule || 'Other')
          : moduleId;

        // Handle sprint
        const sprintId = aiBugData.sprint_id || aiBugData.sprintId || null;

        // Ensure stepsToReproduce is a string
        let stepsToReproduce = aiBugData.stepsToReproduce;
        if (Array.isArray(stepsToReproduce)) {
          stepsToReproduce = stepsToReproduce
            .map((step, index) => {
              const cleanStep = typeof step === 'string'
                ? step.replace(/^\d+\.\s*/, '').trim()
                : String(step);
              return `${index + 1}. ${cleanStep}`;
            })
            .join('\n');
        } else if (typeof stepsToReproduce === 'string') {
          stepsToReproduce = stepsToReproduce.trim();
        } else {
          stepsToReproduce = '';
        }

        // Create category tag safely
        const categoryLower = safeToLowerCase(aiBugData.category);
        const categoryTag = categoryLower ? categoryLower.replace(/\s+/g, '_') : 'uncategorized';

        // Build the complete bug data following the manual bug creation pattern
        const bugData = {
          title: String(aiBugData.title || '').trim(),
          description: String(aiBugData.description || '').trim(),
          actualBehavior: String(aiBugData.actualBehavior || '').trim(),
          stepsToReproduce: stepsToReproduce,
          expectedBehavior: String(aiBugData.expectedBehavior || '').trim(),
          workaround: String(aiBugData.workaround || '').trim(),
          assignedTo: aiBugData.assignedTo || null,
          assigned_to: aiBugData.assignedTo || null,
          status: "New",
          priority: priority,
          severity: aiBugData.severity,
          category: aiBugData.category || 'Uncategorized',
          module: finalModule,
          module_id: moduleId,
          customModule: moduleId === 'other' ? aiBugData.customModule : null,
          sprint_id: sprintId,
          sprintId: sprintId,
          tags: [categoryTag],
          source: "AI Generated",
          creationType: "ai",
          environment: aiBugData.environment || "Production",
          frequency: aiBugData.frequency || "Once",
          browserInfo: aiBugData.browserInfo || getBrowserInfo(),
          deviceInfo: aiBugData.deviceInfo || getDeviceInfo(),
          userAgent: aiBugData.userAgent || navigator.userAgent,
          hasConsoleLogs: aiBugData.hasConsoleLogs || false,
          hasNetworkLogs: aiBugData.hasNetworkLogs || false,
          hasAttachments,
          attachments: (aiBugData.attachments || []).map(att => ({
            name: att.name,
            url: att.url || null,
            type: att.type || null,
            size: att.size || null
          })),
          resolution: "",
          resolvedAt: null,
          resolvedBy: null,
          resolvedByName: null,
          comments: [],
          resolutionHistory: [],
          commentCount: 0,
          viewCount: 0,
          suiteId: activeSuite.id,
          created_by: currentUser.uid,
          created_at: currentTimestamp,
          updated_at: currentTimestamp,
          lastActivity: currentTimestamp,
          lastActivityBy: currentUser.uid,
          reportedBy: userDisplayName(),
          reportedByEmail: currentUser.email || "",
          updated_by: currentUser.uid,
          updatedByName: userDisplayName(),
          version: 1,
          searchTerms: [
            safeToLowerCase(aiBugData.title),
            safeToLowerCase(aiBugData.description),
            safeToLowerCase(aiBugData.category),
            safeToLowerCase(aiBugData.severity),
            finalModule ? safeToLowerCase(finalModule) : null,
            "new",
            "ai_generated",
            safeToLowerCase(aiBugData.environment)
          ].filter(Boolean),
          // Preserve AI metadata
          ai_metadata: aiBugData.ai_metadata || null
        };

        console.log('Creating AI bug with complete data:', bugData);
        const result = await actions.bugs.createBug(bugData);
        
        await new Promise(resolve => setTimeout(resolve, 100));

        actions.ui.showNotification({
          type: 'success',
          title: 'AI Bug Created Successfully',
          message: `Bug "${aiBugData.title}" has been created and assigned.`
        });

        // Call the optional callback
        if (onBugCreated && typeof onBugCreated === 'function') {
          await onBugCreated(result);
        }
      } catch (error) {
        console.error('Failed to create AI-generated bug:', error);
        actions.ui.showNotification({
          type: 'error',
          title: 'Bug Creation Failed',
          message: error.message || 'Failed to create bug report'
        });
        throw error; // Re-throw so the modal can handle it
      }
    });
  };

  return (
    <button
      type="button"
      className={`group px-3 py-2 text-sm bg-orange-500 text-white border hover:bg-orange-600 hover:shadow-lg rounded flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={handleClick}
      disabled={!canCreateBugs || !hasActiveSubscription}
      title="Generate bug report with AI"
    >
      <SparklesIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
      <span className="hidden sm:inline font-medium">AI Bug Report</span>
    </button>
  );
};

export default AIBugGeneratorButton;