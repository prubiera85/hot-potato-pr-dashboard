import { useQuery } from '@tanstack/react-query';

interface Collaborator {
  id: number;
  login: string;
  avatar_url: string;
}

interface UseCollaboratorsParams {
  owner: string;
  repo: string;
}

export function useCollaborators({ owner, repo }: UseCollaboratorsParams) {
  return useQuery<Collaborator[]>({
    queryKey: ['collaborators', owner, repo],
    queryFn: async () => {
      const response = await fetch(`/api/collaborators?owner=${owner}&repo=${repo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
