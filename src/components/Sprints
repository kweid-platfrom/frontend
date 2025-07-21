// SprintList.js
import { useAppSuites } from './AppProvider';

export const SprintList = () => {
    const { sprints, isLoading, error } = useAppSuites();

    if (isLoading) return <div>Loading sprints...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!sprints.length) return <div>No sprints found</div>;

    return (
        <ul>
            {sprints.map((sprint) => (
                <li key={sprint.id}>{sprint.metadata?.name}</li>
            ))}
        </ul>
    );
};