import { queryOptions } from '@tanstack/react-query';
import { getFeed } from './clip.functions';
export const feedOptions = (input: { page?: number; search?: string; creator?: string; video?: string } = {}) => queryOptions({
  queryKey: ['feed', input], queryFn: () => getFeed({ data: { page: input.page ?? 0, search: input.search ?? '', creator: input.creator, video: input.video } }), staleTime: 30_000, refetchInterval: 30_000,
});